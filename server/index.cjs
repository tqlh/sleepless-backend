const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(bodyParser.json());

const dbPath = path.join(__dirname, 'sleepless.db');
const db = new sqlite3.Database(dbPath);

// Force create daily_counts table on startup
db.run(`
  CREATE TABLE IF NOT EXISTS daily_counts (
    fingerprint TEXT,
    date TEXT,
    count INTEGER DEFAULT 0,
    PRIMARY KEY (fingerprint, date)
  )
`, (err) => {
  if (err) {
    console.error('Error creating daily_counts table:', err);
  } else {
    console.log('✅ daily_counts table created/verified');
  }
});

// Get all posts
app.get('/api/posts', (req, res) => {
  db.all(`
    SELECT id, content, language, timestamp, is_bookmarked 
    FROM posts 
    ORDER BY timestamp DESC 
    LIMIT 500
  `, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const posts = rows.map(row => ({
      id: row.id,
      content: row.content,
      language: row.language,
      timestamp: new Date(row.timestamp),
      isBookmarked: Boolean(row.is_bookmarked)
    }));
    
    res.json(posts);
  });
});

// Create new post
app.post('/api/posts', (req, res) => {
  const { content, language = 'en', userFingerprint } = req.body;
  
  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }
  
  // Check daily limit FIRST
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  db.get(
    "SELECT count FROM daily_counts WHERE fingerprint = ? AND date = ?",
    [userFingerprint, today],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const currentCount = row ? row.count : 0;
      
      // Check if user has reached daily limit
      if (currentCount >= 5) {
        return res.status(429).json({ 
          error: 'Daily posting limit reached (5 posts per day)',
          count: currentCount,
          limit: 5
        });
      }
      
      // Create post
      const postId = Date.now().toString();
      const timestamp = new Date().toISOString();
      
      db.run(
        "INSERT INTO posts (id, content, language, timestamp) VALUES (?, ?, ?, ?)",
        [postId, content, language, timestamp],
        function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          // Increment daily count for this user
          db.run(
            "INSERT OR REPLACE INTO daily_counts (fingerprint, date, count) VALUES (?, ?, ?)",
            [userFingerprint, today, currentCount + 1],
            function(countErr) {
              if (countErr) {
                console.error('Failed to update daily count:', countErr);
              }
            }
          );
          
          res.json({
            id: postId,
            content,
            language,
            timestamp: new Date(timestamp),
            isBookmarked: false
          });
        }
      );
    }
  );
});

// Toggle bookmark
app.patch('/api/posts/:id/bookmark', (req, res) => {
  const { id } = req.params;
  const { isBookmarked } = req.body;
  
  db.run(
    "UPDATE posts SET is_bookmarked = ? WHERE id = ?",
    [isBookmarked ? 1 : 0, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      res.json({ success: true });
    }
  );
});

// Get daily post count
app.get('/api/daily-count/:fingerprint', (req, res) => {
  const { fingerprint } = req.params;
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  // Get daily count for this fingerprint
  db.get(
    "SELECT count FROM daily_counts WHERE fingerprint = ? AND date = ?",
    [fingerprint, today],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const count = row ? row.count : 0;
      const limit = 5;
      const remaining = Math.max(0, limit - count);
      
      res.json({
        count,
        limit,
        remaining
      });
    }
  );
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🌙 Sleepless.ink server running on port ${PORT}`);
  console.log(`Database: ${dbPath}`);
});
