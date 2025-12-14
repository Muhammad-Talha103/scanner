import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "../../public/locales/en/common.json";
import de from "../../public/locales/de/common.json";

i18next
  .use(LanguageDetector) // detect language from localStorage / browser
  .init({
    resources: {
      en: { translation: en },
      de: { translation: de },
    },
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"], // save selected language
    },
  });

export default i18next;
