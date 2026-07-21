import sqlite3, json, datetime, os

db_path = os.path.join(os.path.expanduser("~"), ".local", "share", "mimocode", "mimocode.db")
db = sqlite3.connect(db_path)
cur = db.cursor()

# List all sessions for this project
cur.execute("""SELECT s.id, s.title, s.time_created FROM session s 
WHERE s.project_id = '3e5bb28e-aa2e-4fd2-ae87-c670dc6e9bdf' 
ORDER BY s.time_created DESC""")
print("=== ALL SESSIONS ===")
for r in cur.fetchall():
    dt = datetime.datetime.fromtimestamp(r[2]/1000)
    print(f"  {r[0]} | {dt.strftime('%Y-%m-%d %H:%M')} | {r[1]}")

# 7-day cutoff
cutoff = (datetime.datetime.now() - datetime.timedelta(days=7)).timestamp() * 1000
print(f"\n=== SESSIONS IN LAST 7 DAYS (cutoff={datetime.datetime.fromtimestamp(cutoff/1000).strftime('%Y-%m-%d')}) ===")
cur.execute("""SELECT s.id, s.title, s.time_created FROM session s 
WHERE s.project_id = '3e5bb28e-aa2e-4fd2-ae87-c670dc6e9bdf' 
AND s.time_created >= ?
ORDER BY s.time_created DESC""", (cutoff,))
recent = cur.fetchall()
for r in recent:
    dt = datetime.datetime.fromtimestamp(r[2]/1000)
    print(f"  {r[0]} | {dt.strftime('%Y-%m-%d %H:%M')} | {r[1]}")

# For non-current sessions in the window, get assistant messages with tool calls
skip_sessions = {
    'ses_07d2bcf3affeM6Kyclj10KzNao',  # Auto Distill (current)
    'ses_07d2bcf45ffe7Uil06pVUPJPop',  # Auto Dream (current)
    'ses_07d2bcfa9ffe4Rsqe7XjmstEcK',  # Running Dream (current)
}
for r in recent:
    sid = r[0]
    if sid in skip_sessions:
        continue
    print(f"\n=== SESSION {sid} - {r[1]} ===")
    cur.execute("""SELECT m.id, json_extract(m.data, '$.role') as role
    FROM message m WHERE m.session_id = ? ORDER BY m.time_created""", (sid,))
    msgs = cur.fetchall()
    print(f"  Total messages: {len(msgs)}")
    for msg in msgs:
        mid = msg[0]
        role = msg[1]
        # Get parts for this message
        cur.execute("""SELECT json_extract(p.data, '$.type') as ptype, 
        json_extract(p.data, '$.tool') as tool,
        substr(p.data, 1, 600) as preview
        FROM part p WHERE p.message_id = ? ORDER BY p.time_created""", (mid,))
        parts = cur.fetchall()
        for pt in parts:
            if role == 'user':
                print(f"  USER: {pt[2][:200]}")
            elif pt[0] == 'text':
                # Extract just the text content
                try:
                    pdata = json.loads(pt[2].split('preview: ')[-1] if 'preview: ' in pt[2] else pt[2])
                except:
                    pass
                print(f"  ASSISTANT TEXT: {str(pt[2])[:300]}")
            elif pt[0] == 'tool':
                print(f"  TOOL: {pt[1]} -> {str(pt[2])[:200]}")
            elif pt[0] in ('step-start', 'step-finish'):
                print(f"  STEP: {pt[0]}")

db.close()
