const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Salary = sequelize.define('Salary', {
    id: {
        type: DataTypes.TEXT,
        primaryKey: true
    },
    employeeId: {
        type: DataTypes.TEXT,
        allowNull: false,
        references: {
            model: 'Employees',
            key: 'id'
        }
    },
    basicSalary: {
        type: DataTypes.REAL,
        defaultValue: 0
    },
    bonus: {
        type: DataTypes.REAL,
        defaultValue: 0
    },
    deductions: {
        type: DataTypes.REAL,
        defaultValue: 0
    },
    netSalary: {
        type: DataTypes.REAL,
        defaultValue: 0
    },
    month: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    year: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    status: {
        type: DataTypes.TEXT,
        defaultValue: 'Paid'
    }
}, {
    tableName: 'Salaries',
    timestamps: false // No createdAt/updatedAt in the provided schema
});

module.exports = Salary;
