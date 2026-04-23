/**
 * Certificate Routes
 * /api/certificates
 */

const express = require('express');
const router = express.Router();
const { uploadCertificate, getMyCertificates, getUserCertificates } = require('../controllers/certificateController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect);

// Upload certificate - POST /api/certificates/upload
router.post('/upload', upload.single('certificate'), uploadCertificate);

// Get my certificates - GET /api/certificates/my
router.get('/my', getMyCertificates);

// Get user's certificates - GET /api/certificates/user/:userId
router.get('/user/:userId', getUserCertificates);

module.exports = router;
