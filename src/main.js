import App from './App.svelte';
import log from './utils/logger';
import initDb from './db/db';
import initializeRepositories from './db/repositories-init';
import createConfigStore from './stores/config';
import createAccountStore from './stores/beatleader/account';
import createPlayerService from './services/beatleader/player';
import {enablePatches, setAutoFreeze} from 'immer';
import ErrorComponent from './components/Common/Error.svelte';
import './themes/mirror.less';
import './themes/mirror-low.less';
import './themes/ree-dark.less';
import './themes/unbounded.less';
import './themes/flylight.less';
import 'atropos/css';

let app = null;

(async () => {
	try {
		// TODO: remove level setting
		// log.setLevel(log.TRACE);
		// log.logOnly(['AccSaberService']);

		log.info('Starting up...', 'Main');

		await initDb();
		await initializeRepositories();

		// WORKAROUND for immer.js esm (see https://github.com/immerjs/immer/issues/557)
		window.process = {env: {NODE_ENV: 'production'}};

		// setup immer.js
		enablePatches();
		setAutoFreeze(false);

		// pre-warm cache && create singleton services
		await createConfigStore();
		createAccountStore();
		createPlayerService();

		log.info('Site initialized', 'Main');

		app = new App({
			target: document.body,
			props: {},
		});
	} catch (error) {
		console.error(error);

		if (
			error instanceof DOMException &&
			error.toString() === 'InvalidStateError: A mutation operation was attempted on a database that did not allow mutations.'
		)
			error = new Error('Firefox in private mode is not supported. Please run the site in normal mode.');

		if (error instanceof DOMException && error.toString() === 'QuotaExceededError: The current transaction exceeded its quota limitations.')
			error = new Error('Your device probably lacks free space for the website to operate.');

		app = new ErrorComponent({
			target: document.body,
			props: {error, withTrace: true},
		});
	}
})();

export default app;
