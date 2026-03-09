const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProjectIdea = sequelize.define('ProjectIdea', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    projectId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    authorId: {
        type: DataTypes.STRING,  // UUID
        allowNull: false
    },
    authorName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    authorRole: {
        type: DataTypes.STRING,
        allowNull: false
    },
    idea: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}, {
    tableName: 'project_ideas',
    timestamps: true
});

module.exports = ProjectIdea;
