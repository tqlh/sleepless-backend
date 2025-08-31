const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'sleepless.db');
const db = new sqlite3.Database(dbPath);

console.log('🌙 Setting up sleepless.ink database...');

const testThoughts = [
  "tired but wired", "monday again", "why though", "big mood",
  "narrator voice: it wasn't fine", "touch grass", "same energy",
  "今日も疲れた", "なんで眠れないんだろう", "雨の音が心地いい",
  "made tea and forgot about it. found it cold on the counter 3 hours later",
  "main character energy but side character budget"
];

db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS posts (id TEXT PRIMARY KEY, content TEXT NOT NULL, language TEXT DEFAULT "en", timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, is_bookmarked BOOLEAN DEFAULT 0)');
  
  db.get("SELECT COUNT(*) as count FROM posts", [], (err, row) => {
    if (row && row.count === 0) {
      testThoughts.forEach((content, index) => {
        const postId = (Date.now() + index).toString();
        const language = content.includes('今日') ? 'ja' : 'en';
        db.run("INSERT INTO posts (id, content, language) VALUES (?, ?, ?)", [postId, content, language]);
      });
      console.log('✅ Added sample thoughts');
    }
    db.close();
    console.log('🌙 Database setup complete!');
  });
});