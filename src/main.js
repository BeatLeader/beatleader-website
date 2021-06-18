import App from './App.svelte';
import log from './utils/logger'
import initDb from './db/db'
import initializeRepositories from './db/repositories-init';
import setupDataFixes from './db/fix-data'
import createConfigStore from './stores/config'
import beatSaviorService from './services/beatsavior'
import createRankedsStore from './stores/scoresaber/rankeds'
import initDownloadManager from './network/download-manager'
import ErrorComponent from './components/Common/Error.svelte'

let app = null;

(async() => {
  try {
    // TODO: remove level setting
    log.setLevel(log.TRACE);

    log.info('Starting up...', 'Main')

    await initDb();
    await initializeRepositories();
    await setupDataFixes();

    // pre-warm cache && create singleton services
    const configStore = await createConfigStore();
    const mainPlayerId = configStore.getMainPlayerId();

    await createRankedsStore();

    // TODO: move it to download manager and service
    if (mainPlayerId) {
      const beatSavior = beatSaviorService();
      await beatSavior.refresh(mainPlayerId);
    }

    await initDownloadManager();

    log.info('Site initialized', 'Main')

    app = new App({
      target: document.body,
      props: {},
    });
  } catch(error) {
    app = new ErrorComponent({
      target: document.body,
      props: {error, withTrace: true},
    });
  }
})();


export default app;