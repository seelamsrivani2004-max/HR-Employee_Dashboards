const { Task, User, Employee } = require('../models');

const getMyTasks = async (req, res) => {
    try {
        const tasks = await Task.findAll({
            where: { userId: req.user.id },
            order: [['due', 'ASC']]
        });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createTask = async (req, res) => {
    try {
        const { title, priority, status, due, project, assignedTo } = req.body;
        // assignedTo would be the userId. If not provided, default to current user
        const userId = assignedTo || req.user.id;

        // Restriction: HR tasks must be assigned by Admin
        const assignedUser = await User.findByPk(userId);
        if (assignedUser && assignedUser.role === 'HR' && req.user.role !== 'Admin') {
            return res.status(403).json({ error: 'Only Admins can assign tasks to employees with the HR role.' });
        }
        
        const task = await Task.create({
            title, priority, status, due, project, userId,
            createdBy: req.user.id
        });
        res.status(201).json(task);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const task = await Task.findByPk(id);
        if (!task) return res.status(404).json({ error: 'Task not found' });
        
        // Authorization check: Only assigned user, creator, or admin/HR can update status
        const isAssigned = task.userId === req.user.id;
        const isCreator = task.createdBy === req.user.id;
        const isAdminOrHR = ['Admin', 'HR'].includes(req.user.role);

        if (!isAssigned && !isCreator && !isAdminOrHR) {
            return res.status(403).json({ error: 'You are not authorized to update this task.' });
        }

        task.status = status;
        await task.save();
        res.json(task);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const getAssignedTasks = async (req, res) => {
    try {
        const tasks = await Task.findAll({
            where: { createdBy: req.user.id },
            include: [{ 
                model: User, 
                include: [{ model: Employee, attributes: ['firstName', 'lastName'] }] 
            }],
            order: [['createdAt', 'DESC']]
        });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getMyTasks, createTask, updateTask, getAssignedTasks };
