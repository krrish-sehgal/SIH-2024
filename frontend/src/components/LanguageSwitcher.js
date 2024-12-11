import React from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/LanguageSwitcher.css';

const LanguageSwitcher = ({ onNext }) => {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="language-page">
      <div className="language-content">
        <h1>{t('languageSwitcher.title')}</h1>
        <p>{t('languageSwitcher.description')}</p>
        
        <div className="language-switcher">
          <button 
            className={`language-button ${i18n.language === 'en' ? 'active' : ''}`}
            onClick={() => changeLanguage('en')}
          >
            <span className="lang-label">English</span>
            <span className="lang-native">English</span>
          </button>
          
          <button 
            className={`language-button ${i18n.language === 'hi' ? 'active' : ''}`}
            onClick={() => changeLanguage('hi')}
          >
            <span className="lang-label">Hindi</span>
            <span className="lang-native">हिंदी</span>
          </button>

          <button 
            className={`language-button ${i18n.language === 'kn' ? 'active' : ''}`}
            onClick={() => changeLanguage('kn')}
          >
            <span className="lang-label">Kannada</span>
            <span className="lang-native">ಕನ್ನಡ</span>
          </button>
        </div>

        <button className="next-button" onClick={onNext}>
          {t('languageSwitcher.continue')} →
        </button>
      </div>
    </div>
  );
};

export default LanguageSwitcher;