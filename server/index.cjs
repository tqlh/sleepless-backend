const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./database.cjs');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(bodyParser.json());

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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: 'Content is required' });
  }

  // Check daily limit
  const today = new Date().toISOString().split('T')[0];
  
  db.get(`
    SELECT count FROM daily_counts 
    WHERE fingerprint = ? AND date = ?
  `, [userFingerprint, today], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const currentCount = row ? row.count : 0;
    const dailyLimit = 5;

    if (currentCount >= dailyLimit) {
      return res.status(429).json({ 
        error: 'Daily posting limit reached',
        count: currentCount,
        limit: dailyLimit,
        remaining: 0
      });
    }

    // Create the post
    const timestamp = new Date().toISOString();
    db.run(`
      INSERT INTO posts (content, language, timestamp, is_bookmarked)
      VALUES (?, ?, ?, 0)
    `, [content.trim(), language, timestamp], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Update daily count
      db.run(`
        INSERT OR REPLACE INTO daily_counts (fingerprint, date, count)
        VALUES (?, ?, ?)
      `, [userFingerprint, today, currentCount + 1], (err) => {
        if (err) {
          console.error('Error updating daily count:', err);
        }
      });

      // Return the created post
      const newPost = {
        id: this.lastID.toString(),
        content: content.trim(),
        language,
        timestamp: new Date(timestamp),
        isBookmarked: false
      };

      res.status(201).json(newPost);
    });
  });
});

// Toggle bookmark
app.patch('/api/posts/:id/bookmark', (req, res) => {
  const { id } = req.params;
  const { isBookmarked } = req.body;

  db.run(`
    UPDATE posts SET is_bookmarked = ? WHERE id = ?
  `, [isBookmarked ? 1 : 0, id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({ success: true });
  });
});

// Get daily count
app.get('/api/daily-count/:fingerprint', (req, res) => {
  const { fingerprint } = req.params;
  const today = new Date().toISOString().split('T')[0];

  db.get(`
    SELECT count FROM daily_counts 
    WHERE fingerprint = ? AND date = ?
  `, [fingerprint, today], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const count = row ? row.count : 0;
    const limit = 5;
    const remaining = Math.max(0, limit - count);

    res.json({ count, limit, remaining });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
