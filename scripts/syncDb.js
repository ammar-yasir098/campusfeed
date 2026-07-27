const sequelize = require('../config/database');
require('../models');

async function syncDatabase() {
    try {
        console.log('Connecting to PostgreSQL database...');
        await sequelize.authenticate();
        console.log('PostgreSQL connected.');
        
        console.log('Syncing database models (creating/altering tables)...');
        await sequelize.sync({ alter: true });
        console.log('✅ PostgreSQL database tables (users, posts) created/updated successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Database migration error:', error);
        process.exit(1);
    }
}

syncDatabase();
