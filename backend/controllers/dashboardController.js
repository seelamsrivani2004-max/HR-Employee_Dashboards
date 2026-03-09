const { User, Employee, Leave, Attendance, Task, Project, sequelize } = require('../models');
const { Op } = require('sequelize');

const getStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        const today = new Date().toISOString().split('T')[0];
        const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

        if (role === 'Employee') {
            // Tasks Pending
            const tasksPending = await Task.count({
                where: { userId, status: { [Op.ne]: 'Completed' } }
            });
            const tasksDueToday = await Task.count({
                where: { userId, due: today, status: { [Op.ne]: 'Completed' } }
            });

            // Leave Balance (Calculate available days)
            const allowances = { 'Annual Leave': 18, 'Sick Leave': 10, 'Casual Leave': 7 };
            const approvedLeavesSummary = await Leave.findAll({
                where: { userId, status: 'Approved' },
                attributes: ['leaveType', [sequelize.fn('SUM', sequelize.col('days')), 'totalUsed']],
                group: ['leaveType']
            });
            const usedDays = approvedLeavesSummary.reduce((acc, l) => acc + (parseInt(l.get('totalUsed')) || 0), 0);
            const totalAllowance = Object.values(allowances).reduce((a, b) => a + b, 0);
            const leaveBalanceCount = totalAllowance - usedDays;

            // Days Present this month
            const daysPresent = await Attendance.count({
                where: { 
                    userId, 
                    date: { [Op.gte]: firstDayOfMonth },
                    status: 'Present'
                }
            });

            // Performance Calculation: (Completed Tasks / Total Tasks)
            const totalTasks = await Task.count({ where: { userId } });
            const completedTasks = await Task.count({ where: { userId, status: 'Completed' } });
            const performanceScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            return res.json({
                tasksPending,
                tasksDueToday,
                leaveBalance: leaveBalanceCount,
                daysPresent,
                performance: `${performanceScore}%`
            });
        } else {
            // Admin / HR Stats
            const totalEmployees = await User.count({ where: { role: 'Employee' } });
            
            const pendingLeaves = await Leave.count({ where: { status: 'Pending' } });
            
            // Total projects (count records in Project model if exists)
            const activeProjects = await Project.count();

            // Today's attendance rate
            const todayPresent = await Attendance.count({
                where: { date: today, status: 'Present' }
            });
            const attendanceRate = totalEmployees > 0 ? Math.round((todayPresent / totalEmployees) * 100) : 0;

            return res.json({
                totalEmployees,
                pendingLeaves,
                activeProjects,
                attendanceRate: `${attendanceRate}%`
            });
        }
    } catch (error) {
        console.error('Dashboard Stats Error:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getStats };
