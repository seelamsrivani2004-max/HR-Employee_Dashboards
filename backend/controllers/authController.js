const { User, Employee, sequelize } = require('../models');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendVerificationCode, sendPasswordResetCode } = require('../config/email');

const register = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { email, password, role, firstName, lastName, employeeId, phone } = req.body;

        if (!employeeId) {
            await t.rollback();
            return res.status(400).json({ error: 'Employee ID is required' });
        }

        // Check if user or employeeId already exists
        const existingUser = await User.findOne({ 
            where: { 
                [sequelize.Sequelize.Op.or]: [{ email }, { employeeId }] 
            } 
        });
        
        if (existingUser) {
            await t.rollback();
            const field = existingUser.email === email ? 'Email' : 'Employee ID';
            return res.status(400).json({ error: `${field} already registered` });
        }

        // Restrict Admin and HR to only one user each
        if (role === 'Admin' || role === 'HR') {
            const roleCount = await User.count({ where: { role } });
            if (roleCount >= 1) {
                await t.rollback();
                return res.status(400).json({ error: `An ${role} already exists. Only one ${role} is allowed.` });
            }
        }

        // Generate 6-digit verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Create User
        console.log('Registering user with data:', { email, role, firstName, lastName, employeeId, phone });
        const user = await User.create({
            email,
            employeeId,
            password,
            role,
            firstName,
            lastName,
            verificationCode
        }, { transaction: t });

        console.log('User created successfully:', user.id);

        // Create profile record for Employee/Teamlead (unified model)
        if (role === 'Employee' || role === 'Teamlead' || role === 'HR') {
            await Employee.create({
                userId: user.id,
                firstName,
                lastName,
                phone: phone || null
            }, { transaction: t });
            console.log('Employee profile created for:', user.id);
        }
        // Admin: stored in Users table only, no profile row needed (or can be created if needed)

        // Submit transaction
        await t.commit();

        // Send Verification Email (Asynchronously, don't block response) 
        sendVerificationCode(email, verificationCode).catch(mailError => {
            console.error('Failed to send verification email:', mailError);
        });

        res.status(201).json({
            message: 'User registered successfully. Please check your email for the 6-digit verification code.',
            email // Return email so frontend can pass it to verification page
        });
    } catch (error) {
        if (t) await t.rollback();
        console.error('Registration Error:', error);
        res.status(400).json({ error: error.message });
    }
};

const verifyCode = async (req, res) => {
    try {
        const { email, code } = req.body;
        const user = await User.findOne({ where: { email, verificationCode: code } });

        if (!user) {
            return res.status(400).json({ error: 'Invalid verification code' });
        }

        // Use User.update with individualHooks:false to avoid triggering beforeUpdate
        // which would re-hash the already-hashed password, causing login to fail
        await User.update(
            { isVerified: true, verificationCode: null },
            { where: { id: user.id }, individualHooks: false }
        );

        res.json({ message: 'Email verified successfully. You can now login.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- Forgot Password Flow ---

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ where: { email } });

        // Always return success to avoid email enumeration
        if (!user) {
            return res.json({ message: 'If that email is registered, a password reset code has been sent.' });
        }

        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        const resetExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await User.update(
            { verificationCode: resetCode, resetCodeExpiry: resetExpiry },
            { where: { id: user.id }, individualHooks: false }
        );

        sendPasswordResetCode(email, resetCode).catch(err => {
            console.error('Failed to send reset email:', err);
        });

        res.json({ message: 'If that email is registered, a password reset code has been sent.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const verifyResetCode = async (req, res) => {
    try {
        const { email, code } = req.body;
        const user = await User.findOne({ where: { email, verificationCode: code } });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired reset code.' });
        }

        // Check expiry if it exists
        if (user.resetCodeExpiry && new Date() > new Date(user.resetCodeExpiry)) {
            return res.status(400).json({ error: 'Reset code has expired. Please request a new one.' });
        }

        res.json({ message: 'Code verified. You may now reset your password.', valid: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { email, code, password } = req.body;
        const user = await User.findOne({ where: { email, verificationCode: code } });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired reset code.' });
        }

        if (user.resetCodeExpiry && new Date() > new Date(user.resetCodeExpiry)) {
            return res.status(400).json({ error: 'Reset code has expired. Please request a new one.' });
        }

        // Set new password — the beforeUpdate hook will hash it
        user.password = password;
        user.verificationCode = null;
        user.resetCodeExpiry = null;
        await user.save({ fields: ['password', 'verificationCode', 'resetCodeExpiry'] });

        res.json({ message: 'Password reset successfully. You can now login with your new password.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });

        if (!user || !(await user.validPassword(password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!user.isVerified) {
            return res.status(403).json({ error: 'Please verify your email address before logging in.' });
        }

        // --- Admin Security Enhancement ---
        if (user.role === 'Admin') {
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

            await User.update(
                { verificationCode: otpCode, resetCodeExpiry: otpExpiry },
                { where: { id: user.id }, individualHooks: false }
            );

            // Send OTP via email (reuse sendVerificationCode or similar)
            sendVerificationCode(email, otpCode).catch(mailError => {
                console.error('Failed to send Admin OTP:', mailError);
            });

            return res.status(200).json({ 
                otpRequired: true, 
                message: 'Admin OTP sent to your email.' 
            });
        }
        // -----------------------------------

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'your_super_secret_key',
            { expiresIn: '24h' }
        );

        // Fetch consolidated user data for response
        const fullUser = await User.findByPk(user.id, { include: [Employee] });

        res.json({ 
            token, 
            user: { 
                id: user.id, 
                email: user.email, 
                role: user.role,
                firstName: fullUser.firstName || fullUser.Employee?.firstName || 'N/A',
                lastName: fullUser.lastName || fullUser.Employee?.lastName || 'N/A'
            } 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const verifyAdminOTP = async (req, res) => {
    try {
        const { email, code } = req.body;
        const user = await User.findOne({ where: { email, verificationCode: code, role: 'Admin' } });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired OTP code.' });
        }

        if (user.resetCodeExpiry && new Date() > new Date(user.resetCodeExpiry)) {
            return res.status(400).json({ error: 'OTP code has expired.' });
        }

        // Clear OTP after success
        await User.update(
            { verificationCode: null, resetCodeExpiry: null },
            { where: { id: user.id }, individualHooks: false }
        );

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'your_super_secret_key',
            { expiresIn: '24h' }
        );

        // Fetch consolidated user data for response
        const fullUser = await User.findByPk(user.id, { include: [Employee] });

        res.json({ 
            token, 
            user: { 
                id: user.id, 
                email: user.email, 
                role: user.role,
                firstName: fullUser.firstName || fullUser.Employee?.firstName || 'N/A',
                lastName: fullUser.lastName || fullUser.Employee?.lastName || 'N/A'
            } 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



const switchRole = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findByPk(userId);

        if (!user) return res.status(404).json({ error: 'User not found' });

        if (user.role !== 'Employee' && user.role !== 'Teamlead' && user.role !== 'HR') {
            return res.status(400).json({ error: 'Only Employees, Team Leads, and HR can switch roles.' });
        }

        let newRole;
        if (user.role === 'HR') {
            newRole = 'Employee';
        } else {
            newRole = user.role === 'Employee' ? 'Teamlead' : 'Employee';
        }
        
        user.role = newRole;
        await user.save();

        // Generate new token with updated role
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'your_super_secret_key',
            { expiresIn: '24h' }
        );

        // Fetch consolidated user data for response
        const fullUser = await User.findByPk(user.id, { include: [Employee] });

        res.json({
            message: `Role switched to ${newRole} successfully.`,
            token,
            user: { 
                id: user.id, 
                email: user.email, 
                role: user.role,
                firstName: fullUser.firstName || fullUser.Employee?.firstName || 'N/A',
                lastName: fullUser.lastName || fullUser.Employee?.lastName || 'N/A'
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findByPk(userId, {
            attributes: { exclude: ['password', 'verificationCode', 'resetCodeExpiry'] },
            include: [{
                model: Employee,
                required: false
            }]
        });

        if (!user) return res.status(404).json({ error: 'User not found' });

        // Consolidate data: prefer Employee table for names if role is Employee/Teamlead
        // but fallback to User table if available (e.g. for Admin/HR)
        const profileData = {
            id: user.id,
            email: user.email,
            role: user.role,
            firstName: user.firstName || user.Employee?.firstName || 'N/A',
            lastName: user.lastName || user.Employee?.lastName || 'N/A',
            phone: user.Employee?.phone || 'N/A',
            profileImage: user.Employee?.profileImage || null,
            employeeId: user.employeeId || 'N/A',
            isVerified: user.isVerified,
            createdAt: user.createdAt
        };

        res.json(profileData);
    } catch (error) {
        console.error('getProfile Error:', error);
        res.status(500).json({ error: error.message });
    }
};

const updateProfile = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const userId = req.user.id;
        const { firstName, lastName, phone, profileImage } = req.body;

        if (!firstName || !lastName) {
            await t.rollback();
            return res.status(400).json({ error: 'First Name and Last Name are required' });
        }

        // Update User table
        await User.update(
            { firstName, lastName },
            { where: { id: userId }, transaction: t }
        );

        // Update Employee table if it exists
        const user = await User.findByPk(userId, { transaction: t });
        if (user.role === 'Employee' || user.role === 'Teamlead' || user.role === 'HR') {
            const [employee, created] = await Employee.findOrCreate({
                where: { userId },
                defaults: { firstName, lastName, phone, profileImage },
                transaction: t
            });

            if (!created) {
                await employee.update({ firstName, lastName, phone, profileImage }, { transaction: t });
            }
        }

        await t.commit();

        // Fetch consolidated updated profile
        const updatedUser = await User.findByPk(userId, {
            attributes: { exclude: ['password', 'verificationCode', 'resetCodeExpiry'] },
            include: [{ model: Employee, required: false }]
        });

        const profileData = {
            id: updatedUser.id,
            email: updatedUser.email,
            role: updatedUser.role,
            firstName: updatedUser.firstName || updatedUser.Employee?.firstName || 'N/A',
            lastName: updatedUser.lastName || updatedUser.Employee?.lastName || 'N/A',
            phone: updatedUser.Employee?.phone || 'N/A',
            profileImage: updatedUser.Employee?.profileImage || null,
            employeeId: updatedUser.employeeId || 'N/A'
        };

        res.json({ message: 'Profile updated successfully', user: profileData });
    } catch (error) {
        if (t) await t.rollback();
        console.error('updateProfile Error:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { register, login, verifyCode, forgotPassword, verifyResetCode, resetPassword, switchRole, getProfile, verifyAdminOTP, updateProfile };
