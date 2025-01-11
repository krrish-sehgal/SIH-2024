import React from 'react'
import { useTranslation } from 'react-i18next'
import "../styles/FaceDetection.css"
import "../styles/NoFaceDetected.css"

const NoFaceDetected = (props) => {
    const { t } = useTranslation();

    const handleRetry = () => {
        props.setVerificationComplete(false);
        props.setDetectionDone(false);
    };
    
    return (
        <div className="no-face-container">
            <span>{t('faceAuth.lightingPrompt')}</span>
            <button 
                className="retry-button" 
                onClick={handleRetry}
            >
                {t('faceAuth.retry')}
            </button>
        </div>
    )
}

export default NoFaceDetected