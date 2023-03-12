export function playersTitle(tag, count) {
	switch (tag) {
		case 'DUH':
			return 'prayer' + (count ? 's' : '');
		case 'JML':
			return 'jamal' + (count ? 's' : '');
		case 'OOTK':
			return 'varma' + (count ? 'a' : '');

		default:
			return 'player' + (count ? 's' : '');
	}
}

export function rankLabel(tag) {
	switch (tag) {
		case 'JML':
			return 'Jamal';
		case 'OOTK':
			return 'Ootko Ränkki';

		default:
			return 'Average Rank';
	}
}

export function accLabel(tag) {
	switch (tag) {
		case 'JML':
			return 'Jamal';
		case 'OOTK':
			return 'Ootko Äcc';

		default:
			return 'Average Acc';
	}
}

export function ppLabel(tag) {
	switch (tag) {
		case 'JML':
			return 'Jamal';
		case 'OOTK':
			return 'Ootko';

		default:
			return 'Total PP';
	}
}

export function capturesLabel(tag) {
	switch (tag) {
		default:
			return 'Maps Captured';
	}
}

export function rankedPoolPercentLabel(tag) {
	switch (tag) {
		default:
			return 'Ranked % Captured';
	}
}

export function ppIcon(tag) {
	switch (tag) {
		case 'OOTK':
			return 'coolpepe-icon';

		default:
			return null;
	}
}

const clansChangingValues = ['WYSI'];

export function changingValuesClan(clans) {
	return clans.find(element => clansChangingValues.includes(element.tag))?.tag;
}

export function rankValue(tag, value) {
	switch (tag) {
		case 'WYSI':
			return 727;

		default:
			return value;
	}
}

export function accValue(tag, value) {
	switch (tag) {
		case 'WYSI':
			return 96.41;

		default:
			return value;
	}
}

export function ppValue(tag, value) {
	switch (tag) {
		case 'WYSI':
			return 727;

		default:
			return value;
	}
}

export function capturesValue(tag, value) {
	switch (tag) {
		default:
			return value;
	}
}

export function rankedPoolPercentValue(tag, value) {
	switch (tag) {
		default:
			return value;
	}
}
