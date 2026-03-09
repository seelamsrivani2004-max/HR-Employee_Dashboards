const { User, Employee, Task, Attendance, Leave, sequelize } = require('../models');
const { Op } = require('sequelize');

const getAllPerformance = async (req, res) => {
    try {
        const employees = await User.findAll({
            where: { role: { [Op.in]: ['Employee', 'Teamlead'] }, isVerified: true },
            include: [{ model: Employee, attributes: ['firstName', 'lastName', 'designation', 'department'] }],
            attributes: ['id', 'email', 'firstName', 'lastName']
        });

        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        const dateToday = today.toISOString().split('T')[0];

        const performanceData = await Promise.all(employees.map(async (u) => {
            const userId = u.id;

            // 1. Task Accuracy: (Completed / Total)
            const totalTasks = await Task.count({ where: { userId } });
            const completedTasks = await Task.count({ where: { userId, status: 'Completed' } });
            const taskAccuracy = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            // 2. Attendance Rate (Current Month)
            // Simulating 22 working days for simplicity, or count unique dates in the month so far
            const daysPresent = await Attendance.count({
                where: { 
                    userId, 
                    date: { [Op.gte]: firstDayOfMonth, [Op.lte]: dateToday },
                    status: 'Present'
                }
            });
            // Assume 22 days per month for a rough metric
            const attendanceRate = Math.min(100, Math.round((daysPresent / 22) * 100));

            // 3. Leave Count (Approved days)
            const leaves = await Leave.findAll({
                where: { userId, status: 'Approved' },
                attributes: [[sequelize.fn('SUM', sequelize.col('days')), 'totalDays']]
            });
            const leaveDays = leaves[0]?.get('totalDays') || 0;

            const name = (u.firstName && u.firstName !== 'N/A') 
                ? `${u.firstName} ${u.lastName || ''}`.trim()
                : u.Employee && u.Employee.firstName 
                    ? `${u.Employee.firstName} ${u.Employee.lastName || ''}`.trim()
                    : u.email.split('@')[0];

            return {
                id: userId,
                name,
                email: u.email,
                designation: u.Employee?.designation || 'N/A',
                department: u.Employee?.department || 'N/A',
                metrics: {
                    taskAccuracy,
                    attendanceRate,
                    leaveDays
                },
                score: Math.round((taskAccuracy * 0.7) + (attendanceRate * 0.3)) // Simple weighted score
            };
        }));

        // Sort by score descending
        performanceData.sort((a, b) => b.score - a.score);

        res.json(performanceData);
    } catch (error) {
        console.error('Performance Data Error:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getAllPerformance };
