const express = require('express');
const Loan = require('./loan');

const router = express.Router();
router.use('/loan', Loan);
module.exports = router;
