import {DateTime} from 'luxon';
import {isString} from "./js";
import {getCurrentLocale} from '../stores/config'
import {padNumber} from './format'

export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

const getCurrentLang = () => 'en';

const BEATLEADER_TZ = 'Europe/Berlin';
const ACCSABER_TZ = 'Europe/Berlin';

export const isValidDate = d =>d instanceof Date && !isNaN(d);

export const dateFromUnix = str => {
    return new Date(parseInt(str) * 1000)
}

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

export const correctOldSsDate = ssDate => DateTime.fromJSDate(ssDate).setZone('UTC').startOf('day').setZone(BEATLEADER_TZ, {keepLocalTime: true}).toJSDate();

export const toTimezoneMidnight = (date, timezone) => DateTime.fromJSDate(date).setZone(timezone).startOf('day').toJSDate();
export const toBlMidnight = date => toTimezoneMidnight(date, BEATLEADER_TZ);
export const toAccSaberMidnight = date => toTimezoneMidnight(date, ACCSABER_TZ);
export const fromAccSaberDateString = dateStr => DateTime.fromSQL(dateStr, {zone: ACCSABER_TZ}).toJSDate();

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