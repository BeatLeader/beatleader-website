import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import {isString} from "./js";
import {getCurrentLocale} from '../stores/config'
import {padNumber} from './format'

export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

const getCurrentLang = () => 'en';

const ACCSABER_TZ = 'Europe/Berlin';

dayjs.extend(utc);
dayjs.extend(timezone);

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

export const durationToMillis = duration => {
    const match = duration.match(/^\s*(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)\s*$/);
    if (!match) return null;

    return (match[1] ? parseInt(match[1], 10) * 1000 * 60 * 60 : 0) +
      (match[2] ? parseInt(match[2], 10) * 1000 * 60 : 0) +
      (match[3] ? parseInt(match[3], 10) * 1000 : 0);
}

export const millisToDuration = millis => {
    const hours = padNumber(Math.floor(millis / (1000 * 60 * 60)));
    millis -= hours * 1000 * 60 * 60;

    const minutes = padNumber(Math.floor(millis  / (1000 * 60)));
    millis -= minutes * 1000 * 60;

    const seconds = padNumber(Math.floor(millis / 1000));

    return `${hours}h${minutes}m${seconds}s`;
}

export const addToDate = (millis, date = new Date()) => new Date(date.getTime() + millis)
export const daysAgo = days => addToDate(- days * DAY);

export function truncateDate(date, precision = 'day') {
    const newDate = new Date(date.getTime());

    // no breaks here!
    switch(precision) {
        case 'year': newDate.setMonth(0);
        case 'month': newDate.setDate(1);
        case 'day': newDate.setHours(0);
        case 'hour': newDate.setMinutes(0);
        case 'minute': newDate.setSeconds(0);
        case 'second': newDate.setMilliseconds(0);
    }

    return newDate;
}

export function toSSDate(date) {
    return new Date(Date.parse(date.toLocaleString('pl-PL', { timeZone: 'Australia/Brisbane',hour12: false,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    }).replace(/(\d+)\.(\d+)\.(\d+)\s*(?:,|o)\s(\d+):(\d+):(\d+)/, "$3-$2-$1")));
}

export function dateFromAccSaberDateString(dateStr) {
    return dayjs.tz(dateStr, ACCSABER_TZ).toDate();
}

export function toAccSaberMidnight(date = new Date()) {
    return dayjs(date).tz(ACCSABER_TZ).hour(0).minute(0).second(0).millisecond(0).toDate();
}

export function formatDateWithOptions(val, options = {localeMatcher: 'best fit'}, locale = getCurrentLocale()) {
    if (!isValidDate(val)) return null;

    const rtf = new Intl.DateTimeFormat(locale, options);

    return rtf.format(val);
}

export function formatDate(val, dateStyle = 'short', timeStyle = 'medium', locale = getCurrentLocale()) {
    return formatDateWithOptions(val, {
        localeMatcher: 'best fit',
        dateStyle,
        timeStyle: timeStyle ?? undefined,
    }, locale);
}

export function formatDateRelativeInUnits(val, unit = 'day') {
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