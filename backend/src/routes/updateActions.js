const router = require('express').Router();
const authenticate = require('../middleware/authenticate');
const { editUpdate, closeUpdate, reopenUpdate } = require('../controllers/updateController');

router.put('/:id',        authenticate, editUpdate);
router.patch('/:id/close',  authenticate, closeUpdate);
router.patch('/:id/reopen', authenticate, reopenUpdate);

module.exports = router;
