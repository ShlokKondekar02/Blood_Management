const bcrypt = require('bcryptjs');

async function testPassword() {
  const password = 'password123';
  const hash = '$2a$12$axk1KM5pk36GLVvRgWrgRe6sCP7UDnKxR26ByWFSi1nhmIbxKIH1K';
  
  const isMatch = await bcrypt.compare(password, hash);
  console.log('Password match:', isMatch);
}

testPassword();
