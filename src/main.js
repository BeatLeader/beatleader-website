import App from './App.svelte';
import log from './utils/logger'
import initDb from './db/db'
import setupDataFixes from './db/fix-data'
import createConfigStore from './stores/config'
import beatSaviorService from './services/beatsavior'
import createRankedsStore from './stores/scoresaber/rankeds'
import ErrorComponent from './components/Common/Error.svelte'

let app = null;

(async() => {
  try {
    log.info('starting up...', 'Main')

    await initDb();
    await setupDataFixes();

    // pre-warm cache
    const configStore = await createConfigStore();
    const mainPlayerId = configStore.getMainPlayerId();

    const rankedsStore = await createRankedsStore();

    // TODO: move it to download manager
    await rankedsStore.refresh();

    // TODO: move it to download manager
    if (mainPlayerId) {
      const beatSavior = beatSaviorService();
      await beatSavior.refresh(mainPlayerId);
    }

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