const express = require('express');
const { chatWithAdvisor } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, chatWithAdvisor);

module.exports = router;
