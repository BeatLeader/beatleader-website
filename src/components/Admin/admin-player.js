import {dateFromUnix, formatDateRelative} from '../../utils/date';

const FRESH_ACCOUNT_DAYS = 7;

export function accountKind(id) {
	const number = Number(id);
	if (!Number.isFinite(number)) return null;
	if (number < 1e15) return {name: 'Login account', icon: 'fas fa-key', title: 'Login and password account, made in the Quest mod'};
	if (number < 7e16) return {name: 'Oculus', icon: 'fa-brands fa-meta', title: 'Oculus PC account'};
	return {name: 'Steam', icon: 'fa-brands fa-steam-symbol', title: 'Steam account'};
}

export function joinedInfo(createdAt) {
	if (!createdAt) return null;

	const date = dateFromUnix(createdAt);
	return {
		date,
		relative: formatDateRelative(date),
		fresh: Date.now() - date.getTime() < FRESH_ACCOUNT_DAYS * 24 * 60 * 60 * 1000,
	};
}
