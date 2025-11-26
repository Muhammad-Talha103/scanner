"use client";

import i18next from "i18next";
import en from "../../public/locales/en/common.json";
import de from "../../public/locales/de/common.json";

i18next.init({
  resources: {
    en: { translation: en },
    de: { translation: de },
  },
  lng: "en", // default language for client init
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18next;
