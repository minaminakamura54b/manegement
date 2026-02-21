import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database('construction.db');

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT
  );

  CREATE TABLE IF NOT EXISTS inspections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    project_name TEXT,
    date TEXT,
    location TEXT,
    findings TEXT,
    status TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS trip_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    destination TEXT,
    date_start TEXT,
    date_end TEXT,
    purpose TEXT,
    results TEXT,
    expenses INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS estimates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    client_name TEXT,
    project_name TEXT,
    amount INTEGER,
    details TEXT,
    status TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS minutes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT,
    date TEXT,
    attendees TEXT,
    content TEXT,
    action_items TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed default user if not exists
const row = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
if (!row) {
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('admin', hashedPassword, 'admin');
}

declare module 'express-session' {
  interface SessionData {
    userId: number;
    username: string;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(session({
    secret: 'construction-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      httpOnly: true
    }
  }));

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    if (req.session.userId) {
      next();
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
  };

  // Auth Routes
  app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user: any = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (user && bcrypt.compareSync(password, user.password)) {
      req.session.userId = user.id;
      req.session.username = user.username;
      res.json({ id: user.id, username: user.username, role: user.role });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });

  app.post('/api/logout', (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  app.get('/api/me', (req: any, res) => {
    if (req.session.userId) {
      res.json({ id: req.session.userId, username: req.session.username });
    } else {
      res.status(401).json({ error: 'Not logged in' });
    }
  });

  // Business Logic Routes
  // Inspections
  app.get('/api/inspections', authenticate, (req: any, res) => {
    const rows = db.prepare('SELECT * FROM inspections ORDER BY created_at DESC').all();
    res.json(rows);
  });
  app.post('/api/inspections', authenticate, (req: any, res) => {
    const { project_name, date, location, findings, status } = req.body;
    const result = db.prepare('INSERT INTO inspections (user_id, project_name, date, location, findings, status) VALUES (?, ?, ?, ?, ?, ?)')
      .run(req.session.userId, project_name, date, location, findings, status);
    res.json({ id: result.lastInsertRowid });
  });

  // Trip Reports
  app.get('/api/trip-reports', authenticate, (req: any, res) => {
    const rows = db.prepare('SELECT * FROM trip_reports ORDER BY created_at DESC').all();
    res.json(rows);
  });
  app.post('/api/trip-reports', authenticate, (req: any, res) => {
    const { destination, date_start, date_end, purpose, results, expenses } = req.body;
    const result = db.prepare('INSERT INTO trip_reports (user_id, destination, date_start, date_end, purpose, results, expenses) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(req.session.userId, destination, date_start, date_end, purpose, results, expenses);
    res.json({ id: result.lastInsertRowid });
  });

  // Estimates
  app.get('/api/estimates', authenticate, (req: any, res) => {
    const rows = db.prepare('SELECT * FROM estimates ORDER BY created_at DESC').all();
    res.json(rows);
  });
  app.post('/api/estimates', authenticate, (req: any, res) => {
    const { client_name, project_name, amount, details, status } = req.body;
    const result = db.prepare('INSERT INTO estimates (user_id, client_name, project_name, amount, details, status) VALUES (?, ?, ?, ?, ?, ?)')
      .run(req.session.userId, client_name, project_name, amount, details, status);
    res.json({ id: result.lastInsertRowid });
  });

  // Minutes
  app.get('/api/minutes', authenticate, (req: any, res) => {
    const rows = db.prepare('SELECT * FROM minutes ORDER BY created_at DESC').all();
    res.json(rows);
  });
  app.post('/api/minutes', authenticate, (req: any, res) => {
    const { title, date, attendees, content, action_items } = req.body;
    const result = db.prepare('INSERT INTO minutes (user_id, title, date, attendees, content, action_items) VALUES (?, ?, ?, ?, ?, ?)')
      .run(req.session.userId, title, date, attendees, content, action_items);
    res.json({ id: result.lastInsertRowid });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
