import {DateTime} from 'luxon';
import {isString} from './js';
import {getCurrentLocale} from '../stores/config';
import {padNumber} from './format';

export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;
export const WEEK = 7 * DAY;

export const DAYSECONDS = DAY / 1000;
export const WEEKSECONDS = 7 * DAYSECONDS;

const BEATLEADER_TZ = 'UTC';
const ACCSABER_TZ = 'Europe/Berlin';

export const isValidDate = d => d instanceof Date && !isNaN(d);

export const dateFromUnix = str => {
	const date = new Date(parseInt(str, 10) * 1000);

	return isValidDate(date) ? date : null;
};

export const dateFromString = str => {
	// convert SS page date format to ISO
	const matches = str && isString(str) ? str.match(/^(\d{4}-\d{1,2}-\d{1,2})\s+(\d{1,2}:\d{1,2}(:\d{1,2})?)\sUTC$/) : null;
	if (matches && matches.length >= 3) {
		str = matches[1] + 'T' + matches[2] + 'Z';
	}

	const date = str ? new Date(Date.parse(str)) : null;

	return isValidDate(date) ? date : null;
};

export const durationToMillis = duration => {
	const match = duration.match(/^\s*(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)\s*$/);
	if (!match) return null;

	return (
		(match[1] ? parseInt(match[1], 10) * 1000 * 60 * 60 : 0) +
		(match[2] ? parseInt(match[2], 10) * 1000 * 60 : 0) +
		(match[3] ? parseInt(match[3], 10) * 1000 : 0)
	);
};

export const millisToDuration = millis => {
	const hours = padNumber(Math.floor(millis / (1000 * 60 * 60)));
	millis -= hours * 1000 * 60 * 60;

	const minutes = padNumber(Math.floor(millis / (1000 * 60)));
	millis -= minutes * 1000 * 60;

	const seconds = padNumber(Math.floor(millis / 1000));

	return `${hours}h${minutes}m${seconds}s`;
};

export const addToDate = (millis, date = new Date()) => new Date(date.getTime() + millis);

export function truncateDate(date, precision = 'day') {
	const newDate = new Date(date.getTime());

	// no breaks here!
	switch (precision) {
		case 'year':
			newDate.setMonth(0);
		case 'month':
			newDate.setDate(1);
		case 'day':
			newDate.setHours(0);
		case 'hour':
			newDate.setMinutes(0);
		case 'minute':
			newDate.setSeconds(0);
		case 'second':
			newDate.setMilliseconds(0);
	}

	return newDate;
}

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
	return formatDateWithOptions(
		val,
		{
			localeMatcher: 'best fit',
			dateStyle,
			timeStyle: timeStyle ?? undefined,
		},
		locale
	);
}

export function formatDateCustomTooltip(val, dateFormat) {
	//if relative is displayed use full as the tooltip
	if (dateFormat == 'relative') {
		return formatDate(val);
	}
	//for absolute dates use the relative format
	return formatDateRelative(val);
}

export function formatDateCustom(val, dateFormat) {
	if (!isValidDate(val)) {
		return null;
	}
	if (dateFormat == 'full') {
		return formatDate(val);
	}
	if (dateFormat == 'relative') {
		return formatDateRelative(val);
	}
	if (dateFormat == 'relativeshort') {
		return formatDateRelativeShort(val);
	}

	let year = val.getFullYear();
	year = ('' + year).slice(-2);

	let month = val.getMonth();
	month = ('0' + (month + 1)).slice(-2);

	let date = val.getDate();
	date = ('0' + date).slice(-2);

	let hour = val.getHours();
	hour = ('0' + hour).slice(-2);

	let minute = val.getMinutes();
	minute = ('0' + minute).slice(-2);

	let second = val.getSeconds();
	second = ('0' + second).slice(-2);

	return dateFormat
		.replace('YYYY', val.getFullYear())
		.replace('MM', month)
		.replace('DD', date)
		.replace('HH', hour)
		.replace('mm', minute)
		.replace('ss', second)
		.replace('YY', year)
		.replace('H', hour % 12 == 0 ? 12 : hour % 12)
		.replace('AM/PM', hour < 12 ? 'AM' : 'PM')
		.replace('M', val.getMonth() + 1)
		.replace('D', val.getDate());
}

export function formatDateRelativeInUnits(val, unit = 'day', locale = getCurrentLocale()) {
	const rtf = new Intl.RelativeTimeFormat(locale, {
		localeMatcher: 'best fit',
		numeric: 'auto',
		style: 'long',
	});

	return rtf.format(val, unit);
}

export function formatDateRelativeShort(val, roundFunc = Math.round) {
	if (!isValidDate(val)) return null;

	const diffInSecs = (Date.now() - dateFromString(val)) / 1000;
	const absDiff = Math.abs(diffInSecs);

	if (absDiff < 60) return roundFunc(diffInSecs) + 's';
	else if (absDiff < 60 * 60) return roundFunc(diffInSecs / 60) + 'min';
	else if (absDiff < 60 * 60 * 24) return roundFunc(diffInSecs / (60 * 60)) + 'h';
	else if (absDiff < 60 * 60 * 24 * 30) return roundFunc(diffInSecs / (60 * 60 * 24)) + 'd';
	else if (absDiff < 60 * 60 * 24 * 365) return roundFunc(diffInSecs / (60 * 60 * 24 * 30)) + 'mon';
	else return roundFunc(diffInSecs / (60 * 60 * 24 * 365)) + 'y';
}

export function formatDateRelative(val, roundFunc = Math.floor, unit = 'auto', locale = getCurrentLocale()) {
	if (!isValidDate(val)) return null;

	const rtf = new Intl.RelativeTimeFormat(locale, {
		localeMatcher: 'best fit',
		numeric: 'auto',
		style: 'long',
	});

	const diffInSecs = (Date.now() - dateFromString(val)) / 1000;
	const absDiff = Math.abs(diffInSecs);

	switch (unit) {
		case 'auto':
			if (absDiff < 60) return rtf.format(-roundFunc(diffInSecs), 'second');
			else if (absDiff < 60 * 60) return rtf.format(-roundFunc(diffInSecs / 60), 'minute');
			else if (absDiff < 60 * 60 * 24) return rtf.format(-roundFunc(diffInSecs / (60 * 60)), 'hour');
			else if (absDiff < 60 * 60 * 24 * 30) return rtf.format(-roundFunc(diffInSecs / (60 * 60 * 24)), 'day');
			else if (absDiff < 60 * 60 * 24 * 365) return rtf.format(-roundFunc(diffInSecs / (60 * 60 * 24 * 30)), 'month');
			else return rtf.format(-roundFunc(diffInSecs / (60 * 60 * 24 * 365)), 'year');

		default:
			let unitDivider =
				unit === 'second'
					? 1
					: unit === 'minute'
					? 60
					: unit === 'hour'
					? 60 * 60
					: unit === 'day'
					? 60 * 60 * 24
					: unit === 'month'
					? 60 * 60 * 24 * 30
					: unit === 'year'
					? 60 * 60 * 24 * 365
					: null;
			if (!unitDivider) {
				unitDivider = 1;
				unit = 'second';
			}
			return rtf.format(-roundFunc(diffInSecs / unitDivider), unit);
	}
}

const freshScoreAgeMillis = 0;
const oldScoreAgeMillis = 1000 * 60 * 60 * 24 * 30 * 8; //~8 months
const freshScoreBrightness = 255;
const oldScoreBrightness = 128;

export function getTimeStringColor(timeSet) {
	if (!timeSet) return '#ffffff';
	const scoreAgeMillis = new Date().getTime() - (isValidDate(timeSet) ? timeSet : dateFromUnix(timeSet)).getTime();
	let ratio = (scoreAgeMillis - freshScoreAgeMillis) / (oldScoreAgeMillis - freshScoreAgeMillis);
	if (ratio < 0) ratio = 0;
	if (ratio > 1) ratio = 1;
	ratio = Math.pow(1 - ratio, 3);
	const brightnessInt = (oldScoreBrightness + (freshScoreBrightness - oldScoreBrightness) * ratio) | 0;
	const brightnessHex = brightnessInt.toString(16);
	return '#' + brightnessHex + brightnessHex + brightnessHex;
}

export function getCurrentBatchDate() {
	const now = DateTime.now().setZone('UTC');
	const thisWeekFriday10Utc = now.startOf('week').plus({days: 4, hour: 10});
	const currentBatchDate = now < thisWeekFriday10Utc ? thisWeekFriday10Utc : thisWeekFriday10Utc.plus({days: 7});

	return currentBatchDate.toJSDate();
}

export function rankedIn() {
	return DateTime.fromJSDate(getCurrentBatchDate()).diff(DateTime.now(), ['days', 'hours', 'minutes', 'seconds']).toObject();
}

export function rewindIn() {
	return DateTime.fromJSDate(dateFromUnix('1716062400')).diff(DateTime.now(), ['days', 'hours', 'minutes', 'seconds']).toObject();
}

export function willBeRankedInCurrentBatch(approvalTimeset) {
	if (!approvalTimeset) return false;

	const readyToRankDate = DateTime.fromJSDate(dateFromUnix(approvalTimeset)).plus({days: 7}).toJSDate();

	return readyToRankDate.getTime() < getCurrentBatchDate().getTime();
}
