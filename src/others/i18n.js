export const DEFAULT_LOCALE = 'en-US';

const locales = {
    'de-DE': {id: 'de-DE', name: 'Deutschland'},
    'es-ES': {id: 'es-ES', name: 'España'},
    'pl-PL': {id: 'pl-PL', name: 'Polska'},
    'en-GB': {id: 'en-GB', name: 'United Kingdom'},
    'en-US': {id: 'en-US', name: 'United States'},
};

let currentLocale = 'en-US';

export const getCurrentLocale = () => currentLocale
export const getSupportedLocales = () => Object.values(locales);
export const setCurrentLocale = locale => {
    if (locales[locale]) currentLocale = locale;
}
