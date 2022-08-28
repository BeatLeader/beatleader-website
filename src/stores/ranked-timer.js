import {readable} from 'svelte/store';
import {rankedIn} from '../utils/date';

export default readable(null, function start(set) {
	const interval = setInterval(() => {
		set(rankedIn());
	}, 1000);

	return function stop() {
		clearInterval(interval);
	};
});
