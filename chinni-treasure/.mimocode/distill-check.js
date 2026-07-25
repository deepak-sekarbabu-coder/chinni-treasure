import Database from 'better-sqlite3';
const db = new Database('C:\\Users\\deepa\\.local\\share\\mimocode\\mimicode.db', { readonly: true });

console.log('=== TABLES ===');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log(tables.map(r => r.name));

console.log('\n=== RECENT SESSIONS (last 30 days) ===');
const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
const sessions = db.prepare(
  "SELECT id, title, directory, time_created FROM session WHERE time_created > ? ORDER BY time_created DESC"
).all(cutoff);
sessions.forEach(s => console.log(`${s.id} | ${new Date(s.time_created).toISOString().slice(0,10)} | ${s.title}`));

console.log('\n=== TOP TOOL USAGE (last 30 days) ===');
const tools = db.prepare(`
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
`).all(cutoff);
tools.forEach(t => console.log(`${t.n}x | ${t.tool} | ${t.input_preview}`));

console.log('\n=== USER KEYWORD SEARCH (repeated intent) ===');
const keywords = ['again', 'every time', 'like last time', 'the usual', 'repeat', 'same as before', 'as before', 'previously'];
for (const kw of keywords) {
  const rows = db.prepare(`
    SELECT m.session_id, substr(json_extract(m.data, '$.content'), 1, 200) as snippet
    FROM message m
    WHERE json_extract(m.data, '$.role') = 'user'
      AND json_extract(m.data, '$.content') LIKE ?
      AND m.time_created > ?
    LIMIT 5
  `).all(`%${kw}%`, cutoff);
  if (rows.length > 0) {
    console.log(`\nKeyword "${kw}": ${rows.length} hits`);
    rows.forEach(r => console.log(`  ${r.session_id} | ${r.snippet}`));
  }
}

console.log('\n=== REPEATED FILE PATHS IN TOOL INPUTS ===');
const filePaths = db.prepare(`
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
`).all(cutoff);
filePaths.forEach(f => console.log(`${f.n}x | ${f.tool} | ${f.input}`));

db.close();
