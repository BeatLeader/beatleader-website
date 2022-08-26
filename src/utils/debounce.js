export const debounce = (callback, wait) => {
	let timeout;
	return function (...args) {
		const context = this;
		clearTimeout(timeout);
		timeout = setTimeout(() => callback.apply(context, args), wait);
	};
};

export const throttle = (callback, wait) => {
	let timeout;
	let lastFired;
	return function (...args) {
		const context = this;
		if (!lastFired) {
			callback.apply(context, args);
			lastFired = Date.now();
		} else {
			clearTimeout(timeout);
			timeout = setTimeout(() => {
				if (Date.now() - lastFired >= wait) {
					callback.apply(context, args);
					lastFired = Date.now();
				}
			}, wait - (Date.now() - lastFired));
		}
	};
};
