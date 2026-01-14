const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
};

const makeStorage = (subdir) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      const base = process.env.UPLOAD_DIR ? path.resolve(process.env.UPLOAD_DIR) : path.join(process.cwd(), 'uploads');
      const dir = path.join(base, subdir);
      ensureDir(dir);
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase();
      const name = `${crypto.randomUUID()}${ext}`;
      cb(null, name);
    },
  });

const imageFileFilter = (req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith('image/')) return cb(null, true);
  cb(new Error('Only image files are allowed'));
};

const videoFileFilter = (req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith('video/')) return cb(null, true);
  cb(new Error('Only video files are allowed'));
};

const uploadImage = multer({ storage: makeStorage('images'), fileFilter: imageFileFilter, limits: { fileSize: 10 * 1024 * 1024 } });
const uploadVideo = multer({ storage: makeStorage('videos'), fileFilter: videoFileFilter, limits: { fileSize: 200 * 1024 * 1024 } });

module.exports = { uploadImage, uploadVideo };
