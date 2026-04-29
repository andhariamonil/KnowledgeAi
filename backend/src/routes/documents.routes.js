const router  = require('express').Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

const { authenticate } = require('../middleware/auth.middleware');
const {
  listDocuments,
  getDocumentById,
  uploadDocument,
  deleteDocument,
  openDocument
} = require('../controllers/documents.controller');

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) => {
    const unique = `${Date.now()}-${Math.random()}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

router.use(authenticate);

router.get('/', listDocuments);
router.get('/:id', getDocumentById);
router.post('/upload', upload.single('file'), uploadDocument);
router.delete('/:id', deleteDocument);
router.get('/:id/open', openDocument);

module.exports = router;