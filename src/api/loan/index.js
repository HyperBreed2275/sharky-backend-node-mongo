const express = require('express');
const router = express.Router();
const loanInfo = require("./controller");

router.post('/send_offer', loanInfo.sendOffer);
router.get('/get_loans', loanInfo.getLoans);
router.post('/get_back_offer', loanInfo.getBackOffer);

module.exports = router;