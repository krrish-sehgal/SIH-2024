const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

const verifyModel = async (req, res, next) => {
    try {
        const { modelHash, digitalSignature, modelData } = req.body;
        
        if (!modelHash || !digitalSignature || !modelData) {
            return res.status(400).json({ 
                message: "Model hash, digital signature and model data are required" 
            });
        }

        // Read public key
        const publicKeyPath = path.join(__dirname, '../digital_signature_keys/public_key.pem');
        const publicKey = await fs.readFile(publicKeyPath, 'utf8');

        // Verify digital signature
        const verifier = crypto.createVerify('SHA256');
        verifier.update(modelHash);
        const isSignatureValid = verifier.verify(publicKey, digitalSignature, 'base64');

        if (!isSignatureValid) {
            return res.status(401).json({ 
                message: "Invalid digital signature" 
            });
        }

        // Compute and verify SHA hash
        const computedHash = crypto
            .createHash('sha256')
            .update(JSON.stringify(modelData))
            .digest('hex');

        if (computedHash !== modelHash) {
            return res.status(401).json({ 
                message: "Model hash verification failed" 
            });
        }

        req.verifiedModel = modelData;
        next();
    } catch (error) {
        console.error('Model verification error:', error);
        res.status(500).json({ 
            message: "Error verifying model",
            error: error.message 
        });
    }
};

module.exports = { verifyModel };