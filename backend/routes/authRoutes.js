const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/auth'); // adjust path if needed
const {
  register,
  login,
  me,
  logout,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');

// Public routes
router.post('/register',        register);
router.post('/login',           login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password',  resetPassword);

// Protected routes
router.get('/me',     authenticate, me);
router.post('/logout', authenticate, logout);

module.exports = router;