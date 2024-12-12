import React from 'react'
import { useTranslation } from 'react-i18next'
import "../styles/FaceDetection.css"
import "../styles/NoFaceDetected.css"

const NoFaceDetected = ({ setVerificationComplete, setDetectionDone, failureType }) => {
    const { t } = useTranslation();

    const handleRetry = () => {
        setVerificationComplete(false);
        setDetectionDone(false);
    };

    const getFailureMessage = () => {
        switch (failureType) {
            case 'liveness':
                return t("faceAuth.status.livenessCheckFailed");
            case 'verification':
                return t("faceAuth.status.authFailed");
            default:
                return t("faceAuth.status.authFailed");
        }
    };
    
    return (
        <div className="no-face-container">
            <div className="verification-box">
                <div className="left-section">
                    <h2 className="error-heading">{getFailureMessage()}</h2>
                    <p>{t('faceAuth.lightingPrompt')}</p>
                    <button 
                        className="retry-button" 
                        onClick={handleRetry}
                    >
                        {t('faceAuth.retry')}
                    </button>
                </div>
                <div className="right-section">
                    <h3>{t('faceAuth.guidelines.title')}</h3>
                    <ul className="guidelines">
                        {failureType === 'liveness' ? (
                            <>
                                <li>{t('faceAuth.guidelines.liveness1')}</li>
                                <li>{t('faceAuth.guidelines.liveness2')}</li>
                            </>
                        ) : null}
                        <li>{t('faceAuth.guidelines.lighting')}</li>
                        <li>{t('faceAuth.guidelines.coverings')}</li>
                        <li>{t('faceAuth.guidelines.camera')}</li>
                        <li>{t('faceAuth.guidelines.distance')}</li>
                        <li>{t('faceAuth.guidelines.visibility')}</li>
                        <li>{t('faceAuth.guidelines.connection')}</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}

export default NoFaceDetected