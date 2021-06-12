import App from './App.svelte';
import log from './utils/logger'
import initDb from './db/db'
import setupDataFixes from './db/fix-data'
import createConfigStore from './stores/config'
import beatSaviorService from './services/beatsavior'
import createRankedsStore from './stores/scoresaber/rankeds'
import initDownloadManager from './network/download-manager'
import ErrorComponent from './components/Common/Error.svelte'

import createPlayerService from './services/scoresaber/player';

let app = null;

(async() => {
  try {
    // TODO: remove level setting
    log.setLevel(log.TRACE);

    log.info('starting up...', 'Main')

    await initDb();
    await setupDataFixes();

    // pre-warm cache
    const configStore = await createConfigStore();
    const mainPlayerId = configStore.getMainPlayerId();

    await createRankedsStore();

    // TODO: move it out of here
    createPlayerService().refresh(mainPlayerId);

    // TODO: move it to download manager
    if (mainPlayerId) {
      const beatSavior = beatSaviorService();
      await beatSavior.refresh(mainPlayerId);
    }

    await initDownloadManager();

    log.info('initialized', 'Main')

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