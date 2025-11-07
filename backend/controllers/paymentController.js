const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const paystack = require('paystack')(process.env.PAYSTACK_SECRET_KEY);
const Course = require('../models/Course');
const Payment = require('../models/Payment');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const crypto = require('crypto'); // Import crypto

// @desc    Create a payment intent (Stripe or Paystack based on choice)
// @route   POST /api/payments/create-intent
// @access  Private (Student)
exports.createPaymentIntent = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
        }

        const { courseId, paymentMethod = 'stripe' } = req.body;
        const userId = req.user.userId;

        const course = await Course.findById(courseId);
        if (!course) { return res.status(404).json({ success: false, message: 'Course not found' }); }
        if (course.status !== 'published') { return res.status(400).json({ success: false, message: 'Course is not available' }); }
        if (course.price <= 0) { return res.status(400).json({ success: false, message: 'This course is free' }); }

        const existingEnrollment = await Enrollment.findOne({ student: userId, course: courseId });
        if (existingEnrollment) { return res.status(400).json({ success: false, message: 'Already enrolled' }); }

        const amount = Math.round(course.price * 100); // Amount in kobo/cents
        const currency = course.currency || 'ngn';
        
        // Define the callback URL
        const callback_url = `${process.env.CLIENT_URL}/course/${courseId}?payment=success`; // Redirect back to course page

        let paymentIntentData = {};
        let clientSecret = null;
        let paymentReference = null;

        if (paymentMethod === 'stripe') {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: currency.toLowerCase(),
                metadata: { courseId: courseId.toString(), userId: userId.toString() },
            });
            clientSecret = paymentIntent.client_secret;
            paymentReference = paymentIntent.id;
            paymentIntentData = { gateway: 'stripe', clientSecret: clientSecret, reference: paymentReference, amount: course.price, currency: currency.toUpperCase() };

        } else if (paymentMethod === 'paystack') {
            const user = await User.findById(userId).select('email');
            if (!user) { return res.status(404).json({ success: false, message: 'User not found' }); }

            const transaction = await paystack.transaction.initialize({
                email: user.email,
                amount: amount,
                currency: currency.toUpperCase(),
                callback_url: callback_url, // Pass the callback URL
                metadata: { courseId: courseId.toString(), userId: userId.toString(), custom_fields: [{ display_name: "Course", variable_name: "course_title", value: course.title }] },
            });

            if (!transaction.status || !transaction.data?.authorization_url) {
                 console.error("Paystack Initialization Error:", transaction);
                 throw new Error('Could not initialize Paystack transaction');
            }

            clientSecret = transaction.data.access_code;
            paymentReference = transaction.data.reference;
             paymentIntentData = {
                gateway: 'paystack',
                authorizationUrl: transaction.data.authorization_url,
                accessCode: clientSecret,
                reference: paymentReference,
                amount: course.price,
                currency: currency.toUpperCase()
            };

        } else {
            return res.status(400).json({ success: false, message: 'Invalid payment method specified' });
        }

        res.status(200).json({ success: true, data: paymentIntentData });

    } catch (error) {
        console.error('Create Payment Intent Error:', error);
        next(error);
    }
};


// @desc    Confirm payment manually (less reliable than webhooks)
// @route   POST /api/payments/confirm
// @access  Private (Student)
exports.confirmPayment = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) { return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() }); }

        const { paymentIntentId, courseId, paymentMethod = 'stripe', reference } = req.body;
        const userId = req.user.userId;
        let isSuccess = false;
        let paymentData = {};

        if (paymentMethod === 'stripe') {
            if (!paymentIntentId) { return res.status(400).json({ success: false, message: 'Stripe paymentIntentId is required' }); }
            const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
            isSuccess = intent.status === 'succeeded';
            paymentData = intent;
        } else if (paymentMethod === 'paystack') {
             if (!reference) { return res.status(400).json({ success: false, message: 'Paystack reference is required' }); }
             const verification = await paystack.transaction.verify({ reference: reference });
             isSuccess = verification.status && verification.data?.status === 'success';
             paymentData = verification.data;
        } else {
             return res.status(400).json({ success: false, message: 'Invalid payment method' });
        }


        if (isSuccess) {
            let enrollment = await Enrollment.findOne({ student: userId, course: courseId });
            if (!enrollment) {
                 const course = await Course.findById(courseId);
                 if(!course) { return res.status(404).json({ success: false, message: 'Course not found' }); }
                 await Payment.create({
                     student: userId,
                     course: courseId,
                     amount: course.price,
                     currency: course.currency || 'NGN',
                     paymentGateway: paymentMethod,
                     transactionId: paymentMethod === 'stripe' ? paymentIntentId : reference,
                     status: 'successful'
                 });
                 enrollment = new Enrollment({ student: userId, course: courseId, status: 'active', enrollmentType: course.price === 0 ? 'free' : 'paid' });
                 await enrollment.save();
                 course.enrollmentCount = (course.enrollmentCount || 0) + 1;
                 await course.save();
                 res.status(200).json({ success: true, message: 'Payment confirmed and enrollment successful', data: enrollment });
            } else {
                 res.status(200).json({ success: true, message: 'Payment confirmed (Enrollment already exists)', data: enrollment });
            }
        } else {
            await Payment.findOneAndUpdate(
                 { transactionId: paymentMethod === 'stripe' ? paymentIntentId : reference, student: userId },
                 { status: 'failed' }
            );
            res.status(400).json({ success: false, message: 'Payment not successful or pending', data: paymentData });
        }
    } catch (error) {
        console.error('Confirm Payment Error:', error);
        next(error);
    }
};


// @desc    Get payment history for the current student
// @route   GET /api/payments/history
// @access  Private (Student)
exports.getPaymentHistory = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const studentId = req.user.userId;
        const filter = { student: studentId };
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        const payments = await Payment.find(filter).populate('course', 'title slug thumbnail').sort({ createdAt: -1 }).skip(skip).limit(limitNum);
        const total = await Payment.countDocuments(filter);
        res.status(200).json({ success: true, data: payments, pagination: { currentPage: pageNum, totalPages: Math.ceil(total / limitNum), total } });
    } catch (error) {
        console.error('Get Payment History Error:', error);
        next(error);
    }
};

// --- Webhook Handlers ---

// @desc    Handle Stripe webhook events
// @route   POST /api/payments/webhook/stripe
exports.handleStripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;
    try {
        // Use req.body (raw buffer) for signature verification
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.error(`❌ Stripe webhook signature verification failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    // Handle the event
    const paymentIntent = event.data.object;
    switch (event.type) {
        case 'payment_intent.succeeded':
            console.log('💰 Stripe PaymentIntent was successful!', paymentIntent.id);
            await fulfillOrder(paymentIntent.metadata.userId, paymentIntent.metadata.courseId, 'stripe', paymentIntent.id, paymentIntent.amount / 100, paymentIntent.currency);
            break;
        case 'payment_intent.payment_failed':
            console.log('❌ Stripe PaymentIntent failed:', paymentIntent.id);
            await updatePaymentStatus(paymentIntent.metadata.userId, 'stripe', paymentIntent.id, 'failed');
            break;
        default:
            console.log(`Unhandled Stripe event type ${event.type}`);
    }
    res.status(200).json({ received: true });
};

// @desc    Handle Paystack webhook events
// @route   POST /api/payments/webhook/paystack
// @access  Public (Verified by Paystack signature)
exports.handlePaystackWebhook = async (req, res) => {
    
    // --- 1. VERIFY SIGNATURE (using raw body) ---
    // We can keep this commented out for local-only testing (like with Postman)
    // but it's required for live use with ngrok or deployment.
    
    // const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    //                    .update(req.body) // req.body is now a raw Buffer
    //                    .digest('hex');
                       
    // if (hash !== req.headers['x-paystack-signature']) {
    //     console.error('❌ Paystack webhook signature verification failed.');
    //     return res.sendStatus(400); // 400 Bad Request
    // }
    console.log('--- WARNING: Paystack signature check is DISABLED for local testing ---');
    // --------------------------------------------------

    // --- 2. PARSE THE BODY (from raw Buffer to JSON) ---
    let eventData;
    try {
        // req.body is a Buffer, convert it to string, then parse as JSON
        eventData = JSON.parse(req.body.toString());
    } catch (e) {
        console.error('Error parsing Paystack webhook body:', e);
        return res.sendStatus(400); // Bad request, invalid JSON
    }
    // ---------------------------------------------
    
    console.log('✅ Paystack Webhook Received & Parsed:', eventData.event);
    
    // --- 3. HANDLE THE EVENT ---
    switch (eventData.event) {
        case 'charge.success':
            const chargeData = eventData.data;
            console.log('💰 Paystack Charge was successful!', chargeData.reference);
            // Fulfill the purchase using metadata
            if (chargeData.metadata && chargeData.metadata.userId && chargeData.metadata.courseId) {
                 await fulfillOrder(chargeData.metadata.userId, chargeData.metadata.courseId, 'paystack', chargeData.reference, chargeData.amount / 100, chargeData.currency);
            } else { console.error("Paystack metadata missing userId or courseId", chargeData.reference); }
            break;
        case 'charge.failed':
            const failedCharge = eventData.data;
            if (failedCharge.metadata && failedCharge.metadata.userId) {
                await updatePaymentStatus(failedCharge.metadata.userId, 'paystack', failedCharge.reference, 'failed');
            }
            break;
        default:
            console.log(`Unhandled Paystack event type ${eventData.event}`);
    }
    res.sendStatus(200); // Send 200 OK to Paystack
};


// --- Helper Functions for Webhooks ---
async function fulfillOrder(userId, courseId, gateway, transactionId, amount, currency) {
    try {
        let enrollment = await Enrollment.findOne({ student: userId, course: courseId });
        if (enrollment) {
            console.log(`Webhook: Enrollment already exists for user ${userId}, course ${courseId}.`);
            await Payment.findOneAndUpdate({ student: userId, course: courseId, transactionId: transactionId, status: 'pending' }, { status: 'successful' });
            return;
        }
        await Payment.findOneAndUpdate(
             { student: userId, course: courseId, transactionId: transactionId },
             { student: userId, course: courseId, amount: amount, currency: currency.toUpperCase(), paymentGateway: gateway, transactionId: transactionId, status: 'successful' },
             { upsert: true, new: true, runValidators: true }
        );
        console.log(`Webhook: Payment record created/updated for user ${userId}, course ${courseId}, txn ${transactionId}`);
        enrollment = new Enrollment({ student: userId, course: courseId, status: 'active', enrollmentType: amount > 0 ? 'paid' : 'free' });
        await enrollment.save();
        console.log(`Webhook: Enrollment record created for user ${userId}, course ${courseId}`);
        const course = await Course.findById(courseId);
        if (course) { course.enrollmentCount = (course.enrollmentCount || 0) + 1; await course.save(); console.log(`Webhook: Course enrollment count updated for ${courseId}`); }
    } catch (error) {
         if (error.code === 11000) { console.warn(`Webhook: Attempted to create duplicate enrollment/payment for user ${userId}, course ${courseId}.`); }
         else { console.error(`Webhook fulfillOrder Error for txn ${transactionId}:`, error); }
    }
}

async function updatePaymentStatus(userId, gateway, transactionId, status) {
     try {
          await Payment.findOneAndUpdate( { student: userId, paymentGateway: gateway, transactionId: transactionId }, { status: status } );
          console.log(`Webhook: Payment status updated to '${status}' for user ${userId}, txn ${transactionId}`);
     } catch (error) { console.error(`Webhook updatePaymentStatus Error for txn ${transactionId}:`, error); }
}

// Placeholder for getPayments
exports.getPayments = async (req, res, next) => {
     if(!req.user || req.user.role !== 'admin') { return res.status(403).json({ success: false, message: 'Access Denied'}); }
     res.status(501).json({ success: false, message: 'Get All Payments (Admin) not implemented yet' });
};