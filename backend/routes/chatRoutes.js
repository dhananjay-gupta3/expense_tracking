const express = require('express');
const { chatWithAdvisor } = require('../controllers/chatController');

const router = express.Router();

router.post('/', chatWithAdvisor);

module.exports = router;
