const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    image_path: {
        type: String,
        required: true
    },
    embedding: {
        type: [Number],
        required: true
    },
    name: {
        type: String,
        required: true
    },
    aadhaarNumber: {
        type: Number,
        required: true,
        unique: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    otp: {
        type: Number
    },
    dob: {
        type: String,
        required: true
    },
    address: {
        street: String,
        locality: String,
        district: String,
        state: String
    },
    pincode: {
        type: Number,
        required: true
    },
    mobile: {
        type: Number,
        required: true
    }
});

// Index for faster queries
userSchema.index({ aadhaarNumber: 1 });

const User = mongoose.model('User', userSchema);
module.exports = User;
