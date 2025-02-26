export const ATTEMPT_END_TYPE = {
	Clear: 1,
	Fail: 2,
	Restart: 3,
	Quit: 4,
	Practice: 5,
};

export function titleForEndType(type) {
	switch (type) {
		case ATTEMPT_END_TYPE.Clear:
			return 'Clear';
		case ATTEMPT_END_TYPE.Fail:
			return 'Fail';
		case ATTEMPT_END_TYPE.Restart:
			return 'Restart';
		case ATTEMPT_END_TYPE.Quit:
			return 'Quit';
		case ATTEMPT_END_TYPE.Practice:
			return 'Practice';
	}
}

export function endTypeForTitle(title) {
	switch (title) {
		case 'Clear':
			return ATTEMPT_END_TYPE.Clear;
		case 'Fail':
			return ATTEMPT_END_TYPE.Fail;
		case 'Restart':
			return ATTEMPT_END_TYPE.Restart;
		case 'Quit':
			return ATTEMPT_END_TYPE.Quit;
		case 'Practice':
			return ATTEMPT_END_TYPE.Practice;
	}
}

export function colorForEndType(type, opacity = 1) {
	switch (type) {
		case ATTEMPT_END_TYPE.Clear:
			return `rgba(62, 149, 205, ${opacity})`; // green
		case ATTEMPT_END_TYPE.Fail:
			return `rgba(255, 0, 0, ${opacity})`; // red
		case ATTEMPT_END_TYPE.Restart:
			return `rgba(255, 165, 0, ${opacity})`; // orange
		case ATTEMPT_END_TYPE.Quit:
			return `rgba(255, 255, 255, ${opacity})`; // white
		case ATTEMPT_END_TYPE.Practice:
			return `rgba(255, 255, 0, ${opacity})`; // yellow
		default:
			return `rgba(128, 128, 128, ${opacity})`; // default to gray if type is unknown
	}
}

export function timeToLabel(time, prefix) {
	const minutes = Math.floor(time / 60);
	const seconds = Math.floor(time % 60);
	return prefix + ' ' + minutes + ':' + seconds.toString().padStart(2, '0');
}
