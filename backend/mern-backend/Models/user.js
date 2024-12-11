const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    // Basic Info
    aadhaarNumber: {
        type: String,
        required: true,
        unique: true,
        length: 12
    },
    name: {
        type: String,
        required: true
    },
    dateOfBirth: {
        type: Date,
        required: true
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
        required: true
    },

    // Contact & Address
    address: {
        street: String,
        locality: String,
        district: String,
        state: String,
        pincode: {
            type: String,
            length: 6
        }
    },
    mobileNumber: {
        type: String,
        required: true
    },
    email: String,

    // Verification Fields
    otp: {
        code: String,
        expiresAt: Date
    },
    
    // Face Recognition Data
    faceData: {
        faceEmbeddings: {
            type: Buffer,  // Store binary data efficiently
            required: true
        },
        embeddingFormat: {
            type: String,
            enum: ['float32', 'float64'],
            default: 'float32'
        },
        dimensions: {
            type: Number,  // Store the size of embedding vector
            required: true
        },
        confidence: {
            type: Number,
            min: 0,
            max: 1
        },
        lastUpdated: {
            type: Date,
            default: Date.now
        }
    },

    // Additional Info
    fatherName: String,
    motherName: String,
    isVerified: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster queries
userSchema.index({ aadhaarNumber: 1 });
userSchema.index({ mobileNumber: 1 });

const User = mongoose.model('User', userSchema);
module.exports = User;
