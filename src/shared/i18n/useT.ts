import { useLanguageStore } from './languageStore';
import translations from './translations';

export function useT() {
  const locale = useLanguageStore((s) => s.locale);
  return translations[locale];
}
