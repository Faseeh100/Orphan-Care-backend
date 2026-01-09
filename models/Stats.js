const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Stat = sequelize.define('Stat', {
  key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  value: {
    type: DataTypes.STRING,
    allowNull: false
  },
  label: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'stats',
  timestamps: true
});

module.exports = Stat;