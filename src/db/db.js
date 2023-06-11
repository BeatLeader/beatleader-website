import {openDB} from 'idb';
import {fakeIDB} from './fake-db';
import log from '../utils/logger';
import {isDateObject} from '../utils/js';
import eventBus from '../utils/broadcast-channel-pubsub';

const SSR_DB_VERSION = 12;
export let db = null;

export default async () => {
	IDBKeyRange.prototype.toString = function () {
		return (
			'IDBKeyRange-' +
			(isDateObject(this.lower) ? this.lower.getTime() : this.lower) +
			'-' +
			(isDateObject(this.upper) ? this.upper : this.upper)
		);
	};

	return await openDatabase();
};

async function openDatabase(recursive) {
	try {
		let dbNewVersion = 0,
			dbOldVersion = 0;

		db = await openDB('ssr', SSR_DB_VERSION, {
			async upgrade(db, oldVersion, newVersion, transaction) {
				log.info(`Converting database from version ${oldVersion} to version ${newVersion}`);

				dbNewVersion = newVersion;
				dbOldVersion = oldVersion;

				switch (true) {
					case newVersion >= 1 && oldVersion <= 0:
						db.createObjectStore('twitch', {
							keyPath: 'playerId',
							autoIncrement: false,
						});

						// no autoIncrement, no keyPath - key must be provided
						db.createObjectStore('key-value');

						db.createObjectStore('cache');

						const beatSavior = db.createObjectStore('beat-savior', {
							keyPath: 'beatSaviorId',
							autoIncrement: false,
						});
						beatSavior.createIndex('beat-savior-playerId', 'playerId', {unique: false});
						beatSavior.createIndex('beat-savior-songId', 'songId', {unique: false});
						beatSavior.createIndex('beat-savior-fileId', 'fileId', {unique: false});

					// NO break here!

					case newVersion >= 2 && oldVersion <= 1:
						db.createObjectStore('beat-savior-players', {
							keyPath: 'playerId',
							autoIncrement: false,
						});

					// NO break here!

					case newVersion >= 5 && oldVersion <= 4:
						const songsBeatMapsStore = db.createObjectStore('songs-beatmaps', {
							keyPath: 'hash',
							autoIncrement: false,
						});
						songsBeatMapsStore.createIndex('songs-beatmaps--key', 'key', {unique: true});

					// NO break here

					case newVersion >= 6 && oldVersion <= 5:
						const songsBeatMapsStorev6 = transaction.objectStore('songs-beatmaps');
						songsBeatMapsStorev6.deleteIndex('songs-beatmaps--key');
						songsBeatMapsStorev6.createIndex('songs-beatmaps-key', 'key', {unique: true});

					// NO break here

					case newVersion >= 8 && oldVersion <= 7:
						const beatSaviorStorev8 = transaction.objectStore('beat-savior');
						beatSaviorStorev8.createIndex('beat-savior-hash', 'hash', {unique: false});

					// NO break here

					case newVersion >= 10 && oldVersion <= 9:
						const songsBeatMapsStoreV10 = transaction.objectStore('songs-beatmaps');
						songsBeatMapsStoreV10.deleteIndex('songs-beatmaps-key');
						songsBeatMapsStoreV10.createIndex('songs-beatmaps-key', 'key', {unique: false});

					// NO break here

					case newVersion >= 11 && oldVersion <= 10:
						db.createObjectStore('accsaber-categories', {
							keyPath: 'name',
							autoIncrement: false,
						});

						const accSaberPlayersStore = db.createObjectStore('accsaber-players', {
							keyPath: 'id',
							autoIncrement: false,
						});
						accSaberPlayersStore.createIndex('accsaber-players-playerId', 'playerId', {unique: false});
						accSaberPlayersStore.createIndex('accsaber-players-category', 'category', {unique: false});

					// NO break here

					case newVersion >= 12 && oldVersion <= 11:
						const accSaberPlayersHistoryStore = db.createObjectStore('accsaber-players-history', {
							keyPath: 'playerIdTimestamp',
							autoIncrement: false,
						});
						accSaberPlayersHistoryStore.createIndex('accsaber-players-history-playerId', 'playerId', {unique: false});

					// NO break here
				}

				log.info('Database converted');
			},

			blocked() {
				console.warn('DB blocked');
			},
			blocking() {
				// other tab tries to open newer db version - close connection
				console.warn('DB blocking... will be closed');
				db.close();

				// TODO: should be reopened with new version: event.newVersion
				// TODO: or rather notify user / auto reload page
			},
			terminated() {
				console.warn('DB terminated');
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
		};

		return db;
	} catch (e) {
		if (recursive) {
			log.error('Can not open DB.');

			throw e;
		} else {
			fakeIDB();
			await openDatabase(true);
		}
	}
}
