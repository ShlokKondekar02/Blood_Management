/**
 * Blood Bank Controller
 * Handles blood bank / hospital directory
 */

const BloodBank = require('../models/BloodBank');

/**
 * @route   GET /api/blood-banks
 * @desc    Get all blood banks
 * @access  Private
 */
const getAllBloodBanks = async (req, res) => {
  try {
    const banks = await BloodBank.find({ isActive: true })
      .sort({ name: 1 });

    res.json({ success: true, banks });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @route   GET /api/blood-banks/search?city=&type=
 * @desc    Search blood banks by city or type
 * @access  Private
 */
const searchBloodBanks = async (req, res) => {
  try {
    const { city, type, bloodGroup } = req.query;
    const filter = { isActive: true };

    if (city) {
      filter.city = { $regex: city, $options: 'i' };
    }
    if (type) {
      filter.type = type;
    }
    if (bloodGroup) {
      filter.availableGroups = bloodGroup;
    }

    const banks = await BloodBank.find(filter).sort({ name: 1 });

    res.json({ success: true, banks });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @route   GET /api/blood-banks/:id
 * @desc    Get single blood bank
 * @access  Private
 */
const getBloodBank = async (req, res) => {
  try {
    const bank = await BloodBank.findById(req.params.id);

    if (!bank) {
      return res.status(404).json({ success: false, message: 'Blood bank not found' });
    }

    res.json({ success: true, bank });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getAllBloodBanks, searchBloodBanks, getBloodBank };
