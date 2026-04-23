const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

/**
 * Firebase Admin SDK Initialization
 */
const initializeFirebase = () => {
  try {
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      console.warn('⚠️ Firebase environment variables are missing. Please update your .env file.');
      console.warn('💡 You need: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
    }

    const privateKey = process.env.FIREBASE_PRIVATE_KEY 
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') 
      : undefined;

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });

    console.log('✅ Firebase Admin initialized');
    return admin.firestore();
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
    return null;
  }
};

const db = initializeFirebase();

/**
 * Helper to convert Firestore Timestamps to JS Dates recursively
 */
const formatFirestoreData = (data) => {
  if (!data || typeof data !== 'object') return data;

  if (data.toDate && typeof data.toDate === 'function') {
    return data.toDate();
  }

  if (Array.isArray(data)) {
    return data.map(formatFirestoreData);
  }

  const formatted = {};
  for (const key in data) {
    formatted[key] = formatFirestoreData(data[key]);
  }
  return formatted;
};

module.exports = { admin, db, formatFirestoreData };
