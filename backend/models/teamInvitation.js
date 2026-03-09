const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TeamInvitation = sequelize.define('TeamInvitation', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    projectId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    teamLeadId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    employeeId: {
        type: DataTypes.STRING,  // UUID of the invited user
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
    status: {
        type: DataTypes.ENUM('Pending', 'Accepted', 'Rejected'),
        defaultValue: 'Pending'
    }
}, {
    tableName: 'team_invitations',
    timestamps: true
});

module.exports = TeamInvitation;
