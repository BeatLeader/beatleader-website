export function clickOutside(node, {callback = null, includeParent = false} = {}) {
	function onClick(event) {
		if (!callback) return;

		if (!node.contains(event.target) && (!includeParent || !node.closest('.nav-button')?.contains(event.target))) {
			callback();
		}
	}

	document.body.addEventListener('click', onClick);

	return {
		update({callback: newCallback = null, includeParent = false} = {}) {
			callback = newCallback;
		},

		destroy() {
			document.body.removeEventListener('click', onClick);
		},
	};
}
