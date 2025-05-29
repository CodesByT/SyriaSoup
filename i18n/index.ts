import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ar from "./ar.json";
import en from "./en.json";

// Define the type for translation resources
interface Resources {
  [key: string]: {
    translation: typeof en;
  };
}

const resources: Resources = {
  en: { translation: en },
  ar: { translation: ar },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false, // React Native handles escaping
  },
});

export default i18n;
