import {readable} from 'svelte/store';
import {rewindIn} from '../utils/date';

export default readable(null, function start(set) {
	const interval = setInterval(() => {
		set(rewindIn());
	}, 1000);

	return function stop() {
		clearInterval(interval);
	};
});
