!(function () {
	let ctrlPressState = false;

	window.addEventListener('mousedown', function (e) {
		ctrlPressState = e.ctrlKey || e.metaKey;
	});

	function openInBackground(url) {
		const a = document.createElement('a');
		a.href = url;
		a.setAttribute('target', '_blank');

		let evt = new MouseEvent("click", {
			bubbles: true,
			cancelable: true,
			view: window,
			ctrlKey: true,
			metaKey: true
		  });
		a.dispatchEvent(evt);
	}

	window.addEventListener('load', () => {
		window.history.oldPushState = window.history.pushState;
		window.history.pushState = (...args) => {
			if (ctrlPressState) {
				openInBackground(args[2]);
				ctrlPressState = false;
			} else {
				window.history.oldPushState(...args);
			}
		};
	});
})();
