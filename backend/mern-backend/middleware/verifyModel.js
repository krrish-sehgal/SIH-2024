const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

const verifyModel = async (req, res, next) => {
    try {
        const { combinedHash, digitalSignature } = req.body; // Expect combinedHash and signature from the frontend

        // Validate inputs
        if (!combinedHash || !digitalSignature) {
            return res.status(400).json({ 
                message: "Combined hash and digital signature are required." 
            });
        }

        const publicKeyPath = path.join(__dirname, '../digital_signature_keys/public_key.pem');
        const publicKey = await fs.readFile(publicKeyPath, 'utf8');

        const hashBuffer = Buffer.from(combinedHash, 'hex');

        const signatureBuffer = Buffer.from(digitalSignature, 'base64');

        const isSignatureValid = crypto.verify(
            'sha256', 
            hashBuffer, 
            publicKey, 
            signatureBuffer 
        );

        if (!isSignatureValid) {
            return res.status(401).json({ 
                message: "Invalid digital signature. Verification failed." 
            });
        }

        req.verifiedHash = combinedHash; 
        next();
    } catch (error) {
        console.error('Error verifying model:', error);
        res.status(500).json({ 
            message: "Error verifying model.",
            error: error.message 
        });
    }
};

module.exports = { verifyModel };
