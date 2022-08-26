import {formatNumber} from '../format';
import {capitalize, opt} from '../js';

export const diffColors = {
	easy: 'MediumSeaGreen',
	normal: '#59b0f4',
	hard: 'tomato',
	expert: '#bf2a42',
	expertPlus: '#8f48db',
	expertplus: '#8f48db',
};

const diffTypes = [
	'horizontalstandard',
	'inversestandard',
	'invertedstandard',
	'verticalstandard',
	'standard',
	'90degree',
	'360degree',
	'noarrows',
	'onesaber',
	'lightshow',
	'lawless',
];

const diffDescriptions = {
	horizontalstandard: 'Horisontal Standard (Chirality mod)',
	inversestandard: 'Inverse Standard (Chirality mod)',
	invertedstandard: 'Inverted Standard (Chirality mod)',
	verticalstandard: 'Vertical Standard (Chirality mod)',
	standard: 'Standard',
	'90degree': '90 Degree',
	'360degree': '360 Degree',
	noarrows: 'No Arrows',
	onesaber: 'One Saber',
	lightshow: 'Light Show',
	lawless: 'Lawless',
};

export function getDiffColor(diffInfo) {
	return diffColors[diffInfo.diff.toLowerCase()] ? diffColors[diffInfo.diff.toLowerCase()] : null;
}

export function extractDiffAndType(ssDiff) {
	const match = /^_([^_]+)_Solo(.*)$/.exec(ssDiff);
	if (!match) return null;

	return {
		diff: match[1],
		type: opt(match, '2', 'Standard'),
	};
}

export function getIconNameForDiff(diffInfo) {
	for (var i = 0; i < diffTypes.length; i++) {
		const diffType = diffTypes[i];
		if (diffInfo.type.toLowerCase().includes(diffType)) {
			if (diffType == '360degree') {
				return 'degree360-icon';
			} else if (diffType == '90degree') {
				return 'degree90-icon';
			} else {
				return diffType + '-icon';
			}
		}
	}
	return 'standard-icon';
}

export function getDescriptionForDiff(diffInfo) {
	return diffDescriptions[diffInfo.type.toLowerCase()] ?? 'Standard';
}

const HMDs = {
	0: {
		name: 'Unknown headset',
		icon: 'unknown',
		color: 'invert(70%) sepia(65%) saturate(4492%) hue-rotate(354deg) brightness(96%) contrast(91%)',
	},
	1: {
		name: 'Oculus Rift CV1',
		icon: 'oculus',
		color: 'invert(99%) sepia(3%) saturate(82%) hue-rotate(58deg) brightness(118%) contrast(100%)',
	},
	2: {name: 'Vive', icon: 'vive', color: 'invert(54%) sepia(78%) saturate(2598%) hue-rotate(157deg) brightness(97%) contrast(101%)'},
	4: {name: 'Vive Pro', icon: 'vive', color: 'invert(99%) sepia(3%) saturate(82%) hue-rotate(58deg) brightness(118%) contrast(100%)'},
	8: {
		name: 'Windows Mixed Reality',
		icon: 'wmr',
		color: 'invert(34%) sepia(67%) saturate(7482%) hue-rotate(193deg) brightness(103%) contrast(101%)',
	},
	16: {name: 'Rift S', icon: 'oculus', color: 'invert(96%) sepia(9%) saturate(5456%) hue-rotate(170deg) brightness(100%) contrast(107%)'},
	32: {
		name: 'Oculus Quest',
		icon: 'oculus',
		color: 'invert(73%) sepia(55%) saturate(5479%) hue-rotate(271deg) brightness(106%) contrast(107%)',
	},
	64: {
		name: 'Valve Index',
		icon: 'index',
		color: 'invert(81%) sepia(27%) saturate(6288%) hue-rotate(344deg) brightness(103%) contrast(103%)',
	},
	128: {
		name: 'Vive Cosmos',
		icon: 'vive',
		color: 'invert(11%) sepia(100%) saturate(7426%) hue-rotate(297deg) brightness(85%) contrast(109%)',
	},
	256: {
		name: 'Oculus Quest 2',
		icon: 'oculus',
		color: 'invert(69%) sepia(52%) saturate(501%) hue-rotate(107deg) brightness(98%) contrast(86%)',
	},
};

export function getHeadsetForHMD(hmd) {
	return HMDs?.[hmd] ?? null;
}

const platformColors = {
	oculus: 'yellow',
	steam: 'blue',
	oculuspc: 'red',
};

export const platformDescription = {
	oculus: 'Quest',
	steam: 'PC Steam',
	oculuspc: 'PC Oculus',
};

export function describePlatform(platform) {
	let result = {};

	if (platform) {
		let parts = platform.split(',');
		if (parts.length > 0) {
			result.color = platformColors[parts[0]];
			result.description = 'Platform: ' + platformDescription[parts[0]];

			if (parts.length > 2) {
				result.description += ', Game: ' + parts[1] + ', Mod: ' + parts[2];
			}
		}
	}

	return result;
}

export function modeForModeName(modeName) {
	switch (modeName) {
		case 'Standard':
			return 1;
		case 'OneSaber':
			return 2;
		case 'NoArrows':
			return 3;
		case '90Degree':
			return 4;
		case '360Degree':
			return 5;
		case 'Lightshow':
			return 6;
		case 'Lawless':
			return 7;
	}

	return 0;
}

export function diffForDiffName(diffName) {
	switch (diffName) {
		case 'Easy':
		case 'easy':
			return 1;
		case 'Normal':
		case 'normal':
			return 3;
		case 'Hard':
		case 'hard':
			return 5;
		case 'Expert':
		case 'expert':
			return 7;
		case 'ExpertPlus':
		case 'expertPlus':
			return 9;
	}

	return 0;
}

export function userDescriptionForModifier(modifier) {
	switch (modifier) {
		case 'DA':
			return 'Dissapearing arrows';
		case 'FS':
			return 'Faster song';
		case 'SS':
			return 'Slower song';
		case 'SF':
			return 'Super fast song';
		case 'GN':
			return 'Ghost notes';
		case 'NA':
			return 'No arrows';
		case 'NB':
			return 'No bombs';
		case 'NF':
			return 'No fail';
		case 'NO':
			return 'No obstacles';
		case 'PM':
			return 'Pro mode';
		case 'SC':
			return 'Small cubes';
	}
	return 'Undefined modifier';
}

export const DifficultyStatus = {
	unranked: 0,
	nominated: 1,
	qualified: 2,
	ranked: 3,
	unrankable: 4,
	outdated: 5,
};

export function formatDiffStatus(status) {
	switch (status) {
		case DifficultyStatus.unranked:
			return 'Unranked';
		case DifficultyStatus.nominated:
			return 'Nominated';
		case DifficultyStatus.qualified:
			return 'Qualified';
		case DifficultyStatus.ranked:
			return 'Ranked';
		case DifficultyStatus.unrankable:
			return 'Unrankable';
		case DifficultyStatus.outdated:
			return 'Outdated';
	}
}

export const votingTypes = ['acc', 'tech', 'midspeed', 'speed'];
export const typesMap = {
	acc: 1,
	tech: 2,
	midspeed: 4,
	speed: 8,
};
export const typesDescription = {
	acc: {
		title: 'Accuracy',
		name: 'acc',
		icon: 'acc-icon',
		color: 'purple',
		textColor: 'white',
	},
	tech: {
		title: 'Technical',
		name: 'tech',
		icon: 'tech-icon',
		color: 'red',
		textColor: 'white',
	},
	midspeed: {
		title: 'Mid speed',
		name: 'midspeed',
		icon: 'midspeed-icon',
		color: 'green',
		textColor: 'white',
	},
	speed: {
		title: 'Speed',
		name: 'speed',
		icon: 'speed-icon',
		color: 'orange',
		textColor: 'black',
	},
};

export function mapTypeFromMask(type) {
	const types = Object.keys(typesMap).filter(key => typesMap[key] & type);

	return types?.length ? types.join(', ') : 'none';
}

export function mapTypeListFromMask(type) {
	return Object.keys(typesMap)
		.filter(key => typesMap[key] & type)
		.map(key => typesDescription[key])
		.filter(d => d);
}

export function votingsForTypeStats(stats) {
	let result = '';
	stats.forEach((element, i) => {
		if (element > 0) {
			result += votingTypes[i] + '  ' + formatNumber(element) + ', ';
		}
	});
	return result.length ? result.substring(0, result.length - 2) : null;
}

export function describeModifiersAndMultipliers(modifiers, multipliers) {
	if (modifiers && multipliers) {
		let result = 'Mods:';
		let total = 0;
		modifiers.forEach(key => {
			const value = multipliers[key];
			total += value;
			result += '\n' + userDescriptionForModifier(key) + (value > 0 ? ' +' : ' ') + Math.round(value * 100) + '%';
		});
		if (modifiers.length > 1) {
			result += '\nTotal:' + (total > 0 ? ' +' : ' ') + Math.round(total * 100) + '%';
		}
		return result;
	} else {
		return '';
	}
}

export function getHumanDiffInfo(diffInfo) {
	if (!diffInfo || !diffInfo.diff) return null;

	const name = diffInfo.diff;
	const typeSuffix = diffInfo.type !== 'Standard' ? '/' + diffInfo.type : '';

	switch (name) {
		case 'Easy':
		case 'easy':
			return {name, type: diffInfo.type, fullName: name + typeSuffix, shortName: 'Es', difficulty: 1, color: getDiffColor(diffInfo)};
		case 'Normal':
		case 'normal':
			return {name, type: diffInfo.type, fullName: name + typeSuffix, shortName: 'N', difficulty: 3, color: getDiffColor(diffInfo)};
		case 'Hard':
		case 'hard':
			return {name, type: diffInfo.type, fullName: name + typeSuffix, shortName: 'H', difficulty: 5, color: getDiffColor(diffInfo)};
		case 'Expert':
		case 'expert':
			return {name, type: diffInfo.type, fullName: name + typeSuffix, shortName: 'Ex', difficulty: 7, color: getDiffColor(diffInfo)};
		case 'ExpertPlus':
		case 'expertPlus':
			return {name, type: diffInfo.type, fullName: 'Expert+' + typeSuffix, shortName: 'E+', difficulty: 9, color: getDiffColor(diffInfo)};

		default:
			return null;
	}
}
