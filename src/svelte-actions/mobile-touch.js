export function mobileTouch(node, callback) {
	const onClick = event => {
		if (!callback) return;

		if (node.contains(event.target)) {
			event.preventDefault();

			callback();
		}
	};

	const isTouchDevice = () => 'ontouchstart' in window || navigator?.maxTouchPoints > 0 || navigator?.msMaxTouchPoints > 0;

	if (isTouchDevice()) node.addEventListener('click', onClick);

	return {
		update(newCallback) {
			callback = newCallback;
		},
		destroy() {
			if (isTouchDevice()) node.removeEventListener('click', onClick);
		},
	};
}
