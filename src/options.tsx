import React from 'react';
import ReactDOM from 'react-dom/client';
import OptionsApp from './options/Options.tsx';
import './index.css';
import { I18nProvider } from './i18n';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider>
      <OptionsApp />
    </I18nProvider>
  </React.StrictMode>,
);
