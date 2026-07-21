import sqlite3
db = sqlite3.connect(r'C:\Users\deepa\.local\share\mimocode\mimicode.db')
c = db.cursor()
c.execute("SELECT count(*) FROM sqlite_master")
print("master count:", c.fetchone()[0])
c.execute("SELECT name FROM sqlite_master")
print("tables:", c.fetchall())
db.close()
