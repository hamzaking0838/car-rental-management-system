const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');


router.post('/create-payment-intent', express.json(), paymentController.createPaymentIntent);


router.post('/record-payment', express.json(), paymentController.recordPayment);

module.exports = router;