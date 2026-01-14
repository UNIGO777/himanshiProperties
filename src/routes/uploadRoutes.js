const express = require('express');
const { uploadSingle, uploadMultiple } = require('../controllers/uploadController');
const { uploadImage, uploadVideo } = require('../middlewares/upload');

const router = express.Router();

router.post('/image', uploadImage.single('file'), uploadSingle);
router.post('/images', uploadImage.array('files', 10), uploadMultiple);
router.post('/video', uploadVideo.single('file'), uploadSingle);

module.exports = router;
