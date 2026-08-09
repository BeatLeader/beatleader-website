let returnTarget = null; // {originUrl, playerId}

export const isViewTransitionAvailable = () =>
	!!document.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const rememberReturnTarget = playerId => {
	returnTarget = {originUrl: location.pathname + location.search, playerId};
};

export const getReturningPlayerId = () => returnTarget?.playerId ?? null;

const clearReturnTarget = () => (returnTarget = null);

const waitForElement = (selector, timeout = 600) =>
	new Promise(resolve => {
		const started = performance.now();
		const check = () => {
			if (document.querySelector(selector) || performance.now() - started > timeout) {
				resolve();
			} else {
				setTimeout(check, 16);
			}
		};
		check();
	});

export const initReturnMorph = () => {
	window.addEventListener('popstate', () => {
		if (!returnTarget || !isViewTransitionAvailable()) return;

		if (location.pathname + location.search !== returnTarget.originUrl) return;

		const {playerId} = returnTarget;
		const transition = document.startViewTransition(async () => {
			await waitForElement(`.player-card[data-player-id="${playerId}"]`);
			await new Promise(resolve => setTimeout(resolve, 0));
		});

		transition.finished.finally(clearReturnTarget);
	});
};
