/**
 * Database Seed Script (Firebase Firestore Implementation)
 * Populates Firestore with realistic dummy data for testing
 *
 * Usage: npm run seed
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { db } = require('../config/firebase');

// ===================== DUMMY DATA =====================

const usersData = [
  { name: 'Shlok', email: 'shlok@demo.com', password: 'password123', bloodGroup: 'O+', phone: '+91-9876543210', location: 'Mumbai', bio: 'Admin & regular donor.' }
];

const communitiesData = [
  { name: 'Shlok Blood Donors Mumbai', description: 'Official blood donation group for Mumbai region managed by Shlok.', tags: ['shlok', 'mumbai', 'emergency'] },
  { name: 'Shlok Rare Blood Network', description: 'Connecting rare blood group donors across the country.', tags: ['shlok', 'rare', 'national'] }
];

const bloodBanksData = [
  { name: 'Red Cross Blood Bank', address: '16 Red Cross Road, Colaba', city: 'Mumbai', state: 'Maharashtra', phone: '+91-22-22040440', email: 'mumbai@redcross.org', latitude: 18.9220, longitude: 72.8347, availableGroups: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'], operatingHours: '24/7', type: 'blood_bank', isActive: true },
  { name: 'AIIMS Blood Centre', address: 'Sri Aurobindo Marg, New Delhi', city: 'Delhi', state: 'Delhi', phone: '+91-11-26588500', email: 'blood@aiims.edu', latitude: 28.5672, longitude: 77.2100, availableGroups: ['A+', 'B+', 'O+', 'AB+'], operatingHours: '24/7', type: 'hospital', isActive: true },
  { name: 'Bangalore Medical Services', address: 'Victoria Hospital Campus, Fort', city: 'Bangalore', state: 'Karnataka', phone: '+91-80-26704444', email: 'blood@bms.org', latitude: 12.9586, longitude: 77.5730, availableGroups: ['A+', 'A-', 'B+', 'O+', 'O-'], operatingHours: '8:00 AM - 8:00 PM', type: 'blood_bank', isActive: true },
  { name: 'Rotary Blood Bank', address: '56-57, Tughlakabad Institutional Area', city: 'Delhi', state: 'Delhi', phone: '+91-11-29956515', email: 'info@rotarybloodbank.org', latitude: 28.5088, longitude: 77.2491, availableGroups: ['A+', 'B+', 'B-', 'O+', 'O-', 'AB+'], operatingHours: '24/7', type: 'blood_bank', isActive: true },
  { name: 'Tata Memorial Hospital', address: 'Dr E Borges Road, Parel', city: 'Mumbai', state: 'Maharashtra', phone: '+91-22-24177000', email: 'blood@tmc.gov.in', latitude: 19.0048, longitude: 72.8436, availableGroups: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'], operatingHours: '24/7', type: 'hospital', isActive: true },
  { name: 'Lions Blood Bank', address: 'Sion-Trombay Road, Chembur', city: 'Mumbai', state: 'Maharashtra', phone: '+91-22-25222623', email: 'lions.bb@gmail.com', latitude: 19.0522, longitude: 72.8994, availableGroups: ['A+', 'B+', 'O+', 'AB+'], operatingHours: '9:00 AM - 6:00 PM', type: 'donation_center', isActive: true },
  { name: 'Sankalp Blood Centre', address: 'Jayanagar 4th Block', city: 'Bangalore', state: 'Karnataka', phone: '+91-80-26534902', email: 'info@sankalp.org', latitude: 12.9279, longitude: 77.5937, availableGroups: ['A+', 'A-', 'B+', 'O+', 'O-'], operatingHours: '9:00 AM - 9:00 PM', type: 'donation_center', isActive: true },
  { name: 'CMC Blood Bank', address: 'Ida Scudder Road', city: 'Chennai', state: 'Tamil Nadu', phone: '+91-416-2282102', email: 'blood@cmcvellore.ac.in', latitude: 12.9249, longitude: 79.1325, availableGroups: ['A+', 'B+', 'B-', 'O+', 'O-', 'AB+'], operatingHours: '24/7', type: 'hospital', isActive: true },
  { name: 'Global Blood Center', address: 'Hitech City Road', city: 'Hyderabad', state: 'Telangana', phone: '+91-40-23111111', email: 'contact@globalblood.com', latitude: 17.4483, longitude: 78.3915, availableGroups: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'], operatingHours: '24/7', type: 'blood_bank', isActive: true },
  { name: 'City Life Hospital', address: 'Indiranagar 100ft Road', city: 'Bangalore', state: 'Karnataka', phone: '+91-80-45678901', email: 'bloodbank@citylife.com', latitude: 12.9719, longitude: 77.6412, availableGroups: ['O+', 'O-', 'A+', 'B+'], operatingHours: '24/7', type: 'hospital', isActive: true }
];

// ===================== HELPER =====================
const deleteCollection = async (collectionName) => {
  const snapshot = await db.collection(collectionName).get();
  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
};

// ===================== SEED FUNCTION =====================

const seedDatabase = async () => {
  try {
    console.log('\n🌱 Starting Firestore seed (Clean Slate)...\n');

    // Clear existing data
    await Promise.all([
      deleteCollection('users'),
      deleteCollection('communities'),
      deleteCollection('messages'),
      deleteCollection('bloodRequests'),
      deleteCollection('replies'),
      deleteCollection('certificates'),
      deleteCollection('bloodBanks'),
      deleteCollection('notifications')
    ]);
    console.log('🗑️  Cleared existing data');

    // Create single user
    const users = [];
    for (const u of usersData) {
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(u.password, salt);
      const docRef = await db.collection('users').add({
        ...u,
        password: hashedPassword,
        avatar: '',
        joinedCommunities: [],
        donationCount: 0,
        isVerifiedDonor: false,
        isOnline: false,
        lastSeen: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      users.push({ id: docRef.id, ...u });
    }
    console.log(`✅ Created ${users.length} user (Shlok)`);

    // Create blood banks (Keep constant as requested)
    for (const bank of bloodBanksData) {
      await db.collection('bloodBanks').add(bank);
    }
    console.log(`✅ Created ${bloodBanksData.length} blood banks`);

    console.log('\n🎉 Firestore reset successfully!\n');
    console.log('📧 Login Credentials:');
    console.log('   Email: shlok@demo.com');
    console.log('   Password: password123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};
seedDatabase();
