/**
 * Resident Routes
 * Handles all resident-related API endpoints
 */

const express = require('express')
const ResidentController = require('../controllers/residentController')
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware')
const { generalLimiter } = require('../config/rateLimit')

const router = express.Router()

// Apply rate limiting to all resident routes
router.use(generalLimiter)

// All resident routes require authentication
router.use(authenticateToken)

// GET /api/residents - Get all residents (with pagination and search)
router.get('/', ResidentController.getAll)

// GET /api/residents/stats - Get resident statistics (admin only)
router.get('/stats', requireAdmin, ResidentController.getStats)

// GET /api/residents/:id - Get resident by ID
router.get('/:id', ResidentController.getById)

// POST /api/residents - Create new resident (admin only)
router.post('/', requireAdmin, ResidentController.create)

// PUT /api/residents/:id - Update resident (admin only)
router.put('/:id', requireAdmin, ResidentController.update)

// DELETE /api/residents/:id - Delete resident (admin only)
router.delete('/:id', requireAdmin, ResidentController.delete)

module.exports = router
