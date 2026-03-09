const User = require('./user');
const Employee = require('./employee');
const Leave = require('./leave');
const Project = require('./project');
const TeamInvitation = require('./teamInvitation');
const ProjectIdea = require('./projectIdea');
const Attendance = require('./attendance');
const Circular = require('./circular');
const Task = require('./task');
const Salary = require('./salary');
const sequelize = require('../config/database');

// Associations
User.hasOne(Employee, { foreignKey: 'userId', onDelete: 'CASCADE' });
Employee.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Leave, { foreignKey: 'userId', onDelete: 'CASCADE' });
Leave.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Attendance, { foreignKey: 'userId', onDelete: 'CASCADE' });
Attendance.belongsTo(User, { foreignKey: 'userId' });

Project.hasMany(TeamInvitation, { foreignKey: 'projectId', onDelete: 'CASCADE' });
TeamInvitation.belongsTo(Project, { foreignKey: 'projectId' });

Project.hasMany(ProjectIdea, { foreignKey: 'projectId', onDelete: 'CASCADE' });
ProjectIdea.belongsTo(Project, { foreignKey: 'projectId' });

User.hasMany(Task, { foreignKey: 'userId', onDelete: 'CASCADE' });
Task.belongsTo(User, { foreignKey: 'userId' });

Employee.hasMany(Salary, { foreignKey: 'employeeId', onDelete: 'CASCADE' });
Salary.belongsTo(Employee, { foreignKey: 'employeeId' });

module.exports = {
    sequelize,
    User,
    Employee,
    Leave,
    Project,
    TeamInvitation,
    ProjectIdea,
    Attendance,
    Circular,
    Attendance,
    Circular,
    Task,
    Salary
};
