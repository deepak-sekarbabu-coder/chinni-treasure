import sqlite3, json, time

db = sqlite3.connect(r'C:\Users\deepa\.local\share\mimocode\mimocode.db', uri=True)
db.row_factory = sqlite3.Row
c = db.cursor()

print('=== TABLES ===')
c.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [r[0] for r in c.fetchall()]
print(tables)

cutoff = int((time.time() - 30*24*3600) * 1000)

if 'session' in tables:
    print('\n=== RECENT SESSIONS (last 30 days) ===')
    c.execute("SELECT id, title, directory, time_created FROM session WHERE time_created > ? ORDER BY time_created DESC", (cutoff,))
    for r in c.fetchall():
        ts = time.strftime('%Y-%m-%d', time.gmtime(r['time_created']/1000))
        print(f"{r['id']} | {ts} | {r['title']}")

if 'message' in tables and 'part' in tables:
    print('\n=== TOP TOOL USAGE (last 30 days) ===')
    c.execute("""
      SELECT json_extract(p.data, '$.tool') as tool,
             substr(json_extract(p.data, '$.state.input'), 1, 150) as input_preview,
             count(*) as n
      FROM message m
      JOIN part p ON p.message_id = m.id
      WHERE json_extract(m.data, '$.role') = 'assistant'
        AND json_extract(p.data, '$.type') = 'tool'
        AND m.time_created > ?
      GROUP BY tool, input_preview
      ORDER BY n DESC
      LIMIT 40
    """, (cutoff,))
    for r in c.fetchall():
        print(f"{r['n']}x | {r['tool']} | {r['input_preview']}")

    print('\n=== USER KEYWORD SEARCH (repeated intent) ===')
    keywords = ['again', 'every time', 'like last time', 'the usual', 'repeat', 'same as before', 'as before', 'previously']
    for kw in keywords:
        c.execute("""
          SELECT m.session_id, substr(json_extract(m.data, '$.content'), 1, 200) as snippet
          FROM message m
          WHERE json_extract(m.data, '$.role') = 'user'
            AND json_extract(m.data, '$.content') LIKE ?
            AND m.time_created > ?
          LIMIT 5
        """, (f'%{kw}%', cutoff))
        rows = c.fetchall()
        if rows:
            print(f'\nKeyword "{kw}": {len(rows)} hits')
            for r in rows:
                print(f"  {r['session_id']} | {r['snippet']}")

    print('\n=== REPEATED TOOL+INPUT PATTERNS ===')
    c.execute("""
      SELECT json_extract(p.data, '$.tool') as tool,
             substr(json_extract(p.data, '$.state.input'), 1, 300) as input,
             count(*) as n
      FROM message m
      JOIN part p ON p.message_id = m.id
      WHERE json_extract(m.data, '$.role') = 'assistant'
        AND json_extract(p.data, '$.type') = 'tool'
        AND m.time_created > ?
      GROUP BY tool, input
      HAVING n >= 2
      ORDER BY n DESC
      LIMIT 30
    """, (cutoff,))
    for r in c.fetchall():
        print(f"{r['n']}x | {r['tool']} | {r['input']}")

db.close()
