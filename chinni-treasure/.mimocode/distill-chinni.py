import sqlite3, json, time

db = sqlite3.connect(r'C:\Users\deepa\.local\share\mimocode\mimocode.db', uri=True)
db.row_factory = sqlite3.Row
c = db.cursor()

cutoff = int((time.time() - 30*24*3600) * 1000)

# Find chinni-treasure sessions
print('=== CHINNI-TREASURE SESSIONS (all tool calls) ===')
c.execute("""
  SELECT m.session_id, json_extract(p.data, '$.tool') as tool,
         substr(json_extract(p.data, '$.state.input'), 1, 200) as input_preview
  FROM message m
  JOIN part p ON p.message_id = m.id
  WHERE json_extract(m.data, '$.role') = 'assistant'
    AND json_extract(p.data, '$.type') = 'tool'
    AND m.session_id IN (
      SELECT id FROM session WHERE directory LIKE '%chinni-treasure%'
    )
  ORDER BY m.session_id, m.time_created
""")
for r in c.fetchall():
    print(f"{r['session_id']} | {r['tool']} | {r['input_preview']}")

print('\n=== CHINNI-TREASURE USER MESSAGES ===')
c.execute("""
  SELECT m.session_id, substr(json_extract(m.data, '$.content'), 1, 300) as msg
  FROM message m
  WHERE json_extract(m.data, '$.role') = 'user'
    AND m.session_id IN (
      SELECT id FROM session WHERE directory LIKE '%chinni-treasure%'
    )
  ORDER BY m.session_id, m.time_created
""")
for r in c.fetchall():
    print(f"{r['session_id']} | {r['msg']}")

db.close()
