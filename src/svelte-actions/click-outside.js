export function clickOutside(node, {callback = null, parent = null} = {}) {
	function onClick(event) {
		if (!callback) return;

		if (!node.contains(event.target) && (!parent || !node.closest(parent)?.contains(event.target))) {
			callback();
		}
	}

	document.body.addEventListener('click', onClick);

	return {
		update({callback: newCallback = null, parent: newParent = false} = {}) {
			callback = newCallback;
			parent = newParent;
		},

		destroy() {
			document.body.removeEventListener('click', onClick);
		},
	};
}
