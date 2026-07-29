const User = require('../models/User');
const sequelize = require('../config/database');

const email = process.argv[2];

if (!email) {
  console.log('Usage: node scripts/makeAdmin.js <user-email>');
  process.exit(1);
}

async function promoteToAdmin() {
  try {
    await sequelize.authenticate();
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log(`Error: User with email "${email}" not found.`);
      process.exit(1);
    }

    await user.update({ role: 'admin', isVerified: true });
    console.log(`Success! User "${user.name}" (${user.email}) is now an ADMIN and VERIFIED.`);
  } catch (err) {
    console.error('Error promoting user:', err.message);
  } finally {
    await sequelize.close();
  }
}

promoteToAdmin();
