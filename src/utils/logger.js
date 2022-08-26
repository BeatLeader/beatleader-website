import {arrayUnique} from './js';

const LEVELS = {
	NONE: 0,
	ERROR: 1,
	WARN: 2,
	INFO: 3,
	DEBUG: 4,
	TRACE: 5,
};

let currentLevel = LEVELS.INFO;

export let enabledTypes = [];

export default {
	table: (data, level = LEVELS.TRACE, type = null) =>
		(!enabledTypes.length || enabledTypes.includes(type)) && currentLevel >= level ? console.table(data) : null,

	trace: (message, type = null, ...rest) =>
		(!enabledTypes.length || enabledTypes.includes(type)) && currentLevel >= LEVELS.TRACE
			? console.debug(`[SSR${type ? ` / ${type}` : ''}]`, message, ...rest)
			: null,

	debug: (message, type = null, ...rest) =>
		(!enabledTypes.length || enabledTypes.includes(type)) && currentLevel >= LEVELS.DEBUG
			? console.debug(`[SSR${type ? ` / ${type}` : ''}]`, message, ...rest)
			: null,

	info: (message, type = null, ...rest) =>
		(!enabledTypes.length || enabledTypes.includes(type)) && currentLevel >= LEVELS.INFO
			? console.info(`[SSR${type ? ` / ${type}` : ''}]`, message, ...rest)
			: null,

	warn: (message, type = null, ...rest) =>
		(!enabledTypes.length || enabledTypes.includes(type)) && currentLevel >= LEVELS.WARN
			? console.warn(`[SSR${type ? ` / ${type}` : ''}]`, message, ...rest)
			: null,

	error: (message, type = null, ...rest) =>
		(!enabledTypes.length || enabledTypes.includes(type)) && currentLevel >= LEVELS.ERROR
			? console.error(`[SSR${type ? ` / ${type}` : ''}]`, message, ...rest)
			: null,

	...LEVELS,
	level: () => currentLevel,
	setLevel: level => {
		currentLevel = Object.values(LEVELS).find(l => l === level) ? level : currentLevel;
	},
	logOnly: types => (enabledTypes = arrayUnique(enabledTypes.concat(Array.isArray(types) ? types : [types]))),
	logAll: () => (enabledTypes = []),
};
