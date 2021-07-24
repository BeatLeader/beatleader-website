import App from './App.svelte';
import log from './utils/logger'
import initDb from './db/db'
import initializeRepositories from './db/repositories-init';
import setupDataFixes from './db/fix-data'
import createConfigStore from './stores/config'
import createPlayerService from './services/scoresaber/player'
import createBeatSaviorService from './services/beatsavior'
import createRankedsStore from './stores/scoresaber/rankeds'
import initDownloadManager from './network/download-manager'
import initCommandProcessor from './network/command-processor'
import ErrorComponent from './components/Common/Error.svelte'
import {PRIORITY} from './network/queues/http-queue'
import {MINUTE} from './utils/date'
import {delay} from './utils/promise'

let app = null;

(async() => {
  try {
    // TODO: remove level setting
    // log.setLevel(log.TRACE);
    // log.logOnly(['BeatSaviorService']);

    log.info('Starting up...', 'Main')

    await initDb();
    await initializeRepositories();
    await setupDataFixes();

    // pre-warm cache && create singleton services
    await createConfigStore();
    const player = createPlayerService();
    createBeatSaviorService();

    // let foo = await player.fetchPlayer('76561198035381239', PRIORITY.FG_LOW, {cacheTtl: MINUTE, maxAge: null, fullResponse: true})
    // console.log(
    //   player.isResponseCached(foo),
    //   player.getDataFromResponse(foo)
    // )
    // await delay(1000);
    // foo = await player.fetchPlayer('76561198035381239', PRIORITY.FG_LOW, {cacheTtl: MINUTE, maxAge: 1500, fullResponse: true})
    // console.log(
    //   player.isResponseCached(foo),
    //   player.getDataFromResponse(foo)
    // )
    // foo = await player.fetchPlayer('76561198035381239', PRIORITY.FG_LOW, {cacheTtl: MINUTE, maxAge: 1000, fullResponse: true})
    // console.log(
    //   player.isResponseCached(foo),
    //   player.getDataFromResponse(foo)
    // )


    throw 'xxx';

    await createRankedsStore();

    // TODO: enable it
    // initCommandProcessor(await initDownloadManager());

    log.info('Site initialized', 'Main')

    app = new App({
      target: document.body,
      props: {},
    });
  } catch(error) {
    console.error(error);

    app = new ErrorComponent({
      target: document.body,
      props: {error, withTrace: true},
    });
  }
})();


export default app;