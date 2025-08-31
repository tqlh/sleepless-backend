const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'sleepless.db');
const db = new sqlite3.Database(dbPath);

console.log('🌙 Setting up sleepless.ink database...');

// Create posts table
db.run(`
  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    language TEXT DEFAULT 'en',
    timestamp TEXT NOT NULL,
    is_bookmarked INTEGER DEFAULT 0
  )
`);

// Create daily_counts table (ADD THIS!)
db.run(`
  CREATE TABLE IF NOT EXISTS daily_counts (
    fingerprint TEXT,
    date TEXT,
    count INTEGER DEFAULT 0,
    PRIMARY KEY (fingerprint, date)
  )
`);

// Add sample posts if table is empty
db.get("SELECT COUNT(*) as count FROM posts", (err, row) => {
  if (err) {
    console.error('Error checking posts:', err);
    return;
  }
  
  if (row.count === 0) {
    console.log('📝 Adding sample thoughts...');
    
    const samplePosts = [
      ["tired but wired", "en"],
      ["monday again", "en"],
      ["why though", "en"],
      ["big mood", "en"],
      ["narrator voice: it wasn't fine", "en"],
      ["touch grass", "en"],
      ["same energy", "en"],
      ["今日も疲れた", "ja"],
      ["なんで眠れないんだろう", "ja"],
      ["雨の音が心地いい", "ja"],
      ["一人の時間が好き", "ja"],
      ["made tea and forgot about it. found it cold on the counter 3 hours later", "en"],
      ["that brief panic when you can't find your phone while holding your phone", "en"],
      ["why do i always remember embarrassing things from 2019 at 2am", "en"],
      ["spent 20 minutes choosing a netflix show just to scroll on my phone instead", "en"],
      ["accidentally said 'you too' when the cashier said 'happy birthday' to someone behind me", "en"],
      ["grocery shopping while hungry was a financial mistake", "en"],
      ["the commitment it takes to finish a chapstick without losing it", "en"],
      ["having 47 tabs open and somehow still opening more", "en"],
      ["main character energy but side character budget", "en"],
      ["my therapist is gonna hear about this", "en"],
      ["why am i like this (rhetorical)", "en"],
      ["living my best life (citation needed)", "en"],
      ["sounds fake but okay", "en"],
      ["everything is content now apparently", "en"],
      ["we're all just coping mechanisms wearing human suits", "en"],
      ["what if colors look different to everyone but we all learned the same names", "en"],
      ["sometimes i think my cat understands me better than most people", "en"],
      ["wondering if parallel universe me is living my best life", "en"]
    ];
    
    const stmt = db.prepare("INSERT INTO posts (id, content, language, timestamp) VALUES (?, ?, ?, ?)");
    
    samplePosts.forEach((post, index) => {
      const id = (Date.now() + index).toString();
      const timestamp = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString();
      stmt.run(id, post[0], post[1], timestamp);
    });
    
    stmt.finalize();
    console.log('✅ Added sample thoughts');
  }
});

console.log('🌙 Database setup complete!');
