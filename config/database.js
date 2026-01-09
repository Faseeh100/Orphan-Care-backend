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

let sequelize;

if (process.env.NODE_ENV === 'production') {
  // Use the direct connection URL provided by the Vercel-Supabase integration
  sequelize = new Sequelize(process.env.POSTGRES_URL_NON_POOLING, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // This is crucial for Supabase's SSL
      }
    },
    logging: false // Optional: keeps Vercel logs clean
  });
} else {
  // For local development, keep using your local .env variable
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: console.log // Optional: helps with local debugging
  });
}

module.exports = sequelize;