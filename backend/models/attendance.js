const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Attendance = sequelize.define('Attendance', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    checkIn: {
        type: DataTypes.DATE,
        allowNull: true
    },
    checkOut: {
        type: DataTypes.DATE,
        allowNull: true
    },
    hoursWorked: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'Present'
    }
});

module.exports = Attendance;
