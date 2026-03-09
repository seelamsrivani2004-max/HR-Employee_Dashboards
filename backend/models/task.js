const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Task = sequelize.define('Task', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    priority: {
        type: DataTypes.ENUM('Low', 'Medium', 'High'),
        defaultValue: 'Medium'
    },
    status: {
        type: DataTypes.ENUM('Pending', 'In Progress', 'Completed'),
        defaultValue: 'Pending'
    },
    due: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    project: {
        type: DataTypes.STRING,
        defaultValue: 'General'
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    createdBy: {
        type: DataTypes.UUID,
        allowNull: false
    }
});

module.exports = Task;
