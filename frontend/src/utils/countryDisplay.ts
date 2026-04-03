import isoCountries from 'i18n-iso-countries';
import deLocale from 'i18n-iso-countries/langs/de.json';
import enLocale from 'i18n-iso-countries/langs/en.json';

isoCountries.registerLocale(enLocale);
isoCountries.registerLocale(deLocale);

/** Matches `supportedLngs` in src/i18n/i18n.ts — register more locale JSONs when adding languages. */
const APP_LANGS = new Set(['en', 'de']);

function resolveLang(i18nLanguage: string): string {
  const base = (i18nLanguage.split('-')[0] || 'en').toLowerCase();
  return APP_LANGS.has(base) ? base : 'en';
}

/**
 * Localized country label for UI. ISO codes sent to the API are unchanged.
 */
export function getLocalizedCountryName(
  isoCode: string,
  i18nLanguage: string,
  fallbackName?: string,
): string {
  const lang = resolveLang(i18nLanguage);
  const localized = isoCountries.getName(isoCode, lang);
  if (localized) return localized;
  const english = isoCountries.getName(isoCode, 'en');
  if (english) return english;
  return fallbackName ?? isoCode;
}
