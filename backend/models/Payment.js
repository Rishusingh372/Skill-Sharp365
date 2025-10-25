const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    course: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Course', 
        required: true 
    },
    amount: { 
        type: Number, 
        required: true 
    },
    currency: {
        type: String,
        default: 'usd'
    },
    stripePaymentId: { 
        type: String, 
        required: true 
    },
    stripeCustomerId: {
        type: String
    },
    status: { 
        type: String, 
        enum: ['pending', 'completed', 'failed', 'refunded'], 
        default: 'pending' 
    },
    paymentMethod: {
        type: String,
        enum: ['card', 'paypal', 'bank_transfer'],
        default: 'card'
    },
    receiptUrl: {
        type: String
    },
    refundReason: {
        type: String
    }
}, { 
    timestamps: true 
});

// Index for better query performance
paymentSchema.index({ user: 1, course: 1 });
paymentSchema.index({ stripePaymentId: 1 });
paymentSchema.index({ status: 1 });

// Virtual for formatted amount
paymentSchema.virtual('formattedAmount').get(function() {
    return `$${(this.amount / 100).toFixed(2)}`;
});

// Method to check if payment is successful
paymentSchema.methods.isSuccessful = function() {
    return this.status === 'completed';
};

// Method to process refund
paymentSchema.methods.processRefund = function(reason) {
    this.status = 'refunded';
    this.refundReason = reason;
    return this.save();
};

module.exports = mongoose.model('Payment', paymentSchema);