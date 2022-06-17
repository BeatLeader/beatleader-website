import keyValueRepository from './repository/key-value';
import createBeatMapsService from '../services/beatmaps'
import log from '../utils/logger';
import {db} from './db'
import {isDateObject} from '../utils/js'
import twitchRepository from './repository/twitch'
import {correctOldSsDate} from '../utils/date'

const FIXES_KEY = 'data-fix';

const getAppliedFixes = async () => keyValueRepository().get(FIXES_KEY, true);
const setAppliedFixes = async fixes => keyValueRepository().set(fixes, FIXES_KEY);
const addAppliedFix = async fixName => {
  let allAppliedFixes = await getAppliedFixes();
  allAppliedFixes = allAppliedFixes && Array.isArray(allAppliedFixes) ? allAppliedFixes : [];
  allAppliedFixes.push(fixName);
  await setAppliedFixes(allAppliedFixes);
}

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

          if (beatSaverSong?.metadata?.characteristics) {
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
  },

  'twitch-20210808': {
    apply: async fixName => {
      const predefinedProfiles = {
        '76561198059659922': 'patian25',
        '1994101560659098': 'xoxobluff',
        '76561198138327464': 'altrowilddog',
        '76561198855288628': 'inbourne',
        '76561198136177445': 'riviengt',
        '76561199004224834': 'nyaanos',
        '76561198023909718': 'danielduel',
        '76561198212019365': 'fnyt',
        '76561197966674102': 'maciekvr',
        '76561198025451538': 'drakonno',
        '76561197994110158': 'sanorek',
        '76561198034203862': 'vr_agent',
        '3702342373170767': 'xjedam',
        '76561197995161445': 'mediekore',
        '76561198087710981': 'shreddyfreddy',
        '76561198999385463': 'woltixo',
        '76561198035381239': 'motzel',
        '76561198178407566' : 'acetari',
        '76561198045386379': 'duhhello',
        '76561198835772160': 'tornadoef6',
        '76561198187936410': 'garsh_',
        '76561198362923485': 'tseska_',
        '76561198154190170': 'tieeli',
        '76561198333869741': 'cerret07',
        '76561197995162898': 'electrostats',
        '76561198166289091': 'rocker1904',
        '2538637699496776': 'astrella_',
        '76561198171842815': 'coolpickb',
        '76561198145281261': 'harbgy'
      }

      log.info('Adding predefined Twitch profiles...', 'DBFix')

      const updatePlayerTwitchProfile = async (twitchProfile) => twitchRepository().set(twitchProfile);

      await Promise.all(Object.entries(predefinedProfiles).map(async ([playerId, twitchLogin]) => updatePlayerTwitchProfile(
        {
          lastUpdated: null,
          login: twitchLogin,
          playerId
        }
      )))

      await addAppliedFix(fixName);

      log.info('Twitch profiles added.', 'DBFix')
    }
  },

  'player-history-20211022': {
    apply: async fixName => {
      log.info('Apply player ss history fix (20211022)')

      return db.runInTransaction(['players-history', 'key-value'], async tx => {
        const playersHistoryStore = tx.objectStore('players-history');

        let cursor = await playersHistoryStore.openCursor();

        while (cursor) {
          const history = cursor.value;

          if (!history?.playerId || !isDateObject(history?.ssDate)) {
            await cursor.delete();
            cursor = await cursor.continue();

            continue;
          }

          const playerId = history.playerId;
          const ssDate = correctOldSsDate(history.ssDate);
          const playerIdSsTimestamp = `${playerId}_${ssDate.getTime()}`;

          await cursor.delete();
          playersHistoryStore.put({...history, ssDate, playerIdSsTimestamp});

          cursor = await cursor.continue();
        }

        const keyValueStore = tx.objectStore('key-value')
        let allAppliedFixes = await keyValueStore.get(FIXES_KEY);
        allAppliedFixes = allAppliedFixes && Array.isArray(allAppliedFixes) ? allAppliedFixes : [];
        allAppliedFixes.push(fixName);
        await keyValueStore.put(allAppliedFixes, FIXES_KEY);
      });
    },
  },
};

export default async () => {
  let appliedDbFixes = await getAppliedFixes();
  const appliedFixes = appliedDbFixes && Array.isArray(appliedDbFixes) ? appliedDbFixes : [];
  const neededFixes = Object.keys(allFixes).filter(f => !appliedFixes.includes(f) && (!allFixes[f].validTo || allFixes[f].validTo > new Date()));

  if (!neededFixes.length) return;

  document.body.innerHTML = '<p>BeatLeader is an open Beat Saber leaderboard!</p>';

  for (let key of neededFixes) {
    await allFixes[key].apply(key);
  }

  document.body.innerHTML = '';
}