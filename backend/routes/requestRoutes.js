const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const auth = require('../middleware/auth');

router.post('/', auth, requestController.createRequest);
router.get('/', auth, requestController.getRequests);
router.post('/:requestId/respond', auth, requestController.respondToRequest);
router.get('/my-requests', auth, requestController.getMyRequests);

module.exports = router; 