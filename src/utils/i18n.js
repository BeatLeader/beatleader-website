const i18nMap = JSON.parse(localStorage.getItem('i18nData') || '{}');

let isUpdating = false;
export const updateI18NMap = async(lang)=>{
    if (isUpdating) {
        return;
    }
    isUpdating = true;
    let data;
    for (let i = 0; i < 3; i++) {
        try {
            const res = await fetch(`/assets/i18n/${lang}.json`);
            data = await res.json();
            break;
        } catch (e) {
            console.log('Failed to fetch I18N file: ',e);
        }
    }

    if (data) {
        localStorage.setItem('i18nData', JSON.stringify(data));
        Object.assign(i18nMap, data);
    }

    isUpdating = false;
}

export const _i18n = (slug, def) => {
    if (i18nMap[slug]) {
        return i18nMap[slug].translated || def;
    } else {
        updateI18NMap(localStorage['lang'] ?? 'en')
    }
    return def;
}