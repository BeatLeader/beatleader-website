import eventBus from "../utils/broadcast-channel-pubsub";
import download from './download';
import {db} from '../db/db';
import beatSaviorRepository from "../db/repository/beat-savior";
import beatSaviorPlayersRepository from "../db/repository/beat-savior-players";
import groupsRepository from "../db/repository/groups";
import keyValueRepository from "../db/repository/key-value";
import playersRepository from "../db/repository/players";
import playersHistoryRepository from "../db/repository/players-history";
import rankedsRepository from "../db/repository/rankeds";
import rankedsChangesRepository from "../db/repository/rankeds-changes";
import scoresRepository from "../db/repository/scores";
import songsBeatMapsRepository from "../db/repository/songs-beatmaps";
import twitchRepository from "../db/repository/twitch";
import {dateFromString} from './date'
import log from './logger'
import {opt} from './js'

const EXPORT_NAME = 'SSR';

const repositories = [
	{
		repository: beatSaviorRepository, casts: {
			date: ['timeSet'],
		}
	},
	{
		repository: beatSaviorPlayersRepository, casts: {
			date: ['lastRefresh'],
		},
	},
	{repository: groupsRepository},
	{
		repository: keyValueRepository,
		excludedKeys: ['twitchToken'],
		casts: {
			date: ['rankedsLastUpdated'],
		},
	},
	{
		repository: playersRepository,
		casts: {
			date: ['profileLastUpdated', 'recentPlay', 'recentPlayLastUpdated', 'scoresLastUpdated'],
		},
	},
	{
		repository: playersHistoryRepository,
		casts: {
			date: ['ssDate', 'localDate'],
		},
	},
	{
		repository: rankedsRepository,
		casts: {
			date: ['firstSeen'],
		},
	},
	{repository: rankedsChangesRepository},
	{
		repository: scoresRepository,
		casts: {
			date: ['beatSavior.timeSet', 'fetchedAt', 'lastUpdated', 'score.timeSet', 'timeSet', 'history.*.timeSet'],
		},
	},
	{
		repository: songsBeatMapsRepository,
		casts: {
			date: ['lastUpdated']
		}
	},
	{
		repository: twitchRepository,
		casts: {
			date: ['lastUpdated', 'profileLastUpdated'],
		},
	},
];

const getOrigin = () => {
	const url = window ? new URL(window.location.href) : null;
	return url ? url.origin : null;
}

export const exportJsonData = async (filename = 'ssr-db-' + (new Date()).toISOString().replace(/:/g, '_') + '.json') => {
	const inLineKeysRepositories = getInLineKeysRepositories();
	const outOfLineKeysRepositories = getOutOfLineKeysRepositories();

	const data = (await Promise.all(inLineKeysRepositories.map(r => r.repository).map(async repository => repository().getAll())))
		.reduce((cum, repositoryData, idx) => {
			cum.stores[inLineKeysRepositories[idx].repository().getStoreName()] = repositoryData;
			return cum;
		}, {name: EXPORT_NAME, origin: getOrigin(), version: db.version, exportedOn: new Date(), stores: {}});

	await Promise.all(
		outOfLineKeysRepositories.map(async repositoryItem => {
			const repository = repositoryItem.repository;
			const storeName = repository().getStoreName();
			const repositoryKeys = await repository().getAllKeys();
			const respositoryValues = await repository().getAll();
			data.stores[storeName] = repositoryKeys.reduce((cum, key, idx) => cum.concat([{
				key,
				value: opt(repositoryItem, 'excludedKeys', []).includes(key) ? null : respositoryValues[idx],
			}]), []);
		}),
	);

	return download(JSON.stringify(data), filename, 'application/json;charset=utf-8;');
}

export const importJsonData = async json => {
	const availableStores = repositories.map(item => item.repository().getStoreName());

	eventBus.publish('dl-manager-pause-cmd');

	await db.runInTransaction(availableStores, async tx => {
		for(let repositoryItem of repositories) {
			const repository = repositoryItem.repository();
			const isOutOfLineRepository = repository.hasOutOfLineKey();

			const storeName = repository.getStoreName();

			if (!json.stores[storeName]) {
				log.warn(`Store ${storeName} does not exists in imported JSON`);
				continue;
			}

			const items = json.stores[storeName].map(value => castRepositoryItem(value, repositoryItem));

			const store = tx.objectStore(storeName);
			await store.clear();

			for(const item of items) {
				if (isOutOfLineRepository) {
					await store.put(item.value, item.key)
				} else {
					await store.put(item);
				}
			}

			repository.flushCache();
		}
	});

	eventBus.publish('data-imported');
}

function castObjectKeys(value, testKeys, castType = 'date', isOutOfLineRepository = false) {
	const cast = (v, type = 'date') => {
		switch(type) {
			case 'date':return dateFromString(v)

			default: return v;
		}
	}

	testKeys.forEach(key => {
		const splittedKey = key.split('.');
		const mainKey = splittedKey.shift();
		const keys = (!isOutOfLineRepository ? [mainKey] : []).concat(isOutOfLineRepository && !splittedKey.length ? [''] : splittedKey);

		let valuePart = isOutOfLineRepository ? opt(value, 'value') : value;
		if (!valuePart) return;

		if (isOutOfLineRepository && value.key !== mainKey) return;

		const process = (v, keys) => {
			if (!keys || !keys.length) return v;

			const currentKey = keys[0];

			switch(currentKey) {
				case '': return cast(v, castType);

				case '*':
					if (!Array.isArray(v)) return v;

					return v.map(innerV => keys.length === 1 ? cast(innerV, castType) : process(innerV, keys.slice(1)))

				default:
					if (!v.hasOwnProperty(currentKey)) return v;

					v[currentKey] = keys.length === 1 ? cast(v[currentKey], castType) : process(v[currentKey], keys.slice(1));

					return v;
			}
		}

		valuePart = process(valuePart, keys);

		value = isOutOfLineRepository ? {key: value.key, value: valuePart} : valuePart;
	});

	return value;
}

const castRepositoryItem = (value, repositoryItem) => {
	const isOutOfLineRepository = repositoryItem.repository().hasOutOfLineKey();

	Object.entries(opt(repositoryItem, 'casts', {})).forEach(([castType, keys]) => {
		value = castObjectKeys(value, keys, castType, isOutOfLineRepository)
	});

	return value;
};

const getInLineKeysRepositories = () => repositories.filter(r => !r.repository().hasOutOfLineKey());
const getOutOfLineKeysRepositories = () => repositories.filter(r => r.repository().hasOutOfLineKey());

export function importDataHandler(e, onError = null, onImportCompleted = null) {
	const file = e.target.files[0];
	if (!file) {
		return;
	}
	if (file.type !== 'application/json') {
		if (onError) onError('Select the JSON file containing the data export');
		return;
	}

	const reader = new FileReader();

	reader.onload = async function (e) {
		try {
			const json = JSON.parse(e.target.result);

			if (!json || !json.name || !json.version || !json.stores) {
				if (onError) onError('File is invalid');
				return;
			}

			if (json.name !== EXPORT_NAME) {
				if (onError) onError('File is invalid');
				return;
			}

			await importJsonData(json);

			if (onImportCompleted) await onImportCompleted(json);
		} catch (e) {
			log.error(e);
			if (onError) onError('Invalid JSON file');
		}
	};

	reader.readAsText(file);
}