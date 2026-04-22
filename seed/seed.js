/**
 * Database Seed Script
 * Populates the database with realistic dummy data for testing
 *
 * Usage: npm run seed
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Community = require('../models/Community');
const Message = require('../models/Message');
const BloodRequest = require('../models/BloodRequest');
const Reply = require('../models/Reply');
const Certificate = require('../models/Certificate');
const BloodBank = require('../models/BloodBank');
const Notification = require('../models/Notification');

const connectDB = require('../config/db');

// ===================== DUMMY DATA =====================

const usersData = [
  { name: 'Rahul Sharma', email: 'rahul@example.com', password: 'password123', bloodGroup: 'O+', phone: '+91-9876543210', location: 'Mumbai', bio: 'Regular blood donor. Happy to help anytime!' },
  { name: 'Priya Patel', email: 'priya@example.com', password: 'password123', bloodGroup: 'A+', phone: '+91-9876543211', location: 'Delhi', bio: 'Healthcare worker & blood donation advocate' },
  { name: 'Amit Kumar', email: 'amit@example.com', password: 'password123', bloodGroup: 'B+', phone: '+91-9876543212', location: 'Bangalore', bio: 'Tech professional, 10+ donations' },
  { name: 'Sneha Gupta', email: 'sneha@example.com', password: 'password123', bloodGroup: 'AB+', phone: '+91-9876543213', location: 'Chennai', bio: 'Medical student, promoting blood donation' },
  { name: 'Vikram Singh', email: 'vikram@example.com', password: 'password123', bloodGroup: 'O-', phone: '+91-9876543214', location: 'Pune', bio: 'Universal donor, always ready to help' },
  { name: 'Ananya Reddy', email: 'ananya@example.com', password: 'password123', bloodGroup: 'A-', phone: '+91-9876543215', location: 'Hyderabad', bio: 'Blood donation camp organizer' },
  { name: 'Karan Mehra', email: 'karan@example.com', password: 'password123', bloodGroup: 'B-', phone: '+91-9876543216', location: 'Kolkata', bio: 'NGO volunteer, saving lives one donation at a time' },
  { name: 'Divya Nair', email: 'divya@example.com', password: 'password123', bloodGroup: 'AB-', phone: '+91-9876543217', location: 'Mumbai', bio: 'Nurse at City Hospital' },
  { name: 'Arjun Das', email: 'arjun@example.com', password: 'password123', bloodGroup: 'O+', phone: '+91-9876543218', location: 'Delhi', bio: 'Software developer & regular donor' },
  { name: 'Meera Joshi', email: 'meera@example.com', password: 'password123', bloodGroup: 'A+', phone: '+91-9876543219', location: 'Pune', bio: 'Fitness enthusiast & blood donor' }
];

const communitiesData = [
  { name: 'Mumbai Blood Heroes', description: 'Mumbai\'s largest blood donation community. We connect donors with those in need across the city.', tags: ['mumbai', 'emergency', 'blood-donation'] },
  { name: 'Delhi Lifeline', description: 'Delhi NCR blood donation network. Quick response for emergencies in the capital region.', tags: ['delhi', 'ncr', 'urgent'] },
  { name: 'Bangalore Blood Connect', description: 'Tech city blood donors network. Connecting IT professionals who want to save lives.', tags: ['bangalore', 'tech', 'donors'] },
  { name: 'All India Rare Blood Group', description: 'Community for rare blood group donors (AB-, B-, A-, O-). Finding rare donors faster.', tags: ['rare', 'national', 'emergency'] },
  { name: 'Healthcare Workers United', description: 'Blood donation community for doctors, nurses, and healthcare professionals.', tags: ['healthcare', 'medical', 'professional'] }
];

const bloodBanksData = [
  { name: 'Red Cross Blood Bank', address: '16 Red Cross Road, Colaba', city: 'Mumbai', state: 'Maharashtra', phone: '+91-22-22040440', email: 'mumbai@redcross.org', latitude: 18.9220, longitude: 72.8347, availableGroups: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'], operatingHours: '24/7', type: 'blood_bank' },
  { name: 'AIIMS Blood Centre', address: 'Sri Aurobindo Marg, New Delhi', city: 'Delhi', state: 'Delhi', phone: '+91-11-26588500', email: 'blood@aiims.edu', latitude: 28.5672, longitude: 77.2100, availableGroups: ['A+', 'B+', 'O+', 'AB+'], operatingHours: '24/7', type: 'hospital' },
  { name: 'Bangalore Medical Services', address: 'Victoria Hospital Campus, Fort', city: 'Bangalore', state: 'Karnataka', phone: '+91-80-26704444', email: 'blood@bms.org', latitude: 12.9586, longitude: 77.5730, availableGroups: ['A+', 'A-', 'B+', 'O+', 'O-'], operatingHours: '8:00 AM - 8:00 PM', type: 'blood_bank' },
  { name: 'Rotary Blood Bank', address: '56-57, Tughlakabad Institutional Area', city: 'Delhi', state: 'Delhi', phone: '+91-11-29956515', email: 'info@rotarybloodbank.org', latitude: 28.5088, longitude: 77.2491, availableGroups: ['A+', 'B+', 'B-', 'O+', 'O-', 'AB+'], operatingHours: '24/7', type: 'blood_bank' },
  { name: 'Tata Memorial Hospital', address: 'Dr E Borges Road, Parel', city: 'Mumbai', state: 'Maharashtra', phone: '+91-22-24177000', email: 'blood@tmc.gov.in', latitude: 19.0048, longitude: 72.8436, availableGroups: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'], operatingHours: '24/7', type: 'hospital' },
  { name: 'Lions Blood Bank', address: 'Sion-Trombay Road, Chembur', city: 'Mumbai', state: 'Maharashtra', phone: '+91-22-25222623', email: 'lions.bb@gmail.com', latitude: 19.0522, longitude: 72.8994, availableGroups: ['A+', 'B+', 'O+', 'AB+'], operatingHours: '9:00 AM - 6:00 PM', type: 'donation_center' },
  { name: 'Sankalp Blood Centre', address: 'Jayanagar 4th Block', city: 'Bangalore', state: 'Karnataka', phone: '+91-80-26534902', email: 'info@sankalp.org', latitude: 12.9279, longitude: 77.5937, availableGroups: ['A+', 'A-', 'B+', 'O+', 'O-'], operatingHours: '9:00 AM - 9:00 PM', type: 'donation_center' },
  { name: 'CMC Blood Bank', address: 'Ida Scudder Road', city: 'Chennai', state: 'Tamil Nadu', phone: '+91-416-2282102', email: 'blood@cmcvellore.ac.in', latitude: 12.9249, longitude: 79.1325, availableGroups: ['A+', 'B+', 'B-', 'O+', 'O-', 'AB+'], operatingHours: '24/7', type: 'hospital' }
];

// ===================== SEED FUNCTION =====================

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('\n🌱 Starting database seed...\n');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Community.deleteMany({}),
      Message.deleteMany({}),
      BloodRequest.deleteMany({}),
      Reply.deleteMany({}),
      Certificate.deleteMany({}),
      BloodBank.deleteMany({}),
      Notification.deleteMany({})
    ]);
    console.log('🗑️  Cleared existing data');

    // Create users (password will be hashed by model middleware)
    const users = await User.create(usersData);
    console.log(`✅ Created ${users.length} users`);

    // Create communities
    const communities = [];
    for (let i = 0; i < communitiesData.length; i++) {
      const leaderIndex = i % users.length;
      // Each community gets a different leader & random members
      const memberIndices = [leaderIndex];
      for (let j = 0; j < 5; j++) {
        const idx = (leaderIndex + j + 1) % users.length;
        if (!memberIndices.includes(idx)) memberIndices.push(idx);
      }

      const community = await Community.create({
        ...communitiesData[i],
        leader: users[leaderIndex]._id,
        members: memberIndices.map(idx => users[idx]._id)
      });

      // Update user joinedCommunities
      for (const idx of memberIndices) {
        await User.findByIdAndUpdate(users[idx]._id, {
          $addToSet: { joinedCommunities: community._id }
        });
      }

      communities.push(community);
    }
    console.log(`✅ Created ${communities.length} communities`);

    // Create messages
    const messageTexts = [
      'Hello everyone! Welcome to the group 🙏',
      'I donated blood last week. Feels great to help!',
      'Does anyone know a good blood bank nearby?',
      'We need more donors in our area. Please spread the word!',
      'I\'m available for donation this weekend.',
      'Thank you all for being such an amazing community ❤️',
      'Remember to stay hydrated before donating!',
      'Can anyone help with getting a B- donor? Very urgent.',
      'Blood donation camp happening at City Hospital this Saturday!',
      'Just completed my 5th donation. Every drop counts!',
      'Please check if you\'re eligible before coming to donate.',
      'A big shoutout to our volunteers! 🎉',
      'New members, please update your blood group in your profile.',
      'Does anyone have connections at Red Cross Blood Bank?',
      'Let\'s organize a group donation event next month!'
    ];

    const messages = [];
    for (const community of communities) {
      for (let i = 0; i < 8; i++) {
        const senderIndex = i % community.members.length;
        const msg = await Message.create({
          community: community._id,
          sender: community.members[senderIndex],
          content: messageTexts[i % messageTexts.length],
          type: 'text'
        });
        messages.push(msg);
      }
    }
    console.log(`✅ Created ${messages.length} messages`);

    // Create blood requests
    const bloodRequests = [];
    const requestData = [
      { bloodGroup: 'O+', urgency: 'critical', location: 'City Hospital, Mumbai', hospitalName: 'City Hospital', contactNumber: '+91-9876543210', description: 'Need O+ blood urgently for accident victim', requestType: 'other', unitsNeeded: 3 },
      { bloodGroup: 'A-', urgency: 'urgent', location: 'AIIMS, Delhi', hospitalName: 'AIIMS', contactNumber: '+91-9876543211', description: 'Rare blood group needed for surgery', requestType: 'family', unitsNeeded: 2 },
      { bloodGroup: 'B+', urgency: 'normal', location: 'Victoria Hospital, Bangalore', hospitalName: 'Victoria Hospital', contactNumber: '+91-9876543212', description: 'Scheduled surgery next week, need B+ donors', requestType: 'self', unitsNeeded: 1 },
      { bloodGroup: 'AB-', urgency: 'critical', location: 'Apollo Hospital, Chennai', hospitalName: 'Apollo Hospital', contactNumber: '+91-9876543213', description: 'Emergency! AB- is very rare, please help!', requestType: 'friend', unitsNeeded: 2 }
    ];

    for (let i = 0; i < requestData.length; i++) {
      const req = await BloodRequest.create({
        ...requestData[i],
        requester: users[i]._id,
        community: communities[i % communities.length]._id,
        status: i === 2 ? 'completed' : 'open'
      });
      bloodRequests.push(req);

      // Create corresponding message in community
      const urgencyLabel = req.urgency === 'critical' ? '🚨 CRITICAL' : '⚠️ URGENT';
      await Message.create({
        community: communities[i % communities.length]._id,
        sender: users[i]._id,
        content: `${urgencyLabel} BLOOD REQUEST\n\nBlood Group: ${req.bloodGroup}\nLocation: ${req.location}\nHospital: ${req.hospitalName}\nUnits: ${req.unitsNeeded}\nContact: ${req.contactNumber}\n\n${req.description}`,
        type: req.urgency === 'critical' ? 'emergency' : 'blood_request',
        bloodRequest: req._id
      });
    }
    console.log(`✅ Created ${bloodRequests.length} blood requests`);

    // Create replies to blood requests
    const replyTypes = ['can_donate', 'contact_me', 'nearby', 'hospital', 'blood_bank'];
    const replyMessages = ['I can help!', 'Call me anytime', 'I\'m near the hospital', 'Try Tata Memorial', 'Red Cross has stock'];
    const replies = [];
    for (let i = 0; i < bloodRequests.length; i++) {
      for (let j = 0; j < 2; j++) {
        const userIdx = (i + j + 3) % users.length;
        const reply = await Reply.create({
          bloodRequest: bloodRequests[i]._id,
          user: users[userIdx]._id,
          type: replyTypes[(i + j) % replyTypes.length],
          message: replyMessages[(i + j) % replyMessages.length]
        });
        replies.push(reply);
      }
    }
    console.log(`✅ Created ${replies.length} replies`);

    // Create certificates for some users
    const certUsers = [0, 1, 2, 4, 5];
    const certificates = [];
    for (const idx of certUsers) {
      const count = idx < 3 ? 3 : 1; // First 3 users get 3 certs (verified)
      for (let j = 0; j < count; j++) {
        const cert = await Certificate.create({
          user: users[idx]._id,
          title: `Blood Donation Certificate #${j + 1}`,
          fileUrl: `/uploads/sample-cert-${idx}-${j}.pdf`,
          donationDate: new Date(2024, 6 - j * 2, 15),
          hospitalName: ['City Hospital', 'Red Cross Center', 'Apollo Hospital'][j % 3],
          bloodGroup: users[idx].bloodGroup,
          isVerified: true
        });
        certificates.push(cert);
      }
      // Update donation count and verified status
      await User.findByIdAndUpdate(users[idx]._id, {
        donationCount: count,
        isVerifiedDonor: count >= 3
      });
    }
    console.log(`✅ Created ${certificates.length} certificates`);

    // Create blood banks
    await BloodBank.create(bloodBanksData);
    console.log(`✅ Created ${bloodBanksData.length} blood banks`);

    // Create sample notifications
    const notifications = [];
    for (let i = 0; i < 5; i++) {
      const notif = await Notification.create({
        user: users[i]._id,
        type: 'blood_request',
        title: '🚨 Urgent Blood Request Nearby',
        message: `Someone in your community needs ${['O+', 'A-', 'B+', 'AB-', 'O-'][i]} blood urgently.`,
        link: `/community/${communities[i % communities.length]._id}`,
        isRead: i > 2
      });
      notifications.push(notif);
    }
    console.log(`✅ Created ${notifications.length} notifications`);

    console.log('\n🎉 Database seeded successfully!\n');
    console.log('📧 Test Login Credentials:');
    console.log('   Email: rahul@example.com');
    console.log('   Password: password123');
    console.log('\n   (All users have the same password: password123)\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedDatabase();
