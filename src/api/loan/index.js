const express = require('express');
const router = express.Router();
const loanInfo = require("./controller");

router.post('/send_offer', loanInfo.sendOffer);

module.exports = router;