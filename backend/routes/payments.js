const express = require('express');
const { body, validationResult } = require('express-validator');
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

// Utility for validation
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() }); }
    next();
};

// --- Student Routes ---
router.post('/create-intent',
    auth,
    authorize(['student']),
    [ /* validation */ ],
    handleValidationErrors,
    paymentController.createPaymentIntent // Uses createPaymentIntent
);

router.post('/confirm',
    auth,
    authorize(['student']),
    [ /* validation */ ],
    handleValidationErrors,
    paymentController.confirmPayment // Uses confirmPayment
);

router.get('/history',
    auth,
    authorize(['student']),
    paymentController.getPaymentHistory // Uses getPaymentHistory
);

// --- Webhook Routes ---
router.post('/webhook/stripe',
    express.raw({ type: 'application/json' }),
    paymentController.handleStripeWebhook // Uses handleStripeWebhook
);

router.post('/webhook/paystack',
    paymentController.handlePaystackWebhook // Uses handlePaystackWebhook
);


// --- Admin Route (Matching your original placeholder) ---
router.get('/',
    auth,
    authorize(['admin']),
    paymentController.getPayments // Uses getPayments (placeholder)
);

module.exports = router;