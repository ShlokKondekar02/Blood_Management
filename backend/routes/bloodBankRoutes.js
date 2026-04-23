/**
 * Blood Bank Routes
 * /api/blood-banks
 */

const express = require('express');
const router = express.Router();
const { getAllBloodBanks, searchBloodBanks, getBloodBank } = require('../controllers/bloodBankController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// Search blood banks - GET /api/blood-banks/search?city=&type=
router.get('/search', searchBloodBanks);

// Get all blood banks - GET /api/blood-banks
router.get('/', getAllBloodBanks);

// Get single blood bank - GET /api/blood-banks/:id
router.get('/:id', getBloodBank);

module.exports = router;
