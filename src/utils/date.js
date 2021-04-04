import {isString} from "./js";

export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

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
