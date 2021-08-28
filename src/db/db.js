import {openDB} from 'idb'
import log from '../utils/logger'
import {isDateObject} from '../utils/js'
import eventBus from '../utils/broadcast-channel-pubsub'

const SSR_DB_VERSION = 9;
export let db = null;

export default async () => {
  IDBKeyRange.prototype.toString = function () {
    return "IDBKeyRange-" + (isDateObject(this.lower) ? this.lower.getTime() : this.lower) + '-' + (isDateObject(this.upper) ? this.upper : this.upper);
  }

  return await openDatabase();
}

async function openDatabase() {
  try {
    let dbNewVersion = 0, dbOldVersion = 0;

    db = await openDB('ssr', SSR_DB_VERSION, {
      async upgrade(db, oldVersion, newVersion, transaction) {
        log.info(`Converting database from version ${oldVersion} to version ${newVersion}`);

        dbNewVersion = newVersion;
        dbOldVersion = oldVersion;

        switch (true) {
          case newVersion >= 1 && oldVersion <= 0:
            db.createObjectStore('players', {
              keyPath: 'id',
              autoIncrement: false,
            });

            const playersHistory = db.createObjectStore('players-history', {
              keyPath: '_idbId',
              autoIncrement: true,
            });
            playersHistory.createIndex('players-history-playerId', 'playerId', {unique: false});
            playersHistory.createIndex('players-history-timestamp', 'timestamp', {unique: false});

            const scoresStore = db.createObjectStore('scores', {
              keyPath: 'id',
              autoIncrement: false,
            });
            scoresStore.createIndex('scores-leaderboardId', 'leaderboardId', {unique: false});
            scoresStore.createIndex('scores-playerId', 'playerId', {unique: false});
            scoresStore.createIndex('scores-timeset', 'timeset', {unique: false});
            scoresStore.createIndex('scores-pp', 'pp', {unique: false});

            db.createObjectStore('rankeds', {
              keyPath: 'leaderboardId',
              autoIncrement: false,
            });

            const songsStore = db.createObjectStore('songs', {
              keyPath: 'hash',
              autoIncrement: false,
            });
            songsStore.createIndex('songs-key', 'key', {unique: true});

            db.createObjectStore('twitch', {
              keyPath: 'playerId',
              autoIncrement: false,
            });

            const rankedsChangesStore = db.createObjectStore('rankeds-changes', {
              keyPath: '_idbId',
              autoIncrement: true,
            });
            rankedsChangesStore.createIndex('rankeds-changes-timestamp', 'timestamp', {unique: false});
            rankedsChangesStore.createIndex('rankeds-changes-leaderboardId', 'leaderboardId', {unique: false});

            // no autoIncrement, no keyPath - key must be provided
            db.createObjectStore('key-value');

            db.createObjectStore('cache');

            const groups = db.createObjectStore('groups', {keyPath: '_idbId', autoIncrement: true});
            groups.createIndex('groups-name', 'name', {unique: false});
            groups.createIndex('groups-playerId', 'playerId', {unique: false});

            const beatSaviorFiles = db.createObjectStore('beat-savior-files', {
              keyPath: 'fileId',
              autoIncrement: false,
            });

            const beatSavior = db.createObjectStore('beat-savior', {
              keyPath: 'beatSaviorId',
              autoIncrement: false,
            });
            beatSavior.createIndex('beat-savior-playerId', 'playerId', {unique: false});
            beatSavior.createIndex('beat-savior-songId', 'songId', {unique: false});
            beatSavior.createIndex('beat-savior-fileId', 'fileId', {unique: false});

            // NO break here!

          case newVersion >=2 && oldVersion <= 1:
            db.createObjectStore('beat-savior-players', {
              keyPath: 'playerId',
              autoIncrement: false,
            });

            // NO break here!

          case newVersion >= 3 && oldVersion <=2:
            db.deleteObjectStore('players');

            db.createObjectStore('players', {
              keyPath: 'playerId',
              autoIncrement: false,
            });

            const scoresStore4 = transaction.objectStore('scores');
            scoresStore4.deleteIndex('scores-timeset');
            scoresStore4.createIndex('scores-timeSet', 'timeSet', {unique: false});

            // NO break here

          case newVersion >= 4 && oldVersion <=3:
            db.deleteObjectStore('beat-savior-files');

            const beatSaviorStore = transaction.objectStore('beat-savior');
            beatSaviorStore.deleteIndex('beat-savior-fileId');
            beatSaviorStore.deleteIndex('beat-savior-songId');

          // NO break here

          case newVersion >= 5 && oldVersion <=4:
            const songsBeatMapsStore = db.createObjectStore('songs-beatmaps', {
              keyPath: 'hash',
              autoIncrement: false,
            });
            songsBeatMapsStore.createIndex('songs-beatmaps--key', 'key', {unique: true});

          // NO break here

          case newVersion >= 6 && oldVersion <=5:
            const songsBeatMapsStorev6 = transaction.objectStore('songs-beatmaps');
            songsBeatMapsStorev6.deleteIndex('songs-beatmaps--key');
            songsBeatMapsStorev6.createIndex('songs-beatmaps-key', 'key', {unique: true});

          // NO break here

          case newVersion >= 7 && oldVersion <=6:
            const scoresUpdateQueue = db.createObjectStore('scores-update-queue', {
              keyPath: 'id',
              autoIncrement: false,
            });
            scoresUpdateQueue.createIndex('scores-update-queue-fetchedAt', 'fetchedAt', {unique: false});

          case newVersion >= 8 && oldVersion <= 7:
            const beatSaviorStorev8 = transaction.objectStore('beat-savior');
            beatSaviorStorev8.createIndex('beat-savior-hash', 'hash', {unique: false});

          // NO break here

          case newVersion >= 9 && oldVersion <= 8:
            const playersHistoryStorev9 = transaction.objectStore('players-history');
            playersHistoryStorev9.deleteIndex('players-history-timestamp');
            playersHistoryStorev9.createIndex('players-history-playerIdSsTimestamp', 'playerIdSsTimestamp', {unique: true});

          // NO break here
        }

        log.info("Database converted");
      },

      blocked() {
        console.warn('DB blocked')
      },
      blocking() {
        // other tab tries to open newer db version - close connection
        console.warn('DB blocking... will be closed')
        db.close();

        eventBus.publish('dl-manager-pause-cmd');

        // TODO: should be reopened with new version: event.newVersion
        // TODO: or rather notify user / auto reload page
      },
      terminated() {
        console.warn('DB terminated');

        eventBus.publish('dl-manager-pause-cmd');
      },
    });

    // Closure code should awaits DB operations ONLY or fail
    // https://github.com/jakearchibald/idb#user-content-transaction-lifetime
    db.runInTransaction = async (objectStores, closure, mode = 'readwrite', options = {durability: 'strict'}) => {
      try {
        const tx = db.transaction(objectStores, mode, options);

        const result = await closure(tx);

        await tx.done;

        return result;
      } catch (e) {
        throw e;
      }
    }

    return db;
  }
  catch(e) {
    log.error('Can not open DB.');

    throw e;
  }
}