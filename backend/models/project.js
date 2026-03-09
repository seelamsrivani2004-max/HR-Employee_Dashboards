const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Project = sequelize.define('Project', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    teamLeadId: {
        type: DataTypes.STRING, // UUID stored as string
        allowNull: false
    },
    teamLeadName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    deadline: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('Active', 'Completed', 'On Hold'),
        defaultValue: 'Active'
    }
}, {
    tableName: 'projects',
    timestamps: true
});

module.exports = Project;
