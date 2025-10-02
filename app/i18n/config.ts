import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "../../public/locales/en/common.json";
import de from "../../public/locales/de/common.json";

// On SSR, window may be undefined
const savedLanguage = typeof window !== "undefined" ? localStorage.getItem("app-language") : null;

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    de: { translation: de },
  },
  lng: savedLanguage || "en", // use saved language if available
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
