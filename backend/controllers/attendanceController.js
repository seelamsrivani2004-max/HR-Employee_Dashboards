const { Attendance, User } = require('../models');
const { Op } = require('sequelize');

const checkIn = async (req, res) => {
    try {
        const userId = req.user.id;
        const date = new Date().toISOString().split('T')[0];

        // Check if already checked in today
        let attendance = await Attendance.findOne({
            where: { userId, date }
        });

        if (attendance) {
            return res.status(400).json({ error: 'Already checked in today' });
        }

        attendance = await Attendance.create({
            userId,
            date,
            checkIn: new Date(),
            status: 'Present'
        });

        res.status(201).json({ message: 'Checked in successfully', attendance });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const checkOut = async (req, res) => {
    try {
        const userId = req.user.id;
        const date = new Date().toISOString().split('T')[0];

        const attendance = await Attendance.findOne({
            where: { userId, date }
        });

        if (!attendance) {
            return res.status(404).json({ error: 'Check-in record not found for today' });
        }

        if (attendance.checkOut) {
            return res.status(400).json({ error: 'Already checked out today' });
        }

        const checkOutTime = new Date();
        const checkInTime = new Date(attendance.checkIn);
        const diffMs = checkOutTime - checkInTime;
        const hoursWorked = (diffMs / (1000 * 60 * 60)).toFixed(2);

        attendance.checkOut = checkOutTime;
        attendance.hoursWorked = hoursWorked;
        await attendance.save();

        res.json({ message: 'Checked out successfully', attendance });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getMyAttendance = async (req, res) => {
    try {
        const userId = req.user.id;
        const attendance = await Attendance.findAll({
            where: { userId },
            order: [['date', 'DESC']]
        });
        res.json(attendance);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAllAttendance = async (req, res) => {
    try {
        if (req.user.role !== 'Admin' && req.user.role !== 'HR') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const attendance = await Attendance.findAll({
            include: [{ model: User, attributes: ['email', 'role'] }],
            order: [['date', 'DESC']]
        });
        res.json(attendance);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getTodayStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const date = new Date().toISOString().split('T')[0];
        const attendance = await Attendance.findOne({
            where: { userId, date }
        });
        res.json(attendance || { message: 'Not checked in' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { checkIn, checkOut, getMyAttendance, getAllAttendance, getTodayStatus };
