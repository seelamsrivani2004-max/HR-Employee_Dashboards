const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Leave = sequelize.define('Leave', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    employeeName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    employeeEmail: {
        type: DataTypes.STRING,
        allowNull: false
    },
    leaveType: {
        type: DataTypes.STRING,
        allowNull: false
    },
    fromDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    toDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    days: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    reason: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
        defaultValue: 'Pending'
    },
    hrComment: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'leaves',
    timestamps: true
});

module.exports = Leave;
