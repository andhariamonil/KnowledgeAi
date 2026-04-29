const router = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const { getDashboard } = require('../controllers/stats.controller');

router.use(authenticate);
router.get('/dashboard', getDashboard);

module.exports = router;