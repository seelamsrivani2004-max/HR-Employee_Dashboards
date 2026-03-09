const { Leave, User, Employee, sequelize } = require('../models');
const { Op } = require('sequelize');

// Employee: Submit a leave request
const submitLeave = async (req, res) => {
    try {
        const { leaveType, fromDate, toDate, reason } = req.body;
        const userId = req.user.id;

        if (!leaveType || !fromDate || !toDate || !reason) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Calculate number of days
        const from = new Date(fromDate);
        const to = new Date(toDate);
        if (to < from) {
            return res.status(400).json({ error: 'To date must be after From date' });
        }
        const days = Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;

        // Get employee name
        const user = await User.findByPk(userId, { include: ['Employee'] });
        const employeeName = user.Employee
            ? `${user.Employee.firstName} ${user.Employee.lastName}`.trim()
            : user.email.split('@')[0];

        const leave = await Leave.create({
            userId,
            employeeName,
            employeeEmail: user.email,
            leaveType,
            fromDate,
            toDate,
            days,
            reason,
            status: 'Pending'
        });

        res.status(201).json({ message: 'Leave request submitted successfully', leave });
    } catch (error) {
        console.error('Submit leave error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Employee: Get own leave requests
const getMyLeaves = async (req, res) => {
    try {
        const leaves = await Leave.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']]
        });
        res.json(leaves);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// HR/Admin: Get ALL leave requests
const getAllLeaves = async (req, res) => {
    try {
        const { role } = req.user;

        let whereClause = {};
        
        // If HR, only show non-HR employee leaves
        const includeClause = [{
            model: User,
            attributes: ['role']
        }];

        if (role === 'HR') {
            whereClause = {
                '$User.role$': { [Op.ne]: 'HR' }
            };
        }

        const leaves = await Leave.findAll({
            where: whereClause,
            include: includeClause,
            order: [['createdAt', 'DESC']]
        });
        res.json(leaves);
    } catch (error) {
        console.error('Get all leaves error:', error);
        res.status(500).json({ error: error.message });
    }
};

// HR/Admin: Approve or Reject a leave request
const updateLeaveStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, hrComment } = req.body;
        const { role: currentUserRole } = req.user;

        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ error: 'Status must be Approved or Rejected' });
        }

        const leave = await Leave.findByPk(id, {
            include: [{ model: User, attributes: ['role'] }]
        });

        if (!leave) return res.status(404).json({ error: 'Leave request not found' });

        // Restriction: HR cannot approve/reject another HR's leave
        if (currentUserRole === 'HR' && leave.User && leave.User.role === 'HR') {
            return res.status(403).json({ error: 'HR employees cannot approve or reject leaves for other HR staff. This must be done by an Admin.' });
        }

        leave.status = status;
        leave.hrComment = hrComment || '';
        await leave.save();

        res.json({ message: `Leave request ${status.toLowerCase()} successfully`, leave });
    } catch (error) {
        console.error('Update leave status error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Employee: Get leave balance
const getLeaveBalance = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Define total allowances
        const allowances = {
            'Annual Leave': 18,
            'Sick Leave': 10,
            'Casual Leave': 7
        };

        // Get approved leaves grouped by type
        const usedLeaves = await Leave.findAll({
            where: { 
                userId, 
                status: 'Approved' 
            },
            attributes: [
                'leaveType',
                [sequelize.fn('SUM', sequelize.col('days')), 'totalUsed']
            ],
            group: ['leaveType']
        });

        // Map used leaves to a simpler object
        const usedMap = {};
        usedLeaves.forEach(l => {
            usedMap[l.leaveType] = parseInt(l.get('totalUsed')) || 0;
        });

        // Consolidate balances
        const balances = Object.keys(allowances).map(type => ({
            type,
            total: allowances[type],
            used: usedMap[type] || 0,
            available: allowances[type] - (usedMap[type] || 0)
        }));

        res.json(balances);
    } catch (error) {
        console.error('Get leave balance error:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { submitLeave, getMyLeaves, getAllLeaves, updateLeaveStatus, getLeaveBalance };
