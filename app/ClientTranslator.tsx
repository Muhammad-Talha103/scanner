"use client";

import { useTranslation } from "react-i18next";
import React from "react";

export function withTranslation<P extends { t: any }>(
  Component: React.ComponentType<P>
) {
  return function WrappedComponent(props: Omit<P, "t">) {
    const { t, i18n } = useTranslation();

    // Read language from localStorage and apply on mount
    React.useEffect(() => {
      const savedLang = localStorage.getItem("app-language");
      if (savedLang && i18n.language !== savedLang) {
        i18n.changeLanguage(savedLang);
      }
    }, [i18n]);

    return <Component {...(props as P)} t={t} />;
  };
}
