const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');


// Import database and models
const sequelize = require('./config/database');


// Import routes
const userRoutes = require('./routes/userRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const imageRoutes = require('./routes/imageRoutes');
const contactRoutes = require('./routes/contactRoutes');
const programRoutes = require('./routes/programRoutes');
const statRoutes = require('./routes/statsRoutes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: 'http://localhost:3000'
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ 
    message: 'Orphan Care Backend API',
    version: '1.0.0',
    status: 'running',
    database: 'PostgreSQL with Sequelize ORM'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/images', imageRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/api/contact', contactRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/stats', statRoutes);




async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Sync all models (Contact model will auto-load)
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized');
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server listening at http://localhost:${PORT}`);
      console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Database: ${sequelize.config.database}`);
      console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? 'Configured' : 'Using default'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}



// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT. Closing database connections...');
  await sequelize.close();
  console.log('✅ Database connections closed');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM. Closing database connections...');
  await sequelize.close();
  console.log('✅ Database connections closed');
  process.exit(0);
});

// Start the application
startServer();