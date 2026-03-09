const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const {
    getAllEmployees,
    createProject,
    getMyProjects,
    getMyInvitations,
    respondToInvitation,
    postIdea,
    getIdeas
} = require('../controllers/teamController');

// Team Lead only
router.get('/employees', authenticateToken, authorizeRole(['Teamlead', 'Admin']), getAllEmployees);
router.post('/projects', authenticateToken, authorizeRole(['Teamlead']), createProject);
router.get('/projects', authenticateToken, authorizeRole(['Teamlead']), getMyProjects);

// Employee only
router.get('/invitations', authenticateToken, authorizeRole(['Employee']), getMyInvitations);
router.patch('/invitations/:id', authenticateToken, authorizeRole(['Employee']), respondToInvitation);

// Any authenticated member (Team Lead or Employee)
router.post('/projects/:id/ideas', authenticateToken, postIdea);
router.get('/projects/:id/ideas', authenticateToken, getIdeas);

module.exports = router;
