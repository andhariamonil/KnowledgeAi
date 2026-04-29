const router = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const { getSessions, createSession, deleteSession, getMessages, sendMessage } = require('../controllers/chat.controller');

router.use(authenticate);

router.get('/sessions',                  getSessions);
router.post('/sessions',                 createSession);
router.delete('/sessions/:id',           deleteSession);
router.get('/sessions/:id/messages',     getMessages);
router.post('/sessions/:id/messages',    sendMessage);

module.exports = router;