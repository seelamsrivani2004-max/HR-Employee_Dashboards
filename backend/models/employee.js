const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Employee = sequelize.define('Employee', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true
    },
    firstName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    phone: DataTypes.STRING,
    profileImage: DataTypes.TEXT,
    address: DataTypes.TEXT,
    designation: DataTypes.STRING,
    department: DataTypes.STRING,
    salary: DataTypes.DECIMAL(10, 2),
    joiningDate: DataTypes.STRING,
    status: {
        type: DataTypes.STRING,
        defaultValue: 'Active'
    }
});

module.exports = Employee;
