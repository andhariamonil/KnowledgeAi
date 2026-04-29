const router = require('express').Router();
const { authenticate, isAdmin } = require('../middleware/auth.middleware');
const { listUsers, getUserById, updateUserRole, deleteUser, getUserStats } = require('../controllers/users.controller');

router.use(authenticate);

router.get('/',          isAdmin, listUsers);
router.get('/stats',     isAdmin, getUserStats);
router.get('/:id',       isAdmin, getUserById);
router.put('/:id/role',  isAdmin, updateUserRole);
router.delete('/:id',    isAdmin, deleteUser);

module.exports = router;