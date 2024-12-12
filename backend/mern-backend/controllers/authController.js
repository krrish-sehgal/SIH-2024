const User = require('../Models/user');
const cookieParser = require('cookie-parser');
exports.verifyOTP = async (req, res) => {
    try {
        const { aadhaarNumber, otp } = req.body;
        
        // Find user and verify OTP
        console.log("Looking for aadhaar:", aadhaarNumber);
        console.log("With OTP:", otp);

        const user = await User.findOne({ aadhaarNumber }); // No conversion needed
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Direct number comparison
        if (!user.otp || user.otp !== otp) {
            return res.status(401).json({ message: "Invalid OTP" });
        }

        // Create session
      
        req.session.userId = user._id;
        req.session.aadhaarNumber = user.aadhaarNumber;

        res.status(200).json({ 
            message: "Login successful",
            user: {
                name: user.name,
                aadhaarNumber: user.aadhaarNumber
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Error verifying OTP", error: error.message });
    }
};

exports.fetchUserDetails = async (req, res) => {
    try {
        
        const { name, aadhaarNumber } = req.body;
        console.log("Received in body:", { name, aadhaarNumber });

        if (!name || !aadhaarNumber) {
            return res.status(401).json({ message: "Name and Aadhaar number are required" });
        }

        const user = await User.findOne({ aadhaarNumber });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            name: user.name,
            aadhaarNumber: user.aadhaarNumber,
            timestamp: user.timestamp,
            dob: user.dob,
            address: {
                street: user.address.street,
                locality: user.address.locality,
                district: user.address.district,
                state: user.address.state
            },
            pincode: user.pincode,
            mobile: user.mobile
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching user details", error: error.message });
    }
};