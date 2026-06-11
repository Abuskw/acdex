require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
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
// Add banned column if not exists (SQLite doesn't support IF NOT EXISTS for columns, so we use a try-catch)
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
// Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME || 'demo',
  api_key: process.env.CLOUDINARY_KEY || '0000',
  api_secret: process.env.CLOUDINARY_SECRET || '0000'
});

// Multer
const upload = multer({ dest: path.join(__dirname, 'uploads') });

// Middleware
app.use(cors());
app.use(express.json());

// Auth middleware
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

// Seed data
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
  
  const courseData = {
    // Faculty of Agriculture
    'Agricultural Science': [
      { code: 'AGR101', title: 'B. Agriculture', level: 100, semester: 1 },
      { code: 'AGR102', title: 'B.Sc. Food Science and Technology', level: 100, semester: 1 },
    ],
    'Fisheries and Aquaculture': [
      { code: 'FIS101', title: 'B. Fisheries and Aquaculture', level: 100, semester: 1 },
    ],
    'Forestry and Wildlife Management': [
      { code: 'FOR101', title: 'B. Forestry and Wildlife Management', level: 100, semester: 1 },
    ],
    // Basic Medical Sciences
    'Medical Laboratory Science': [
      { code: 'MLS101', title: 'B. Medical Laboratory Science (BMLS)', level: 100, semester: 1 },
    ],
    'Nursing': [
      { code: 'NUR101', title: 'B.NSc. Nursing Science', level: 100, semester: 1 },
    ],
    'Physiotherapy': [
      { code: 'DPT101', title: 'Doctor of Physiotherapy (DPT)', level: 100, semester: 1 },
    ],
    'Medicine and Surgery': [
      { code: 'MBBS101', title: 'MBBS', level: 100, semester: 1 },
    ],
    // Earth and Environmental Sciences
    'Environmental Management': [
      { code: 'EVM101', title: 'B.Sc Environmental Management', level: 100, semester: 1 },
    ],
    'Geography': [
      { code: 'GEO101', title: 'B.Sc Geography (Science)', level: 100, semester: 1 },
      { code: 'GEO102', title: 'B.Sc Geography (Social Science)', level: 100, semester: 1 },
    ],
    'Meteorology': [
      { code: 'MET101', title: 'B.Sc. Meteorology', level: 100, semester: 1 },
    ],
    // Faculty of Education
    'Education': [
      { code: 'EDU101', title: 'B.A (Ed) Arabic', level: 100, semester: 1 },
      { code: 'EDU102', title: 'B.A (Ed) English', level: 100, semester: 1 },
      { code: 'EDU103', title: 'B.A (Ed) Hausa', level: 100, semester: 1 },
      { code: 'EDU104', title: 'B.A (Ed) History', level: 100, semester: 1 },
      { code: 'EDU105', title: 'B.A (Ed) Islamic Studies', level: 100, semester: 1 },
      { code: 'EDU106', title: 'B.A (Ed) French', level: 100, semester: 1 },
    ],
    'Special Education': [
      { code: 'SPE101', title: 'B.A. (Ed) Special Education', level: 100, semester: 1 },
      { code: 'SPE102', title: 'B.A. (Ed.) Early Childhood Education', level: 100, semester: 1 },
    ],
    'Educational Psychology and Counseling': [
      { code: 'EPC101', title: 'B.A. Ed. Primary Education Studies', level: 100, semester: 1 },
      { code: 'EPC102', title: 'B.Ed. Guidance and Counselling', level: 100, semester: 1 },
    ],
    'Education Management': [
      { code: 'EMT101', title: 'B.Ed. Educational Management', level: 100, semester: 1 },
      { code: 'EMT102', title: 'B.Sc. (Ed) Economics', level: 100, semester: 1 },
      { code: 'EMT103', title: 'B.Sc. (Ed) Business Studies Education', level: 100, semester: 1 },
    ],
    'Science Education': [
      { code: 'SCE101', title: 'B.Sc. (Ed) Biology', level: 100, semester: 1 },
      { code: 'SCE102', title: 'B.Sc. (Ed) Chemistry', level: 100, semester: 1 },
      { code: 'SCE103', title: 'B.Sc. (Ed) Geography (Social Science)', level: 100, semester: 1 },
      { code: 'SCE104', title: 'B.Sc. (Ed) Geography (Science)', level: 100, semester: 1 },
      { code: 'SCE105', title: 'B.Sc. (Ed) Physics', level: 100, semester: 1 },
      { code: 'SCE106', title: 'B.Sc. (Ed) Integrated Science', level: 100, semester: 1 },
    ],
    'Mathematics and Computer Science Education': [
      { code: 'MCE101', title: 'B.Sc. (Ed) Mathematics', level: 100, semester: 1 },
      { code: 'MCE102', title: 'B.Sc. (Ed) Computer Science Education', level: 100, semester: 1 },
    ],
    // Faculty of Humanities
    'Arabic': [
      { code: 'ARB101', title: 'B.A Arabic', level: 100, semester: 1 },
      { code: 'ARB102', title: 'B.A. Arabic Literary Study and Translation', level: 100, semester: 1 },
    ],
    'English and French': [
      { code: 'ENG101', title: 'B.A English', level: 100, semester: 1 },
      { code: 'FRN101', title: 'B.A French', level: 100, semester: 1 },
    ],
    'Nigerian Languages': [
      { code: 'HAU101', title: 'B.A Hausa', level: 100, semester: 1 },
    ],
    'History and Security Studies': [
      { code: 'HIS101', title: 'B.A History', level: 100, semester: 1 },
    ],
    'Islamic Studies': [
      { code: 'ISL101', title: 'B.A Islamic Studies', level: 100, semester: 1 },
      { code: 'ISL102', title: 'B.A Sharia', level: 100, semester: 1 },
    ],
    // Faculty of Law
    'Law': [
      { code: 'LAW101', title: 'LLB LAW', level: 100, semester: 1 },
    ],
    // Faculty of Management Sciences
    'Accounting': [
      { code: 'ACC101', title: 'B.Sc Accounting', level: 100, semester: 1 },
    ],
    'Business Administration': [
      { code: 'BUS101', title: 'B.Sc Business Administration', level: 100, semester: 1 },
    ],
    'Public Administration': [
      { code: 'PUB101', title: 'B.Sc Public Administration', level: 100, semester: 1 },
    ],
    'Local Government and Development Studies': [
      { code: 'LGS101', title: 'B.Sc. Local Government and Development Studies', level: 100, semester: 1 },
    ],
    // Faculty of Natural and Applied Sciences
    'Biochemistry': [
      { code: 'BCH101', title: 'B.Sc Biochemistry', level: 100, semester: 1 },
    ],
    'Biological Sciences': [
      { code: 'BIO101', title: 'B.Sc Biology', level: 100, semester: 1 },
      { code: 'BIO102', title: 'B.Sc. Animal and Environmental Biological Sciences', level: 100, semester: 1 },
      { code: 'BIO103', title: 'B.Sc. Biological Sciences', level: 100, semester: 1 },
      { code: 'BIO104', title: 'B.Sc. Plant Science and Biotechnology', level: 100, semester: 1 },
    ],
    'Pure and Industrial Chemistry': [
      { code: 'CHM101', title: 'B.Sc Chemistry', level: 100, semester: 1 },
      { code: 'CHM102', title: 'B.Sc Industrial Chemistry', level: 100, semester: 1 },
    ],
    'Computer Science': [
      { code: 'CSC101', title: 'B.Sc Computer Science', level: 100, semester: 1 },
      { code: 'CSC102', title: 'B.Sc. Cyber Security', level: 100, semester: 1 },
      { code: 'CSC103', title: 'B.Sc. Information System', level: 100, semester: 1 },
      { code: 'CSC104', title: 'B.Sc. Software Engineering', level: 100, semester: 1 },
    ],
    'Mathematics': [
      { code: 'MTH101', title: 'B.Sc Mathematics', level: 100, semester: 1 },
      { code: 'MTH102', title: 'B.Sc. Statistics', level: 100, semester: 1 },
    ],
    'MicroBiological Sciences': [
      { code: 'MCB101', title: 'B.Sc MicroBiological Sciences', level: 100, semester: 1 },
    ],
    'Physics': [
      { code: 'PHY101', title: 'B.Sc Physics', level: 100, semester: 1 },
      { code: 'PHY102', title: 'B.Sc. Applied Geophysics', level: 100, semester: 1 },
      { code: 'PHY103', title: 'B.Sc. Medical Physics', level: 100, semester: 1 },
      { code: 'PHY104', title: 'B.Sc. Physics with Electronics', level: 100, semester: 1 },
    ],
    'Statistics': [
      { code: 'STA101', title: 'B.Sc. Statistics', level: 100, semester: 1 },
    ],
    // Faculty of Social Sciences
    'Economics': [
      { code: 'ECO101', title: 'B.Sc Economics', level: 100, semester: 1 },
    ],
    'Political Science': [
      { code: 'POL101', title: 'B.Sc Political Science', level: 100, semester: 1 },
    ],
    'Sociology': [
      { code: 'SOC101', title: 'B.Sc Sociology', level: 100, semester: 1 },
    ],
    'International Relations': [
      { code: 'INR101', title: 'B.Sc. International Relations', level: 100, semester: 1 },
    ],
    'Library and Information Science': [
      { code: 'LIS201', title: 'B.Sc. Library and Information Science', level: 100, semester: 1 },
    ],
  };
  
  const insertF = db.prepare('INSERT INTO faculties (name) VALUES (?)');
  const insertD = db.prepare('INSERT INTO departments (name, facultyId) VALUES (?, ?)');
  const insertC = db.prepare('INSERT INTO courses (code, title, level, semester, units, departmentId) VALUES (?, ?, ?, ?, ?, ?)');
  
  faculties.forEach(f => {
    const fac = insertF.run(f);
    (depts[f] || []).forEach(d => {
      const dept = insertD.run(d, fac.lastInsertRowid);
      const courses = courseData[d] || [];
      courses.forEach(c => {
        try { insertC.run(c.code, c.title, c.level, c.semester, 3, dept.lastInsertRowid); } catch {}
      });
    });
  });
  console.log('Database seeded with all courses');
}
  

// AUTH
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, fullName, role, lecturerCode } = req.body;
    if (db.prepare('SELECT id FROM users WHERE email=?').get(email)) return res.status(400).json({ error: 'Email exists' });
    let finalRole = role || 'student';
    if (role === 'lecturer' && lecturerCode !== LECTURER_CODE) return res.status(403).json({ error: 'Invalid lecturer code' });
    const hash = await bcrypt.hash(password, 10);
    const r = db.prepare('INSERT INTO users (email, password, fullName, role) VALUES (?,?,?,?)').run(email, hash, fullName, finalRole);
    const token = jwt.sign({ userId: r.lastInsertRowid, email, role: finalRole }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: r.lastInsertRowid, email, fullName, role: finalRole } });
  } catch (e) { res.status(500).json({ error: 'Registration failed' }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email=?').get(email);
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ error: 'Invalid credentials' });
    const { password: _, ...u } = user;
    const token = jwt.sign({ userId: user.id, email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: u });
  } catch (e) { res.status(500).json({ error: 'Login failed' }); }
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
  const { code, title, departmentId } = req.body;
  const existing = db.prepare('SELECT * FROM courses WHERE code = ?').get(code);
  if (existing) return res.json(existing);
  const result = db.prepare('INSERT INTO courses (code, title, level, semester, departmentId) VALUES (?, ?, 100, 1, ?)').run(code, title, departmentId);
  res.json({ id: result.lastInsertRowid, code, title });
});

app.get('/api/courses/:id/lectures', (req, res) => {
  res.json(db.prepare(`SELECT l.*, u.fullName as uploaderName, (SELECT AVG(value) FROM ratings WHERE lectureId=l.id) as avgRating FROM lectures l LEFT JOIN users u ON l.uploaderId=u.id WHERE l.courseId=? AND l.status='published' ORDER BY l.weekNumber`).all(req.params.id));
});

// FACULTIES
app.get('/api/faculties', (req, res) => res.json(db.prepare('SELECT * FROM faculties ORDER BY name').all()));
app.get('/api/faculties/:id/departments', (req, res) => res.json(db.prepare('SELECT * FROM departments WHERE facultyId=? ORDER BY name').all(req.params.id)));

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
  } catch (e) { 
    console.error('Upload error:', e);
    res.status(500).json({ error: e.message }); 
  }
});
// DOWNLOAD
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
  }).on('error', (err) => {
    console.error('Proxy error:', err);
    res.redirect(l.fileUrl);
  });
});
// RATINGS
app.post('/api/lectures/:id/rate', auth, (req, res) => {
  const { value, comment } = req.body;
  const ex = db.prepare('SELECT id FROM ratings WHERE userId=? AND lectureId=?').get(req.user.userId, req.params.id);
  ex ? db.prepare('UPDATE ratings SET value=?, comment=? WHERE id=?').run(value, comment, ex.id)
     : db.prepare('INSERT INTO ratings (value, comment, userId, lectureId) VALUES (?,?,?,?)').run(value, comment, req.user.userId, req.params.id);
  const avg = db.prepare('SELECT AVG(value) as a FROM ratings WHERE lectureId=?').get(req.params.id);
  res.json({ avg: avg.a });
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
// ============ ADMIN FULL ROUTES ============

// User management - get all users
app.get('/api/admin/users', adminAuth, (req, res) => {
  const users = db.prepare(`
    SELECT id, email, fullName, role, banned, createdAt
    FROM users ORDER BY createdAt DESC
  `).all();
  res.json(users);
});

// Update user role
app.put('/api/admin/users/:id/role', adminAuth, (req, res) => {
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(req.body.role, req.params.id);
  res.json({ success: true });
});

// Ban/unban user
app.put('/api/admin/users/:id/ban', adminAuth, (req, res) => {
  const { banned } = req.body; // 1 or 0
  db.prepare('UPDATE users SET banned = ? WHERE id = ?').run(banned, req.params.id);
  res.json({ success: true });
});

// Delete user
app.delete('/api/admin/users/:id', adminAuth, (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Lectures moderation - get all lectures
app.get('/api/admin/lectures', adminAuth, (req, res) => {
  const lectures = db.prepare(`
    SELECT l.*, c.code as courseCode, u.fullName as uploaderName,
    (SELECT COUNT(*) FROM reports WHERE lectureId = l.id) as reportCount
    FROM lectures l
    JOIN courses c ON l.courseId = c.id
    JOIN users u ON l.uploaderId = u.id
    ORDER BY l.createdAt DESC
  `).all();
  res.json(lectures);
});

// Update lecture status
app.put('/api/admin/lectures/:id/status', adminAuth, (req, res) => {
  const { status } = req.body; // 'published', 'flagged', 'removed'
  db.prepare('UPDATE lectures SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ success: true });
});

// Delete lecture
// Delete lecture (with Cloudinary cleanup)
app.delete('/api/admin/lectures/:id', adminAuth, async (req, res) => {
  try {
    const lecture = db.prepare('SELECT * FROM lectures WHERE id = ?').get(req.params.id);
    if (!lecture) return res.status(404).json({ error: 'Lecture not found' });

    // Extract public_id from Cloudinary URL
    // Cloudinary URLs look like: https://res.cloudinary.com/CLOUD_NAME/raw/upload/v1234567890/lecturevault/filename.pdf
    const url = lecture.fileUrl;
    if (url && url.includes('cloudinary.com')) {
      try {
        const parts = url.split('/');
        const filenameWithExt = parts[parts.length - 1]; // e.g., "filename.pdf"
        const folder = parts[parts.length - 2]; // e.g., "lecturevault" 
        const filename = filenameWithExt.split('.')[0]; // remove extension
        
        const publicId = `lecturevault/${filename}`;
        
        await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
        console.log('Deleted from Cloudinary:', publicId);
      } catch (cloudErr) {
        console.error('Cloudinary delete error:', cloudErr);
        // Continue with DB deletion even if Cloudinary fails
      }
    }

    // Delete associated comments, ratings, bookmarks
    db.prepare('DELETE FROM comments WHERE lectureId = ?').run(req.params.id);
    db.prepare('DELETE FROM ratings WHERE lectureId = ?').run(req.params.id);
    db.prepare('DELETE FROM bookmarks WHERE lectureId = ?').run(req.params.id);
    
    // Delete the lecture record
    db.prepare('DELETE FROM lectures WHERE id = ?').run(req.params.id);
    
    res.json({ success: true, message: 'Lecture and associated data deleted' });
  } catch (error) {
    console.error('Delete lecture error:', error);
    res.status(500).json({ error: 'Failed to delete lecture' });
  }
});

// Get reports
app.get('/api/admin/reports', adminAuth, (req, res) => {
  const reports = db.prepare(`
    SELECT r.*, l.title as lectureTitle, c.code as courseCode, u.fullName as reporterName
    FROM reports r
    JOIN lectures l ON r.lectureId = l.id
    JOIN courses c ON l.courseId = c.id
    JOIN users u ON r.userId = u.id
    ORDER BY r.createdAt DESC
  `).all();
  res.json(reports);
});

// Dismiss report
app.delete('/api/admin/reports/:id', adminAuth, (req, res) => {
  db.prepare('DELETE FROM reports WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Analytics
app.get('/api/admin/analytics', adminAuth, (req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  const totalCourses = db.prepare('SELECT COUNT(*) as c FROM courses').get().c;
  const totalLectures = db.prepare('SELECT COUNT(*) as c FROM lectures').get().c;
  const totalDownloads = db.prepare('SELECT SUM(downloads) as c FROM lectures').get().c || 0;
  const totalBanned = db.prepare("SELECT COUNT(*) as c FROM users WHERE banned=1").get().c;
  const flaggedLectures = db.prepare("SELECT COUNT(*) as c FROM lectures WHERE status='flagged'").get().c;
  
  const topCourses = db.prepare(`
    SELECT c.code, c.title, COUNT(l.id) as lectureCount
    FROM courses c LEFT JOIN lectures l ON l.courseId = c.id
    GROUP BY c.id ORDER BY lectureCount DESC LIMIT 5
  `).all();
  
  res.json({
    totalUsers, totalCourses, totalLectures, totalDownloads,
    totalBanned, flaggedLectures, topCourses
  });
});
app.get('/api/seed', (req, res) => {
  db.pragma('foreign_keys = OFF');
  db.prepare('DELETE FROM lectures').run();
  db.prepare('DELETE FROM comments').run();
  db.prepare('DELETE FROM ratings').run();
  db.prepare('DELETE FROM bookmarks').run();
  db.prepare('DELETE FROM reports').run();
  db.prepare('DELETE FROM courses').run();
  db.prepare('DELETE FROM departments').run();
  db.prepare('DELETE FROM faculties').run();
  db.pragma('foreign_keys = ON');
  
  // Re-seed
  const faculties = [
    'Faculty of Agriculture','Basic Medical Sciences','Earth and Environmental Sciences',
    'Faculty of Education','Faculty of Humanities','Faculty of Law',
    'Faculty of Management Sciences','Faculty of Natural and Applied Sciences','Faculty of Social Sciences'
  ];
  // ... (copy the exact same seed logic from above - the depts, courseData, and insert loops)
  
  res.json({ message: 'Database re-seeded' });
});
// Force re-seed
app.get('/api/seed', (req, res) => {
  const facCount = db.prepare('SELECT COUNT(*) as c FROM faculties').get().c;
  if (facCount > 0) {
    return res.json({ message: 'Already seeded. Use /api/reset first.' });
  }
  // Re-run the seed logic
  res.json({ message: 'Not seeded. Restart server.' });
});
// 404
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));