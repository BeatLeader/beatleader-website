import {isString} from "./js";

export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

// TODO: temporarily
const getCurrentLang = () => 'en';
const getCurrentLocale = () => 'pl-PL';

export const isValidDate = d =>d instanceof Date && !isNaN(d);

export const dateFromString = str => {
    // convert SS page date format to ISO
    const matches = str && isString(str) ? str.match(/^(\d{4}-\d{1,2}-\d{1,2})\s+(\d{1,2}:\d{1,2}(:\d{1,2})?)\sUTC$/) : null;
    if (matches && matches.length >= 3) {
        str = matches[1] + 'T' + matches[2] + 'Z';
    }

    const date = str ? new Date(Date.parse(str)) : null;

    return isValidDate(date) ? date : null;
}

export const addToDate = (millis, date = new Date()) => new Date(date.getTime() + millis)
export const daysAgo = days => addToDate(- days * DAY);

export function formatDate(val, dateStyle = 'short', timeStyle = 'medium') {
    if (!isValidDate(val)) return null;

    const rtf = new Intl.DateTimeFormat(getCurrentLocale(), {
        localeMatcher: 'best fit',
        dateStyle,
        timeStyle,
    });

    return rtf.format(val);
}

export function formatDateRelativeInUnits(val, unit = 'day') {
    if (!isValidDate(val)) return null;

    const rtf = new Intl.RelativeTimeFormat(getCurrentLang(), {
        localeMatcher: 'best fit',
        numeric: 'auto',
        style: 'long'
    });

    return rtf.format(val, 'day');
}

export function formatDateRelative(val, roundFunc = Math.round, unit = 'auto') {
    if (!isValidDate(val)) return null;

    const rtf = new Intl.RelativeTimeFormat(getCurrentLang(), {
        localeMatcher: 'best fit',
        numeric: 'auto',
        style: 'long'
    });

    const diffInSecs = (Date.now() - dateFromString(val)) / 1000;

    switch(unit) {
        case 'auto':
            if (diffInSecs < 60)
                return rtf.format(-roundFunc(diffInSecs), 'second');
            else if (diffInSecs < 60 * 60)
                return rtf.format(-roundFunc(diffInSecs / 60), 'minute');
            else if (diffInSecs < 60 * 60 * 24)
                return rtf.format(-roundFunc(diffInSecs / (60 * 60)), 'hour');
            else if (diffInSecs < 60 * 60 * 24 * 30)
                return rtf.format(-roundFunc(diffInSecs / (60 * 60 * 24)), 'day');
            else if (diffInSecs < 60 * 60 * 24 * 365)
                return rtf.format(
                  -roundFunc(diffInSecs / (60 * 60 * 24 * 30)),
                  'month'
                );
            else
                return rtf.format(
                  -roundFunc(diffInSecs / (60 * 60 * 24 * 365)),
                  'year'
                );

        default:
            let unitDivider =
              unit === 'second' ? 1 : (
                unit === 'minute' ? 60 : (
                  unit === 'hour' ? 60 * 60 : (
                    unit === 'day' ? 60 * 60 * 24 : (
                      unit === 'month' ? 60 * 60 * 24 * 30 : (
                        unit === 'year' ? 60 * 60 * 24 * 365 : null
                      )
                    )
                  )
                )
              );
            if (!unitDivider) {
                unitDivider = 1;
                unit = 'second';
            }
            return rtf.format(-roundFunc(diffInSecs / unitDivider), unit);
    }
}