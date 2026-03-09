const express = require('express');
const router = express.Router();
const { register, login, verifyCode, forgotPassword, verifyResetCode, resetPassword, switchRole, getProfile, verifyAdminOTP, updateProfile } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/verify-code', verifyCode);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-code', verifyResetCode);
router.post('/reset-password', resetPassword);
router.post('/verify-admin-otp', verifyAdminOTP);
router.post('/switch-role', authenticateToken, switchRole);
router.get('/profile', authenticateToken, getProfile);
router.put('/update-profile', authenticateToken, updateProfile);

module.exports = router;
