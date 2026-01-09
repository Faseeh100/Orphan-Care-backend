// const { Sequelize } = require('sequelize');
// require('dotenv').config();

// const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/orphan_care', {
//   dialect: 'postgres',
//   logging: process.env.NODE_ENV === 'development' ? console.log : false,
//   dialectOptions: {
//     ssl: process.env.NODE_ENV === 'production' ? {
//       require: true,
//       rejectUnauthorized: false
//     } : false
//   },
//   pool: {
//     max: 5,
//     min: 0,
//     acquire: 30000,
//     idle: 10000
//   }
// });

// // Test the connection
// sequelize.authenticate()
//   .then(() => console.log('✅ PostgreSQL connected via Sequelize'))
//   .catch(err => console.error('❌ Unable to connect to PostgreSQL:', err));

// module.exports = sequelize;



const { Sequelize } = require('sequelize');
require('dotenv').config();

// Determine the correct connection string
let connectionString;
if (process.env.NODE_ENV === 'production') {
  // 1. Vercel provides POSTGRES_URL, NOT DATABASE_URL
  connectionString = process.env.POSTGRES_URL;
  console.log('Production: Using POSTGRES_URL from Vercel');
} else {
  // 2. Local development uses DATABASE_URL
  connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/orphan_care';
  console.log('Development: Using DATABASE_URL');
}

const sequelize = new Sequelize(connectionString, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Test the connection
sequelize.authenticate()
  .then(() => console.log('✅ PostgreSQL connected via Sequelize'))
  .catch(err => console.error('❌ Unable to connect to PostgreSQL:', err));

module.exports = sequelize;