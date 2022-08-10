import App from './App.svelte';
import log from './utils/logger'
import initDb from './db/db'
import initializeRepositories from './db/repositories-init';
import initDownloadManager from './network/download-manager'
import setupDataFixes from './db/fix-data'
import createConfigStore from './stores/config'
import createAccountStore from './stores/beatleader/account'
import createPlayerService from './services/beatleader/player'
import createBeatSaviorService from './services/beatsavior'
import { enablePatches, setAutoFreeze } from 'immer'
import ErrorComponent from './components/Common/Error.svelte'

let app = null;

(async () => {
  try {
    // TODO: remove level setting
    // log.setLevel(log.TRACE);
    // log.logOnly(['AccSaberService']);

    log.info('Starting up...', 'Main')

    await initDb();
    await initializeRepositories();
    await setupDataFixes();

    // WORKAROUND for immer.js esm (see https://github.com/immerjs/immer/issues/557)
    window.process = { env: { NODE_ENV: "production" } };

    // setup immer.js
    enablePatches();
    setAutoFreeze(false);

    // pre-warm cache && create singleton services
    await createConfigStore();
    createAccountStore();
    createPlayerService();
    createBeatSaviorService();

    await initDownloadManager();

    log.info('Site initialized', 'Main')

    app = new App({
      target: document.body,
      props: {},
    });
  } catch (error) {
    console.error(error);

    if (error instanceof DOMException && error.toString() === 'InvalidStateError: A mutation operation was attempted on a database that did not allow mutations.')
      error = new Error('Firefox in private mode is not supported. Please run the site in normal mode.')

    if (error instanceof DOMException && error.toString() === 'QuotaExceededError: The current transaction exceeded its quota limitations.')
      error = new Error('Your device probably lacks free space for the website to operate.')

    app = new ErrorComponent({
      target: document.body,
      props: { error, withTrace: true },
    });
  }
})();


export default app;