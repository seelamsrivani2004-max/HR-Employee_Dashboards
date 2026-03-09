const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Circular = sequelize.define('Circular', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('Holiday', 'Event', 'Info'),
        defaultValue: 'Info'
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    }
});

module.exports = Circular;
