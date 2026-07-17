const router = require('express').Router();
const authenticate = require('../middleware/authenticate');
const {
  listNodes, myNodes, subscribedNodes, getNode,
  createNode, updateNode, deleteNode
} = require('../controllers/nodeController');

router.get('/',           authenticate, listNodes);
router.get('/mine',       authenticate, myNodes);
router.get('/subscribed', authenticate, subscribedNodes);
router.get('/:id',        authenticate, getNode);
router.post('/',          authenticate, createNode);
router.put('/:id',        authenticate, updateNode);
router.delete('/:id',     authenticate, deleteNode);

module.exports = router;
