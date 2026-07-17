const router = require('express').Router();
const authenticate = require('../middleware/authenticate');
const { getSubscription, subscribe, unsubscribe } = require('../controllers/subscriptionController');

router.get('/:id/subscription', authenticate, getSubscription);
router.post('/:id/subscribe',   authenticate, subscribe);
router.delete('/:id/subscribe', authenticate, unsubscribe);

module.exports = router;
