const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

const verifyModel = async (req, res, next) => {
    try {
        const { combinedHash, digitalSignature, versions } = req.body;

        // Validate inputs
        if (!combinedHash || !digitalSignature || !versions) {
            return res.status(400).json({ 
                message: "Combined hash, digital signature, and versions are required." 
            });
        }

        // Verify versions
        const versionsFilePath = path.join(__dirname, '../../model_versions.json');
        const storedVersions = JSON.parse(await fs.readFile(versionsFilePath, 'utf8'));

        // Check if all models have matching versions
        for (const [model, version] of Object.entries(versions)) {
            if (!storedVersions[model] || storedVersions[model] !== version) {
                return res.status(400).json({
                    message: `Invalid or mismatched version for model: ${model}`,
                    expected: storedVersions[model],
                    received: version
                });
            }
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
