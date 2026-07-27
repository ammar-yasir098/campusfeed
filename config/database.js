const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;

if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: process.env.NODE_ENV === 'production' ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {}
  });
} else {
  sequelize = new Sequelize(
    process.env.PG_DATABASE || 'campusfeed',
    process.env.PG_USER || 'postgres',
    process.env.PG_PASSWORD || 'postgres',
    {
      host: process.env.PG_HOST || 'localhost',
      port: process.env.PG_PORT || 5432,
      dialect: 'postgres',
      logging: false,
    }
  );
}

module.exports = sequelize;
