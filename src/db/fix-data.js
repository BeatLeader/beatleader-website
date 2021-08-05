import keyValueRepository from './repository/key-value';
import createBeatMapsService from '../services/beatmaps'
import log from '../utils/logger';
import {db} from './db'
import {opt} from '../utils/js'

const FIXES_KEY = 'data-fix';

const getAppliedFixes = async () => keyValueRepository().get(FIXES_KEY, true);
const storeAppliedFixes = async fixes => keyValueRepository().set(fixes, FIXES_KEY);

const allFixes = {
  'rankeds-20210725': {
    apply: async fixName => {
      log.info('Apply rankeds refresh fix (20210725)')

      return db.runInTransaction(['rankeds-changes', 'rankeds', 'key-value'], async tx => {
        await tx.objectStore('rankeds-changes').clear();
        await tx.objectStore('rankeds').clear();

        const keyValueStore = tx.objectStore('key-value')

        keyValueStore.delete('rankedsLastUpdated');

        let allAppliedFixes = await keyValueStore.get(FIXES_KEY);
        allAppliedFixes = allAppliedFixes && Array.isArray(allAppliedFixes) ? allAppliedFixes : [];
        allAppliedFixes.push(fixName);
        await keyValueStore.put(allAppliedFixes, FIXES_KEY);
      });
    },
  },

  'beatsaver-20210804': {
    apply: async fixName => {
      log.info('Converting BeatSaver songs to a new format...', 'DBFix')

      return db.runInTransaction(['songs', 'songs-beatmaps', 'key-value'], async tx => {
        const songsBeatMapsStore = tx.objectStore('songs-beatmaps');

        let cursor = await tx.objectStore('songs').openCursor();

        let songCount = 0;

        const beatmapsService = createBeatMapsService();

        while (cursor) {
          const beatSaverSong = cursor.value;

          if (opt(beatSaverSong, 'metadata.characteristics')) {
            const beatMapsSong = beatmapsService.convertOldBeatSaverToBeatMaps(beatSaverSong);
            if (beatMapsSong) {
              songsBeatMapsStore.put(beatMapsSong)

              songCount++;
            } else {
              log.info(`Unable to convert, deleting a song`, 'DBFix', beatSaverSong);
            }
          } else {
            log.info(`No metadata characteristics, skipping a song`, 'DBFix', beatSaverSong);
          }

          cursor = await cursor.continue();
        }

        const keyValueStore = tx.objectStore('key-value')
        let allAppliedFixes = await keyValueStore.get(FIXES_KEY);
        allAppliedFixes = allAppliedFixes && Array.isArray(allAppliedFixes) ? allAppliedFixes : [];
        allAppliedFixes.push(fixName);
        await keyValueStore.put(allAppliedFixes, FIXES_KEY);

        log.info(`${songCount} BeatSaver song(s) converted`, 'DBFix')
      });
    }
  }
};

export default async () => {
  let appliedDbFixes = await getAppliedFixes();
  const appliedFixes = appliedDbFixes && Array.isArray(appliedDbFixes) ? appliedDbFixes : [];
  const neededFixes = Object.keys(allFixes).filter(f => !appliedFixes.includes(f) && (!allFixes[f].validTo || allFixes[f].validTo > new Date()));

  if (!neededFixes.length) return;

  document.body.innerHTML = '<p>Database conversion. Please wait...</p>';

  for (let key of neededFixes) {
    await allFixes[key].apply(key);
  }

  document.body.innerHTML = '';
}