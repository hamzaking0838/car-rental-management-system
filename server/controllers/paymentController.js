

const db = require("../config/db");
const Stripe = require("stripe");


const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(stripeSecret);


exports.createPaymentIntent = async (req, res) => {
  try {
    const { amount, booking_id } = req.body || {};
    if (!amount) {
      return res.status(400).json({ success: false, message: "Amount is required" });
    }
    
    const amountCents = Math.round(Number(amount) * 100);
    const currency = process.env.STRIPE_CURRENCY || "usd";

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency,
      metadata: {
        booking_id: booking_id || ""
      },
      automatic_payment_methods: {
        enabled: true
      }
    });

    return res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (err) {
    console.error("Error creating payment intent:", err);
    return res.status(500).json({ success: false, message: "Failed to create payment intent", error: err.message });
  }
};

exports.recordPayment = async (req, res) => {
  try {
    const { booking_id, payment_intent_id } = req.body || {};
    if (!booking_id || !payment_intent_id) {
      return res.status(400).json({ success: false, message: "booking_id and payment_intent_id are required" });
    }
  
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
    const status = paymentIntent.status;
   
    const amount = paymentIntent.amount / 100;
    // Payment methods can be an array; join them for storage.
    const paymentMethod = (paymentIntent.payment_method_types || []).join(",");
    const paymentDate = new Date();
    // Format into MySQL date/time string (YYYY-MM-DD HH:MM:SS)
    const mysqlDate = paymentDate.toISOString().slice(0, 19).replace('T', ' ');
    const insertQuery = `
      INSERT INTO payment
        (booking_id, amount, payment_date, payment_method, status, stripe_payment_intent_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;
    db.query(
      insertQuery,
      [booking_id, amount, mysqlDate, paymentMethod, status, payment_intent_id],
      (err, result) => {
        if (err) {
          console.error("Error inserting payment into DB:", err);
          return res.status(500).json({ success: false, message: "Failed to save payment details" });
        }
        return res.json({ success: true, message: "Payment recorded successfully", payment_id: result.insertId });
      }
    );
  } catch (err) {
    console.error("Error recording payment:", err);
    return res.status(500).json({ success: false, message: "Failed to record payment", error: err.message });
  }
};


exports.getAllPaymentsAdmin = (req, res) => {
  const sql = `
    SELECT 
      p.id AS payment_id,
      p.booking_id,
      p.amount,
      p.payment_date,
      p.payment_method,
      p.status,
      p.stripe_payment_intent_id,
      p.created_at,
      c.name AS customer_name,
      c.phone AS customer_phone,
      cars.name AS car_name,
      COALESCE(b.color, cars.color) AS car_color,
      b.driver_option AS driver_option
    FROM payment p
    LEFT JOIN booking b ON b.id = p.booking_id
    LEFT JOIN customer c ON c.id = b.customer_id
    LEFT JOIN cars ON cars.id = b.car_id
    ORDER BY p.id DESC
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Failed to fetch payments:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    return res.json({ success: true, payments: results });
  });
};