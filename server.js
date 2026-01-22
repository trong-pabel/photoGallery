const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const ExifParser = require('exif-parser');
const heicConvert = require('heic-convert');

const app = express();
const PORT = 3000;

// Tạo thư mục uploads nếu chưa tồn tại
const uploadsDir = path.join(__dirname, 'uploads');
const thumbsDir = path.join(__dirname, 'uploads', 'thumbnails');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(thumbsDir)) fs.mkdirSync(thumbsDir, { recursive: true });

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Multer config - không giới hạn file size
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|heic|heif/i;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    if (allowedTypes.test(ext) || allowedTypes.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ hỗ trợ JPEG, PNG, HEIC'));
    }
  }
});

// API: Kiểm tra đăng nhập
app.post('/api/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const credentialsPath = path.join(__dirname, 'config', 'credentials.json');
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    
    if (username === credentials.username && password === credentials.password) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: 'Sai tên đăng nhập hoặc mật khẩu' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Hàm đọc EXIF để lấy thời gian chụp
async function getPhotoDate(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    const parser = ExifParser.create(buffer);
    const result = parser.parse();
    
    if (result.tags && result.tags.DateTimeOriginal) {
      return new Date(result.tags.DateTimeOriginal * 1000);
    }
  } catch (e) {
    // Fallback to file modification time
  }
  
  const stats = fs.statSync(filePath);
  return stats.mtime;
}

// Hàm chuyển đổi HEIC sang JPEG
async function convertHeicToJpeg(heicPath) {
  const inputBuffer = fs.readFileSync(heicPath);
  const outputBuffer = await heicConvert({
    buffer: inputBuffer,
    format: 'JPEG',
    quality: 0.9
  });
  
  const jpegPath = heicPath.replace(/\.heic$/i, '.jpg');
  fs.writeFileSync(jpegPath, Buffer.from(outputBuffer));
  fs.unlinkSync(heicPath); // Xóa file HEIC gốc
  
  return jpegPath;
}

// Hàm tạo thumbnail
async function createThumbnail(imagePath, filename) {
  const thumbPath = path.join(thumbsDir, 'thumb_' + filename.replace(/\.heic$/i, '.jpg'));
  
  await sharp(imagePath)
    .resize(200, 200, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 80 })
    .toFile(thumbPath);
  
  return thumbPath;
}

// API: Upload ảnh
app.post('/api/upload', upload.array('photos', 50), async (req, res) => {
  try {
    const results = [];
    
    for (const file of req.files) {
      let filePath = file.path;
      let filename = file.filename;
      
      // Chuyển đổi HEIC sang JPEG
      if (/\.heic$/i.test(filename)) {
        filePath = await convertHeicToJpeg(filePath);
        filename = filename.replace(/\.heic$/i, '.jpg');
      }
      
      // Tạo thumbnail
      await createThumbnail(filePath, filename);
      
      // Lấy thời gian chụp
      const photoDate = await getPhotoDate(filePath);
      
      results.push({
        filename,
        originalName: file.originalname,
        photoDate: photoDate.toISOString()
      });
    }
    
    res.json({ success: true, files: results });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// API: Lấy danh sách ảnh
app.get('/api/photos', async (req, res) => {
  try {
    const files = fs.readdirSync(uploadsDir)
      .filter(f => /\.(jpg|jpeg|png)$/i.test(f) && !f.startsWith('thumb_'));
    
    const photos = await Promise.all(files.map(async (filename) => {
      const filePath = path.join(uploadsDir, filename);
      const photoDate = await getPhotoDate(filePath);
      const stats = fs.statSync(filePath);
      
      return {
        filename,
        thumbnail: `/uploads/thumbnails/thumb_${filename}`,
        fullImage: `/uploads/${filename}`,
        photoDate: photoDate.toISOString(),
        uploadDate: stats.birthtime.toISOString(),
        size: stats.size
      };
    }));
    
    // Sắp xếp theo thời gian chụp (mới nhất trước)
    photos.sort((a, b) => new Date(b.photoDate) - new Date(a.photoDate));
    
    res.json({ success: true, photos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// API: Xóa ảnh
app.delete('/api/photos/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadsDir, filename);
    const thumbPath = path.join(thumbsDir, 'thumb_' + filename);
    
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🖼️  Photo Gallery đang chạy tại http://localhost:${PORT}`);
});
