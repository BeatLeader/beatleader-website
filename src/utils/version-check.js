import buildInfo from '../../build-info';

const VERSION_URL = '/version.json';
const CHECK_THROTTLE = 60 * 1000;
const CHECK_INTERVAL = 10 * 60 * 1000;
const RELOAD_GUARD_KEY = 'versionReloadAt';
const RELOAD_GUARD_TIME = 30 * 1000;

let updateAvailable = false;
let lastCheck = 0;
let pendingCheck = null;

export function checkForUpdate(force = false) {
	if (updateAvailable) return Promise.resolve(true);
	if (pendingCheck) return pendingCheck;
	if (!force && Date.now() - lastCheck < CHECK_THROTTLE) return Promise.resolve(false);

	lastCheck = Date.now();
	pendingCheck = fetch(`${VERSION_URL}?t=${lastCheck}`, {cache: 'no-store'})
		.then(response => (response.ok ? response.json() : null))
		.then(info => {
			if (info?.buildTimestamp && info.buildTimestamp !== buildInfo.buildTimestamp) updateAvailable = true;
			return updateAvailable;
		})
		.catch(() => false)
		.finally(() => (pendingCheck = null));

	return pendingCheck;
}

// Chrome, Firefox and Safari messages for a failed import()
const isChunkLoadError = error => /dynamically imported module|Importing a module script failed/i.test(error?.message ?? '');

function reloadOnce() {
	try {
		const lastReload = Number(sessionStorage.getItem(RELOAD_GUARD_KEY)) || 0;
		if (Date.now() - lastReload < RELOAD_GUARD_TIME) return false;
		sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
	} catch (e) {
		return false;
	}

	location.reload();
	return true;
}

export async function recoverFromChunkError(error) {
	if (isChunkLoadError(error) && (await checkForUpdate(true)) && reloadOnce()) {
		// Render nothing while the page reloads into the new version
		return new Promise(() => {});
	}

	throw error;
}

export const withChunkRecovery = loaders =>
	Object.fromEntries(Object.entries(loaders).map(([name, load]) => [name, () => load().catch(recoverFromChunkError)]));

export function initVersionCheck() {
	const pushState = history.pushState;
	history.pushState = function (state, title, url) {
		if (updateAvailable && url != null) {
			location.assign(url);
			return;
		}

		checkForUpdate();
		return pushState.apply(this, arguments);
	};

	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'visible') checkForUpdate();
	});
	setInterval(() => {
		if (document.visibilityState === 'visible') checkForUpdate();
	}, CHECK_INTERVAL);
	window.addEventListener('unhandledrejection', event => {
		if (isChunkLoadError(event.reason)) checkForUpdate(true);
	});
}
