import {isTouchDevice} from '../../utils/is-touch';

export function mobileTouch(node, callback) {
	const onClick = event => {
		if (!callback) return;

		if (node.contains(event.target)) {
			event.preventDefault();

			callback();
		}
	};

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
