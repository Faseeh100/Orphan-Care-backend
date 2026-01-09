const Contact = require('../models/Contact');
const nodemailer = require('nodemailer');
const validator = require('validator');
const fs = require('fs').promises;
const path = require('path');


const sendUniversalEmail = async (contactData) => {
  try {
    console.log('📧 Starting universal email...');
    
    // Load HTML template
    const templatePath = path.join(__dirname, '../templates/message.html');
    let html = await fs.readFile(templatePath, 'utf8');
    
    // Fill template variables
    html = html
      .replace(/{{name}}/g, contactData.name || '')
      .replace(/{{email}}/g, contactData.email || '')
      .replace(/{{message}}/g, contactData.message || '')
      .replace(/{{timestamp}}/g, new Date().toLocaleString())
      .replace(/{{ipAddress}}/g, contactData.ip_address || 'Unknown')
      .replace(/{{messageId}}/g, contactData.id || '')
      .replace(/{{adminUrl}}/g, '#');
    
    // Try different email services
    const emailServices = [
      {
        name: 'Gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      {
        name: 'Outlook',
        host: 'smtp.office365.com', 
        port: 587,
        secure: false,
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      {
        name: 'Yahoo',
        host: 'smtp.mail.yahoo.com',
        port: 587,
        secure: false,
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    ];
    
    // Try each service until one works
    for (const service of emailServices) {
      try {
        console.log(`🔄 Trying ${service.name} SMTP...`);
        
        const transporter = nodemailer.createTransport({
          host: service.host,
          port: service.port,
          secure: service.secure,
          auth: {
            user: service.user,
            pass: service.pass
          },
          tls: {
            rejectUnauthorized: false
          }
        });
        
        const info = await transporter.sendMail({
          from: `"Contact Form" <${service.user}>`,
          to: process.env.ADMIN_EMAIL || service.user,
          subject: `📨 New Contact: ${contactData.name}`,
          html: html,
          text: `Name: ${contactData.name}\nEmail: ${contactData.email}\nMessage: ${contactData.message}`
        });
        
        console.log(`✅ Email sent via ${service.name}: ${info.messageId}`);
        return true;
        
      } catch (serviceError) {
        console.log(`❌ ${service.name} failed: ${serviceError.message}`);
        continue;
      }
    }
    
    console.log('❌ All email services failed');
    return false;
    
  } catch (error) {
    console.error('Universal email error:', error.message);
    return false;
  }
};

// Main controller
exports.submitContactForm = async (req, res) => {
  console.log('🔍 Contact form submission STARTED');
  
  try {
    const { name, email, message } = req.body;
    
    console.log('📦 Received data:', { name, email, message });
    
    // Validation
    if (!name || !email || !message) {
      console.log('❌ Validation failed - missing fields');
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required'
      });
    }

    if (!validator.isEmail(email)) {
      console.log('❌ Validation failed - invalid email');
      return res.status(400).json({
        success: false,
        message: 'Invalid email address'
      });
    }

    console.log('💾 Attempting to save to database...');
    
    // 1. Save to PostgreSQL
    const contact = await Contact.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      message: message.trim(),
      ip_address: req.ip || '127.0.0.1',
      user_agent: req.headers['user-agent'] || 'Unknown',
      email_sent: false
    });

    console.log(`✅ SAVED TO DATABASE - ID: ${contact.id}`);
    console.log('📊 Contact record:', JSON.stringify(contact.toJSON(), null, 2));

    // 2. Send UNIVERSAL email (works for ALL email providers)
    sendUniversalEmail(contact).then(success => {
      if (success) {
        console.log(`✅ Email sent for contact ID: ${contact.id}`);
        // Update record if email sent
        Contact.update({ email_sent: true }, { where: { id: contact.id } })
          .then(() => console.log(`📧 Updated email_sent for ID: ${contact.id}`))
          .catch(err => console.log('❌ Failed to update email_sent:', err.message));
      } else {
        console.log(`❌ Email failed for contact ID: ${contact.id}`);
      }
    }).catch(err => {
      console.log('❌ Email sending failed:', err.message);
    });

    // 3. Respond immediately
    res.status(201).json({
      success: true,
      message: 'Message submitted successfully!',
      data: {
        id: contact.id,
        name: contact.name,
        email: contact.email,
        submitted_at: contact.createdAt
      }
    });

  } catch (error) {
    console.error('❌ SERVER ERROR in submitContactForm:', error);
    console.error('Error stack:', error.stack);
    
    // Check for Sequelize errors
    if (error.name === 'SequelizeValidationError') {
      console.error('Sequelize validation errors:', error.errors);
      return res.status(400).json({
        success: false,
        message: 'Validation error: ' + error.errors.map(e => e.message).join(', ')
      });
    }
    
    if (error.name === 'SequelizeDatabaseError') {
      console.error('Database error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Database error: ' + error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message
    });
  }
};

// Get all contacts
exports.getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.findAll({
      order: [['createdAt', 'DESC']]
    });
    
    console.log(`📋 Found ${contacts.length} contacts in database`);
    res.json({ success: true, data: contacts });
    
  } catch (error) {
    console.error('Error getting contacts:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
};