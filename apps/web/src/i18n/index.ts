import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import chat from "./locales/en/chat.json";
import common from "./locales/en/common.json";
import decks from "./locales/en/decks.json";
import gate from "./locales/en/gate.json";
import home from "./locales/en/home.json";
import review from "./locales/en/review.json";

export const resources = { en: { common, gate, home, decks, review, chat } } as const;

i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  defaultNS: "common",
  interpolation: { escapeValue: false },
});

export default i18n;
