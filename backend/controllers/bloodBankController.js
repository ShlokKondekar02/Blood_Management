/**
 * Blood Bank Controller (Firebase Firestore Implementation)
 * Handles blood bank / hospital directory
 */

const { db } = require('../config/firebase');

/**
 * @route   GET /api/blood-banks
 * @desc    Get all blood banks
 * @access  Private
 */
const getAllBloodBanks = async (req, res) => {
  try {
    const snapshot = await db.collection('bloodBanks')
      .where('isActive', '==', true)
      .get();

    const banks = snapshot.docs
      .map(doc => ({
        _id: doc.id,
        ...doc.data()
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    res.json({ success: true, banks });
  } catch (error) {
    console.error('GetAllBloodBanks error:', error);
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
    let query = db.collection('bloodBanks').where('isActive', '==', true);

    if (type) {
      query = query.where('type', '==', type);
    }
    
    // availableGroups is likely an array in MongoDB ($elemMatch)
    // In Firestore, we use 'array-contains'
    if (bloodGroup) {
      query = query.where('availableGroups', 'array-contains', bloodGroup);
    }

    const snapshot = await query.get();
    let banks = snapshot.docs.map(doc => ({
      _id: doc.id,
      ...doc.data()
    }));

    // Firestore doesn't support case-insensitive regex for 'city'.
    // Filtering in memory for city search.
    if (city) {
      banks = banks.filter(bank => 
        bank.city && bank.city.toLowerCase().includes(city.toLowerCase())
      );
    }

    // Sort manually if filtered in memory
    banks.sort((a, b) => a.name.localeCompare(b.name));

    res.json({ success: true, banks });
  } catch (error) {
    console.error('SearchBloodBanks error:', error);
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
    const doc = await db.collection('bloodBanks').doc(req.params.id).get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Blood bank not found' });
    }

    res.json({ 
      success: true, 
      bank: { _id: doc.id, ...doc.data() } 
    });
  } catch (error) {
    console.error('GetBloodBank error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getAllBloodBanks, searchBloodBanks, getBloodBank };
