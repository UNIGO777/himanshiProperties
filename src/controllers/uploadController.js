const path = require('path');

const toPublicUrl = (req, filePath) => {
  const normalized = filePath.split(path.sep).join('/');
  const idx = normalized.lastIndexOf('/uploads/');
  if (idx === -1) return null;
  const rel = normalized.slice(idx + '/uploads'.length);
  return `${req.protocol}://${req.get('host')}/uploads${rel}`;
};

const uploadSingle = (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'File required' });
  const url = toPublicUrl(req, req.file.path);
  res.status(200).json({ url, filename: req.file.filename, mimetype: req.file.mimetype, size: req.file.size });
};

const uploadMultiple = (req, res) => {
  const files = Array.isArray(req.files) ? req.files : [];
  if (files.length === 0) return res.status(400).json({ message: 'Files required' });
  res.status(200).json({
    files: files.map((f) => ({
      url: toPublicUrl(req, f.path),
      filename: f.filename,
      mimetype: f.mimetype,
      size: f.size,
    })),
  });
};

module.exports = { uploadSingle, uploadMultiple };
