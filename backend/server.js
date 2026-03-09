require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const teamRoutes = require('./routes/teamRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const circularRoutes = require('./routes/circularRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const taskRoutes = require('./routes/taskRoutes');
const performanceRoutes = require('./routes/performanceRoutes');
const payrollRoutes = require('./routes/payrollRoutes');
const { sequelize } = require('./models');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/circulars', circularRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/payroll', payrollRoutes);

// Basic health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'HR MS Backend is running' });
});

async function startServer() {
    try {
        await sequelize.authenticate();
        console.log('Database connection established successfully.');

        // Sync models: force:false = only create tables if they do not exist
        // This is the safest option for SQLite with existing data
        const { User, Employee, Leave, Project, TeamInvitation, ProjectIdea, Attendance, Circular, Task, Salary } = require('./models');
        await User.sync({ force: false });
        await Employee.sync({ force: false });
        await Leave.sync({ force: false });
        await Project.sync({ force: false });
        await TeamInvitation.sync({ force: false });
        await ProjectIdea.sync({ force: false });
        await Attendance.sync({ force: false });
        await Circular.sync({ force: false });
        await Task.sync({ force: false });
        await Salary.sync({ force: false });
        console.log('Database synchronized.');

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Unable to start server:', error.message);
        process.exit(1);
    }
}

startServer();
