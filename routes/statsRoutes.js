const express = require('express');
const router = express.Router();
const statController = require('../controller/statsController');

router.get('/', statController.getStats);
router.put('/', statController.updateStats);

module.exports = router;