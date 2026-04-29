const router = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const {
  register,
  login,
  me,
  logout,
  updateProfile,
  changePassword,
  getPreferences,
  updatePreferences,
  forgotPassword,
  resetPassword,
} = require('../controllers/auth.controller');

router.post('/register',        register);
router.post('/login',           login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password',  resetPassword);
router.get( '/me',              authenticate, me);
router.post('/logout',          authenticate, logout);
router.put( '/profile',         authenticate, updateProfile);
router.put( '/password',        authenticate, changePassword);
router.get( '/preferences',     authenticate, getPreferences);
router.put( '/preferences',     authenticate, updatePreferences);

module.exports = router;