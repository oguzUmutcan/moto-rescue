import * as SecureStore from "expo-secure-store";
import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { auth } from "@/config/firebase";
import { userApi } from "@/api/users";
import {
  getActiveLanguage,
  Language,
  setActiveLanguage,
  translate,
} from "./i18n";

const LANGUAGE_KEY = "motorescue.language";

type LanguageContextValue = {
  ready: boolean;
  language: Language;
  setLanguage: (language: Language) => Promise<void>;
  syncAccountLanguage: (language: string | null | undefined) => Promise<void>;
  t: typeof translate;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function deviceLanguage(): Language {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase();
  return locale.startsWith("tr") ? "tr" : "en";
}

function validLanguage(value: string | null | undefined): value is Language {
  return value === "en" || value === "tr";
}

export function LanguageProvider({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(false);
  const manuallySelected = useRef(false);
  const [language, setLanguageState] = useState<Language>(() => {
    const initial = deviceLanguage();
    setActiveLanguage(initial);
    return initial;
  });

  useEffect(() => {
    SecureStore.getItemAsync(LANGUAGE_KEY)
      .then((stored) => {
        if (manuallySelected.current || !validLanguage(stored)) return;
        setActiveLanguage(stored);
        setLanguageState(stored);
      })
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, []);

  const setLanguage = useCallback(async (nextLanguage: Language) => {
    manuallySelected.current = true;
    setActiveLanguage(nextLanguage);
    setLanguageState(nextLanguage);
    await SecureStore.setItemAsync(LANGUAGE_KEY, nextLanguage).catch(() => undefined);
    if (auth.currentUser) {
      await userApi.update({ language: nextLanguage }).catch((error) => {
        console.warn("Could not save language preference to the account", error);
      });
    }
  }, []);

  const syncAccountLanguage = useCallback(async (accountLanguage: string | null | undefined) => {
    if (validLanguage(accountLanguage)) {
      setActiveLanguage(accountLanguage);
      setLanguageState(accountLanguage);
      await SecureStore.setItemAsync(LANGUAGE_KEY, accountLanguage).catch(() => undefined);
      return;
    }
    if (auth.currentUser) {
      await userApi.update({ language: getActiveLanguage() }).catch((error) => {
        console.warn("Could not save language preference to the account", error);
      });
    }
  }, []);

  const value = useMemo(
    () => ({ ready, language, setLanguage, syncAccountLanguage, t: translate }),
    [ready, language, setLanguage, syncAccountLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
