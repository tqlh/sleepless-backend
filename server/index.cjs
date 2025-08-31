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
  
  const postId = Date.now().toString();
  const timestamp = new Date().toISOString();
  
  db.run(
    "INSERT INTO posts (id, content, language, timestamp) VALUES (?, ?, ?, ?)",
    [postId, content, language, timestamp],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      res.json({
        id: postId,
        content,
        language,
        timestamp: new Date(timestamp),
        isBookmarked: false
      });
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

// Get daily post count (simplified)
app.get('/api/daily-count/:fingerprint', (req, res) => {
  res.json({
    count: 0,
    limit: 5,
    remaining: 5
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🌙 Sleepless.ink server running on port ${PORT}`);
  console.log(`Database: ${dbPath}`);
});