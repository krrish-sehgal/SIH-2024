const User = require('../Models/user');

exports.verifyOTP = async (req, res) => {
    try {
        const { aadhaarNumber, otp } = req.body;

        // Find user and verify OTP
        const user = await User.findOne({ aadhaarNumber });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if OTP exists and matches
        if (!user.otp || !user.otp.code || user.otp.code !== otp) {
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
