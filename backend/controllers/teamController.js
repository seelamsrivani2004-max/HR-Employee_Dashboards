const { User, Employee, Project, TeamInvitation, ProjectIdea } = require('../models');

// ─── Team Lead: Get all employees to invite ────────────────────────────────
const getAllEmployees = async (req, res) => {
    try {
        const { Op } = require('sequelize');
        const employees = await User.findAll({
            where: { 
                role: { [Op.in]: ['Employee', 'Teamlead', 'HR'] }, 
                isVerified: true 
            },
            include: [{ model: Employee, attributes: ['firstName', 'lastName', 'designation', 'department'] }],
            attributes: ['id', 'email', 'role', 'firstName', 'lastName']
        });

        const result = employees.map(u => ({
            id: u.id,
            email: u.email,
            name: (u.firstName && u.firstName !== 'N/A') 
                ? `${u.firstName} ${u.lastName || ''}`.trim()
                : u.Employee && u.Employee.firstName 
                    ? `${u.Employee.firstName} ${u.Employee.lastName || ''}`.trim()
                    : u.email.split('@')[0],
            designation: u.Employee?.designation || u.role
        }));

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ─── Team Lead: Create project + send invitations ─────────────────────────
const createProject = async (req, res) => {
    try {
        const { name, description, deadline, employeeIds } = req.body;
        const teamLeadId = req.user.id;

        if (!name || !description || !employeeIds || employeeIds.length === 0) {
            return res.status(400).json({ error: 'Project name, description, and at least one employee are required.' });
        }

        // Get team lead's name
        const lead = await User.findByPk(teamLeadId, { include: [Employee] });
        const teamLeadName = lead.Employee
            ? `${lead.Employee.firstName} ${lead.Employee.lastName}`.trim()
            : lead.email.split('@')[0];

        // Create the project
        const project = await Project.create({ teamLeadId, teamLeadName, name, description, deadline: deadline || null });

        // Send invitations to each selected employee
        const employees = await User.findAll({
            where: { id: employeeIds },
            include: [Employee]
        });

        const invitations = employees.map(emp => ({
            projectId: project.id,
            teamLeadId,
            employeeId: emp.id,
            employeeName: emp.Employee
                ? `${emp.Employee.firstName} ${emp.Employee.lastName}`.trim()
                : emp.email.split('@')[0],
            employeeEmail: emp.email,
            status: 'Pending'
        }));

        await TeamInvitation.bulkCreate(invitations);

        res.status(201).json({ message: 'Project created and invitations sent.', project });
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ error: error.message });
    }
};

// ─── Team Lead: View own projects with member statuses ────────────────────
const getMyProjects = async (req, res) => {
    try {
        const projects = await Project.findAll({
            where: { teamLeadId: req.user.id },
            include: [{
                model: TeamInvitation,
                attributes: ['id', 'employeeId', 'employeeName', 'employeeEmail', 'status']
            }, {
                model: ProjectIdea,
                attributes: ['id', 'authorName', 'authorRole', 'idea', 'createdAt']
            }],
            order: [['createdAt', 'DESC']]
        });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ─── Employee: View own invitations ───────────────────────────────────────
const getMyInvitations = async (req, res) => {
    try {
        const invitations = await TeamInvitation.findAll({
            where: { employeeId: req.user.id },
            include: [{
                model: Project,
                attributes: ['id', 'name', 'description', 'deadline', 'status', 'teamLeadName'],
                include: [{
                    model: ProjectIdea,
                    attributes: ['id', 'authorName', 'authorRole', 'idea', 'createdAt']
                }]
            }],
            order: [['createdAt', 'DESC']]
        });
        res.json(invitations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ─── Employee: Respond to invitation ──────────────────────────────────────
const respondToInvitation = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['Accepted', 'Rejected'].includes(status)) {
            return res.status(400).json({ error: 'Status must be Accepted or Rejected' });
        }

        const invitation = await TeamInvitation.findOne({
            where: { id, employeeId: req.user.id }
        });

        if (!invitation) return res.status(404).json({ error: 'Invitation not found' });
        if (invitation.status !== 'Pending') {
            return res.status(400).json({ error: 'Invitation already responded to' });
        }

        invitation.status = status;
        await invitation.save();

        res.json({ message: `Invitation ${status.toLowerCase()} successfully.`, invitation });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ─── Any member: Post an idea ─────────────────────────────────────────────
const postIdea = async (req, res) => {
    try {
        const { id: projectId } = req.params;
        const { idea } = req.body;
        const authorId = req.user.id;

        if (!idea || !idea.trim()) {
            return res.status(400).json({ error: 'Idea cannot be empty' });
        }

        // Verify user is part of this project (Team Lead or accepted member)
        const project = await Project.findByPk(projectId);
        if (!project) return res.status(404).json({ error: 'Project not found' });

        const isTeamLead = project.teamLeadId === authorId;
        const isMember = await TeamInvitation.findOne({
            where: { projectId, employeeId: authorId, status: 'Accepted' }
        });

        if (!isTeamLead && !isMember) {
            return res.status(403).json({ error: 'You are not a member of this project' });
        }

        // Get author's name
        const author = await User.findByPk(authorId, { include: [Employee] });
        const authorName = author.Employee
            ? `${author.Employee.firstName} ${author.Employee.lastName}`.trim()
            : author.email.split('@')[0];

        const newIdea = await ProjectIdea.create({
            projectId,
            authorId,
            authorName,
            authorRole: req.user.role,
            idea: idea.trim()
        });

        res.status(201).json(newIdea);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ─── Any member: Get all ideas for a project ──────────────────────────────
const getIdeas = async (req, res) => {
    try {
        const { id: projectId } = req.params;
        const ideas = await ProjectIdea.findAll({
            where: { projectId },
            order: [['createdAt', 'DESC']]
        });
        res.json(ideas);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ─── HR/Admin: Get ALL projects across all team leads ─────────────────────
const getAllProjects = async (req, res) => {
    try {
        const projects = await Project.findAll({
            include: [
                {
                    model: TeamInvitation,
                    attributes: ['id', 'employeeId', 'employeeName', 'employeeEmail', 'status']
                },
                {
                    model: ProjectIdea,
                    attributes: ['id', 'authorName', 'authorRole', 'idea', 'createdAt']
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllEmployees,
    getAllProjects,
    createProject,
    getMyProjects,
    getMyInvitations,
    respondToInvitation,
    postIdea,
    getIdeas
};
