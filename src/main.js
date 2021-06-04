import App from './App.svelte';
import log from './utils/logger'
import initDb from './db/db'
import setupDataFixes from './db/fix-data'
import createConfigStore from './stores/config'
import beatSaviorService from './services/beatsavior'

let app = null;

(async() => {
  log.info('starting up...')

  await initDb();
  await setupDataFixes();

  // pre-warm cache
  const configStore = await createConfigStore();
  const mainPlayerId = configStore.getMainPlayerId();

  // TODO: move it to download manager
  if (mainPlayerId) {
    const beatSavior = beatSaviorService();
    await beatSavior.refresh(mainPlayerId);
  }

  log.info('initialized')

  app = new App({
    target: document.body,
    props: {},
  });
})();


export default app;