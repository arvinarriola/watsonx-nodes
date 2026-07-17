const router = require('express').Router();
const authenticate = require('../middleware/authenticate');
const { listUpdates, createUpdate, editUpdate, closeUpdate, reopenUpdate } = require('../controllers/updateController');

router.get('/:id/updates',        authenticate, listUpdates);
router.post('/:id/updates',       authenticate, createUpdate);

module.exports = router;
