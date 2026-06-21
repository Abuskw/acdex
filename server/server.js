require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret123';
let LECTURER_CODE = process.env.LECTURER_CODE || 'teach2025';

// Database
const db = new Database(path.join(__dirname, 'lecturevault.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS faculties (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL);
  CREATE TABLE IF NOT EXISTS departments (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, facultyId INTEGER REFERENCES faculties(id));
  CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, fullName TEXT NOT NULL, role TEXT DEFAULT 'student', studentLevel INTEGER, departmentId INTEGER);
  CREATE TABLE IF NOT EXISTS courses (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT UNIQUE NOT NULL, title TEXT NOT NULL, level INTEGER NOT NULL, semester INTEGER NOT NULL, units INTEGER DEFAULT 2, departmentId INTEGER REFERENCES departments(id));
  CREATE TABLE IF NOT EXISTS lectures (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, description TEXT, weekNumber INTEGER NOT NULL, fileUrl TEXT NOT NULL, fileName TEXT, fileSize INTEGER, academicYear TEXT NOT NULL, courseId INTEGER REFERENCES courses(id), uploaderId INTEGER REFERENCES users(id), downloads INTEGER DEFAULT 0, views INTEGER DEFAULT 0, status TEXT DEFAULT 'published', createdAt DATETIME DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS ratings (id INTEGER PRIMARY KEY AUTOINCREMENT, value INTEGER CHECK(value>=1 AND value<=5), comment TEXT, userId INTEGER REFERENCES users(id), lectureId INTEGER REFERENCES lectures(id));
  CREATE TABLE IF NOT EXISTS comments (id INTEGER PRIMARY KEY AUTOINCREMENT, text TEXT NOT NULL, userId INTEGER REFERENCES users(id), lectureId INTEGER REFERENCES lectures(id), parentId INTEGER REFERENCES comments(id), createdAt DATETIME DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS bookmarks (id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER REFERENCES users(id), lectureId INTEGER REFERENCES lectures(id));
`);
try { db.exec(`ALTER TABLE users ADD COLUMN banned INTEGER DEFAULT 0`); } catch {}
try { db.exec(`ALTER TABLE lectures ADD COLUMN status TEXT DEFAULT 'published'`); } catch {}
db.exec(`
  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lectureId INTEGER REFERENCES lectures(id),
    userId INTEGER REFERENCES users(id),
    reason TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME || 'demo',
  api_key: process.env.CLOUDINARY_KEY || '0000',
  api_secret: process.env.CLOUDINARY_SECRET || '0000'
});

const upload = multer({ dest: path.join(__dirname, 'uploads') });

app.use(cors());
app.use(express.json());

const auth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
};

const adminAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    req.user = decoded; next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
};

// Seed data - only faculties and departments, NO courses
const facCount = db.prepare('SELECT COUNT(*) as c FROM faculties').get().c;
if (facCount === 0) {
  const faculties = [
    'Faculty of Agriculture','Basic Medical Sciences','Earth and Environmental Sciences',
    'Faculty of Education','Faculty of Humanities','Faculty of Law',
    'Faculty of Management Sciences','Faculty of Natural and Applied Sciences','Faculty of Social Sciences'
  ];
  const depts = {
    'Faculty of Agriculture': ['Agricultural Science','Fisheries and Aquaculture','Forestry and Wildlife Management'],
    'Basic Medical Sciences': ['Medical Laboratory Science','Nursing','Physiotherapy','Medicine and Surgery'],
    'Earth and Environmental Sciences': ['Environmental Management','Geography','Meteorology'],
    'Faculty of Education': ['Education','Special Education','Educational Psychology and Counseling','Education Management','Science Education','Mathematics and Computer Science Education'],
    'Faculty of Humanities': ['Arabic','English and French','Nigerian Languages','History and Security Studies','Islamic Studies'],
    'Faculty of Law': ['Law'],
    'Faculty of Management Sciences': ['Accounting','Business Administration','Public Administration','Local Government and Development Studies'],
    'Faculty of Natural and Applied Sciences': ['Biochemistry','Biological Sciences','Pure and Industrial Chemistry','Computer Science','Mathematics','MicroBiological Sciences','Physics','Statistics'],
    'Faculty of Social Sciences': ['Economics','Political Science','Sociology','International Relations','Library and Information Science']
  };
  const insertF = db.prepare('INSERT INTO faculties (name) VALUES (?)');
  const insertD = db.prepare('INSERT INTO departments (name, facultyId) VALUES (?, ?)');
  faculties.forEach(f => {
    const fac = insertF.run(f);
    (depts[f] || []).forEach(d => insertD.run(d, fac.lastInsertRowid));
  });
  console.log('Database seeded (faculties & departments only)');
}

// AUTH (Firebase)
app.post('/api/auth/firebase', async (req, res) => {
  try {
    const { email, fullName, role, lecturerCode } = req.body;
    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    let finalRole = role || 'student';
    if (role === 'lecturer' && lecturerCode !== LECTURER_CODE) return res.status(403).json({ error: 'Invalid lecturer code' });
    if (user) {
      if (role === 'lecturer' && user.role !== 'lecturer') db.prepare('UPDATE users SET role=? WHERE id=?').run('lecturer', user.id);
      const token = jwt.sign({ userId: user.id, email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
      const { password: _, ...u } = user;
      return res.json({ token, user: u });
    }
    const result = db.prepare('INSERT INTO users (email, password, fullName, role) VALUES (?,?,?,?)').run(email, 'firebase', fullName, finalRole);
    const newUser = { id: result.lastInsertRowid, email, fullName, role: finalRole };
    const token = jwt.sign({ userId: newUser.id, email, role: finalRole }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: newUser });
  } catch (e) { res.status(500).json({ error: 'Auth failed' }); }
});

// COURSES
app.get('/api/courses', (req, res) => {
  const { level, search } = req.query;
  let q = 'SELECT * FROM courses WHERE 1=1', p = [];
  if (level) { q += ' AND level=?'; p.push(level); }
  if (search) { q += ' AND (title LIKE ? OR code LIKE ?)'; p.push(`%${search}%`, `%${search}%`); }
  res.json(db.prepare(q + ' ORDER BY level, code').all(...p));
});

app.post('/api/courses/create', (req, res) => {
  const { code, title, departmentId, level } = req.body;
  const existing = db.prepare('SELECT * FROM courses WHERE code = ?').get(code);
  if (existing) return res.json(existing);
  const result = db.prepare('INSERT INTO courses (code, title, level, semester, departmentId) VALUES (?,?,?,1,?)').run(code, title, level||100, departmentId);
  res.json({ id: result.lastInsertRowid, code, title });
});

app.get('/api/courses/:id/lectures', (req, res) => {
  res.json(db.prepare(`SELECT l.*, u.fullName as uploaderName FROM lectures l LEFT JOIN users u ON l.uploaderId=u.id WHERE l.courseId=? AND l.status='published' ORDER BY l.weekNumber`).all(req.params.id));
});

// FACULTIES & DEPARTMENTS
app.get('/api/faculties', (req, res) => res.json(db.prepare('SELECT * FROM faculties ORDER BY name').all()));
app.get('/api/faculties/:id/departments', (req, res) => res.json(db.prepare('SELECT * FROM departments WHERE facultyId=? ORDER BY name').all(req.params.id)));
app.get('/api/departments', (req, res) => res.json(db.prepare('SELECT * FROM departments ORDER BY name').all()));

// UPLOAD
app.post('/api/lectures/upload', auth, upload.single('pdf'), async (req, res) => {
  try {
    const { title, weekNumber, courseId, academicYear } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file' });
    const result = await cloudinary.uploader.upload(file.path, { resource_type: 'raw', folder: 'lecturevault' });
    fs.unlinkSync(file.path);
    db.prepare('INSERT INTO lectures (title, weekNumber, fileUrl, fileName, fileSize, academicYear, courseId, uploaderId) VALUES (?,?,?,?,?,?,?,?)')
      .run(title, parseInt(weekNumber), result.secure_url, file.originalname, file.size, academicYear, parseInt(courseId), req.user.userId);
    res.json({ message: 'Uploaded', fileUrl: result.secure_url });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DOWNLOAD & VIEW
app.get('/api/lectures/:id/download', (req, res) => {
  const l = db.prepare('SELECT * FROM lectures WHERE id=?').get(req.params.id);
  if (!l) return res.status(404).json({ error: 'Not found' });
  db.prepare('UPDATE lectures SET downloads=downloads+1 WHERE id=?').run(req.params.id);
  res.redirect(l.fileUrl);
});

app.get('/api/lectures/:id/view', async (req, res) => {
  const l = db.prepare('SELECT * FROM lectures WHERE id=?').get(req.params.id);
  if (!l) return res.status(404).json({ error: 'Not found' });
  const https = require('https');
  https.get(l.fileUrl, (pdfRes) => {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Access-Control-Allow-Origin', '*');
    pdfRes.pipe(res);
  }).on('error', () => res.redirect(l.fileUrl));
});

// RATINGS
app.post('/api/lectures/:id/rate', auth, (req, res) => {
  const { value, comment } = req.body;
  const ex = db.prepare('SELECT id FROM ratings WHERE userId=? AND lectureId=?').get(req.user.userId, req.params.id);
  ex ? db.prepare('UPDATE ratings SET value=?, comment=? WHERE id=?').run(value, comment, ex.id)
     : db.prepare('INSERT INTO ratings (value, comment, userId, lectureId) VALUES (?,?,?,?)').run(value, comment, req.user.userId, req.params.id);
  res.json({ avg: db.prepare('SELECT AVG(value) as a FROM ratings WHERE lectureId=?').get(req.params.id).a });
});

// COMMENTS
app.get('/api/lectures/:id/comments', (req, res) => {
  const comments = db.prepare('SELECT c.*, u.fullName FROM comments c JOIN users u ON c.userId=u.id WHERE lectureId=? AND parentId IS NULL ORDER BY c.createdAt DESC').all(req.params.id);
  res.json(comments.map(c => ({...c, replies: db.prepare('SELECT c2.*, u2.fullName FROM comments c2 JOIN users u2 ON c2.userId=u2.id WHERE parentId=? ORDER BY c2.createdAt').all(c.id)})));
});

app.post('/api/lectures/:id/comments', auth, (req, res) => {
  const { text, parentId } = req.body;
  const r = db.prepare('INSERT INTO comments (text, userId, lectureId, parentId) VALUES (?,?,?,?)').run(text, req.user.userId, req.params.id, parentId||null);
  res.json(db.prepare('SELECT c.*, u.fullName FROM comments c JOIN users u ON c.userId=u.id WHERE c.id=?').get(r.lastInsertRowid));
});

// BULK UPLOAD
app.post('/api/lectures/bulk-upload', auth, upload.array('pdfs', 20), async (req, res) => {
  try {
    const { courseId, academicYear } = req.body;
    const files = req.files;
    if (!files?.length) return res.status(400).json({ error: 'No files' });
    let count = 0;
    for (let i = 0; i < files.length; i++) {
      const result = await cloudinary.uploader.upload(files[i].path, { resource_type: 'raw', folder: 'lecturevault' });
      fs.unlinkSync(files[i].path);
      db.prepare('INSERT INTO lectures (title, weekNumber, fileUrl, fileName, fileSize, academicYear, courseId, uploaderId) VALUES (?,?,?,?,?,?,?,?)')
        .run(`Week ${i+1}`, i+1, result.secure_url, files[i].originalname, files[i].size, academicYear, parseInt(courseId), req.user.userId);
      count++;
    }
    res.json({ message: `${count} uploaded`, count });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ADMIN
app.get('/api/admin/stats', adminAuth, (req, res) => {
  res.json({
    users: db.prepare('SELECT COUNT(*) as c FROM users').get().c,
    courses: db.prepare('SELECT COUNT(*) as c FROM courses').get().c,
    lectures: db.prepare('SELECT COUNT(*) as c FROM lectures').get().c
  });
});

app.get('/api/admin/users', adminAuth, (req, res) => {
  res.json(db.prepare('SELECT id, email, fullName, role, banned, createdAt FROM users ORDER BY createdAt DESC').all());
});

app.put('/api/admin/users/:id/role', adminAuth, (req, res) => {
  db.prepare('UPDATE users SET role=? WHERE id=?').run(req.body.role, req.params.id);
  res.json({ success: true });
});

app.put('/api/admin/users/:id/ban', adminAuth, (req, res) => {
  db.prepare('UPDATE users SET banned=? WHERE id=?').run(req.body.banned, req.params.id);
  res.json({ success: true });
});

app.delete('/api/admin/users/:id', adminAuth, (req, res) => {
  db.prepare('DELETE FROM users WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

app.get('/api/admin/lectures', adminAuth, (req, res) => {
  res.json(db.prepare(`SELECT l.*, c.code as courseCode, u.fullName as uploaderName FROM lectures l JOIN courses c ON l.courseId=c.id JOIN users u ON l.uploaderId=u.id ORDER BY l.createdAt DESC`).all());
});

app.put('/api/admin/lectures/:id/status', adminAuth, (req, res) => {
  db.prepare('UPDATE lectures SET status=? WHERE id=?').run(req.body.status, req.params.id);
  res.json({ success: true });
});

app.delete('/api/admin/lectures/:id', adminAuth, async (req, res) => {
  try {
    const lecture = db.prepare('SELECT * FROM lectures WHERE id=?').get(req.params.id);
    if (!lecture) return res.status(404).json({ error: 'Not found' });
    if (lecture.fileUrl && lecture.fileUrl.includes('cloudinary.com')) {
      const parts = lecture.fileUrl.split('/');
      const filename = parts[parts.length-1].split('.')[0];
      try { await cloudinary.uploader.destroy(`lecturevault/${filename}`, { resource_type: 'raw' }); } catch {}
    }
    db.prepare('DELETE FROM comments WHERE lectureId=?').run(req.params.id);
    db.prepare('DELETE FROM ratings WHERE lectureId=?').run(req.params.id);
    db.prepare('DELETE FROM bookmarks WHERE lectureId=?').run(req.params.id);
    db.prepare('DELETE FROM lectures WHERE id=?').run(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/reports', adminAuth, (req, res) => {
  res.json(db.prepare(`SELECT r.*, l.title as lectureTitle, c.code as courseCode, u.fullName as reporterName FROM reports r JOIN lectures l ON r.lectureId=l.id JOIN courses c ON l.courseId=c.id JOIN users u ON r.userId=u.id ORDER BY r.createdAt DESC`).all());
});

app.delete('/api/admin/reports/:id', adminAuth, (req, res) => {
  db.prepare('DELETE FROM reports WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

app.get('/api/admin/analytics', adminAuth, (req, res) => {
  res.json({
    totalUsers: db.prepare('SELECT COUNT(*) as c FROM users').get().c,
    totalCourses: db.prepare('SELECT COUNT(*) as c FROM courses').get().c,
    totalLectures: db.prepare('SELECT COUNT(*) as c FROM lectures').get().c,
    totalDownloads: db.prepare('SELECT SUM(downloads) as c FROM lectures').get().c||0,
    topCourses: db.prepare(`SELECT c.code, c.title, COUNT(l.id) as lectureCount FROM courses c LEFT JOIN lectures l ON l.courseId=c.id GROUP BY c.id ORDER BY lectureCount DESC LIMIT 5`).all()
  });
});

// 404
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));