const { db } = require('./config/firebase');

async function checkUser() {
  try {
    const snapshot = await db.collection('users').where('email', '==', 'shlok@demo.com').get();
    if (snapshot.empty) {
      console.log('❌ User not found in database');
    } else {
      console.log('✅ User found:', snapshot.docs[0].id);
      console.log('Data:', snapshot.docs[0].data());
    }
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkUser();
