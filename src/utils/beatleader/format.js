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
	return modeDescriptions[diffInfo.type]?.icon ?? 'fas fa-circle-question';
}

export function getDescriptionForDiff(diffInfo) {
	return modeDescriptions[diffInfo.type]?.title ?? 'Unknown';
}

export const HMDs = {
	256: {
		name: 'Quest 2',
		icon: 'oculus.svg',
		color: 'invert(49%) sepia(26%) saturate(5619%) hue-rotate(146deg) brightness(93%) contrast(86%)',
		priority: 1,
	},
	512: {
		name: 'Quest 3',
		icon: 'meta.svg',
		color: 'invert(49%) sepia(26%) saturate(5619%) hue-rotate(260deg) brightness(93%) contrast(86%)',
		priority: 2,
	},
	64: {
		name: 'Valve Index',
		icon: 'index.svg',
		color: 'invert(81%) sepia(27%) saturate(6288%) hue-rotate(344deg) brightness(103%) contrast(103%)',
		priority: 2,
	},
	1: {
		name: 'Rift CV1',
		icon: 'oculus.svg',
		color: 'invert(99%) sepia(3%) saturate(82%) hue-rotate(58deg) brightness(118%) contrast(100%)',
		priority: 3,
	},
	2: {
		name: 'Vive',
		icon: 'vive.svg',
		color: 'invert(54%) sepia(78%) saturate(2598%) hue-rotate(157deg) brightness(97%) contrast(101%)',
		priority: 4,
	},
	60: {
		name: 'Pico 4',
		icon: 'piconeo.png',
		color: 'invert(99%) sepia(3%) saturate(82%) hue-rotate(58deg) brightness(118%) contrast(100%)',
		priority: 5,
	},
	61: {
		name: 'Quest Pro',
		icon: 'meta.svg',
		color: '',
		priority: 6,
	},
	8: {
		name: 'Windows Mixed Reality',
		icon: 'wmr.svg',
		color: 'invert(34%) sepia(67%) saturate(7482%) hue-rotate(193deg) brightness(103%) contrast(101%)',
		priority: 7,
	},
	16: {
		name: 'Rift S',
		icon: 'oculus.svg',
		color: 'invert(96%) sepia(9%) saturate(5456%) hue-rotate(170deg) brightness(100%) contrast(107%)',
		priority: 8,
	},
	65: {
		name: 'Controllable',
		icon: 'controllable.svg',
		color: '',
		priority: 8,
	},
	32: {
		name: 'Quest',
		icon: 'oculus.svg',
		color: 'invert(73%) sepia(55%) saturate(5479%) hue-rotate(271deg) brightness(106%) contrast(107%)',
		priority: 9,
	},
	4: {
		name: 'Vive Pro',
		icon: 'vive.svg',
		color: 'invert(99%) sepia(3%) saturate(82%) hue-rotate(58deg) brightness(118%) contrast(100%)',
		priority: 10,
	},
	35: {
		name: 'Vive Pro 2',
		icon: 'vive.svg',
		color: 'invert(79%) sepia(68%) saturate(5755%) hue-rotate(232deg) brightness(90%) contrast(109%)',
		priority: 11,
	},
	128: {
		name: 'Vive Cosmos',
		icon: 'vive.svg',
		color: 'invert(11%) sepia(100%) saturate(7426%) hue-rotate(297deg) brightness(85%) contrast(109%)',
		priority: 12,
	},
	36: {
		name: 'Vive Elite',
		icon: 'vive.svg',
		color: 'invert(25%) sepia(89%) saturate(5057%) hue-rotate(278deg) brightness(108%) contrast(85%)',
		priority: 13,
	},
	47: {
		name: 'Vive Focus',
		icon: 'vive.svg',
		color: 'invert(48%) sepia(91%) saturate(4410%) hue-rotate(340deg) brightness(94%) contrast(97%)',
		priority: 14,
	},
	38: {
		name: 'Pimax 8K',
		icon: 'pimax.png',
		color: 'invert(99%) sepia(3%) saturate(82%) hue-rotate(58deg) brightness(118%) contrast(100%)',
		priority: 15,
	},
	39: {
		name: 'Pimax 5K',
		icon: 'pimax.png',
		color: 'invert(99%) sepia(3%) saturate(82%) hue-rotate(58deg) brightness(118%) contrast(100%)',
		priority: 16,
	},
	40: {
		name: 'Pimax Artisan',
		icon: 'pimax.png',
		color: 'invert(99%) sepia(3%) saturate(82%) hue-rotate(58deg) brightness(118%) contrast(100%)',
		priority: 17,
	},
	33: {
		name: 'Pico Neo 3',
		icon: 'piconeo.png',
		color: 'invert(99%) sepia(3%) saturate(82%) hue-rotate(58deg) brightness(118%) contrast(100%)',
		priority: 18,
	},
	34: {
		name: 'Pico Neo 2',
		icon: 'piconeo.png',
		color: 'invert(99%) sepia(3%) saturate(82%) hue-rotate(58deg) brightness(118%) contrast(100%)',
		priority: 19,
	},
	41: {
		name: 'HP Reverb',
		icon: 'hp.png',
		color: 'invert(99%) sepia(3%) saturate(82%) hue-rotate(58deg) brightness(118%) contrast(100%)',
		priority: 20,
	},
	42: {
		name: 'Samsung WMR',
		icon: 'samsung.png',
		color: '',
		priority: 21,
	},
	43: {
		name: 'Qiyu Dream',
		icon: 'iqiyi.png',
		color: '',
		priority: 22,
	},
	45: {
		name: 'Lenovo Explorer',
		icon: 'lenovo.png',
		color: '',
		priority: 23,
	},
	46: {
		name: 'Acer WMR',
		icon: 'acer.svg',
		color: '',
		priority: 24,
	},
	48: {
		name: 'Arpara',
		icon: 'arpara.png',
		color: '',
		priority: 25,
	},
	49: {
		name: 'Dell Visor',
		icon: 'dell.svg',
		color: '',
		priority: 26,
	},
	55: {
		name: 'Huawei VR',
		icon: 'huawei.png',
		color: 'invert(99%) sepia(3%) saturate(82%) hue-rotate(58deg) brightness(118%) contrast(100%)',
		priority: 27,
	},
	56: {
		name: 'Asus WMR',
		icon: 'asus.svg',
		color: 'invert(99%) sepia(3%) saturate(82%) hue-rotate(58deg) brightness(118%) contrast(100%)',
		priority: 28,
	},
	51: {
		name: 'Vive DVT',
		icon: 'vive.svg',
		color: 'invert(69%) sepia(52%) saturate(501%) hue-rotate(107deg) brightness(98%) contrast(86%)',
		priority: 29,
	},
	52: {
		name: 'glasses20',
		icon: 'unknown.svg',
		color: 'invert(99%) sepia(3%) saturate(82%) hue-rotate(58deg) brightness(118%) contrast(100%)',
		priority: 30,
	},
	53: {
		name: 'Varjo',
		icon: 'varjo.svg',
		color: '',
		priority: 14,
	},
	54: {
		name: 'Vaporeon',
		icon: 'unknown.svg',
		color: 'invert(99%) sepia(3%) saturate(82%) hue-rotate(58deg) brightness(118%) contrast(100%)',
		priority: 32,
	},
	57: {
		name: 'Cloud XR',
		icon: 'unknown.svg',
		color: 'invert(99%) sepia(3%) saturate(82%) hue-rotate(58deg) brightness(118%) contrast(100%)',
		priority: 33,
	},
	58: {
		name: 'VRidge',
		icon: 'unknown.svg',
		color: 'invert(99%) sepia(3%) saturate(82%) hue-rotate(58deg) brightness(118%) contrast(100%)',
		priority: 34,
	},
	50: {
		name: 'e3',
		icon: 'unknown.svg',
		color: 'invert(99%) sepia(3%) saturate(82%) hue-rotate(58deg) brightness(118%) contrast(100%)',
		priority: 35,
	},
	59: {
		name: 'Medion Eraser',
		icon: 'unknown.svg',
		color: 'invert(99%) sepia(3%) saturate(82%) hue-rotate(58deg) brightness(118%) contrast(100%)',
		priority: 36,
	},

	37: {
		name: 'Miramar',
		icon: 'unknown.svg',
		color: 'invert(99%) sepia(3%) saturate(82%) hue-rotate(58deg) brightness(118%) contrast(100%)',
		priority: 37,
	},
	0: {
		name: 'Unknown headset',
		icon: 'unknown.svg',
		color: 'invert(70%) sepia(65%) saturate(4492%) hue-rotate(354deg) brightness(96%) contrast(91%)',
		priority: 38,
	},
	44: {
		name: 'Disco',
		icon: 'disco.png',
		color: 'invert(99%) sepia(3%) saturate(82%) hue-rotate(58deg) brightness(118%) contrast(100%)',
		priority: 39,
	},
};

export function getHeadsetForHMD(hmd) {
	return HMDs?.[hmd] ?? null;
}

export function getControllerForEnum(controller) {
	switch (controller) {
		case 1:
			return 'Oculus Touch controllers';
		case 16:
			return 'Oculus Touch 2 controllers';
		case 79:
			return 'Meta Quest 3 controllers';
		case 256:
			return 'Quest 2 controllers';
		case 2:
			return 'VIVE wands';
		case 4:
			return 'VIVE 2 wands';
		case 128:
			return 'VIVE cosmos controllers';
		case 8:
			return 'WMR controllers';
		case 33:
			return 'Pico controllers';
		case 34:
			return 'Pico controllers';
		case 35:
			return 'VIVE Pro dudads';
		case 37:
			return 'Miramar controllers';
		case 44:
			return 'disco controllers';
		case 61:
			return 'Quest Pro controllers';
		case 62:
			return 'VIVE tracker';
		case 63:
			return 'VIVE tracker 2';
		case 64:
			return 'Knuckles';
		case 65:
			return 'nolo controllers';
		case 66:
			return 'Pico phoenix';
		case 67:
			return 'Hands 🙌';
		case 68:
			return 'VIVE tracker 3';
		case 75:
			return 'Gamepad 🎮';
		case 76:
			return 'Joy-Con';
		case 77:
			return 'Steam Deck';
		case 78:
			return 'Etee';
	}

	return '';
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

export const modeDescriptions = {
	GhostStandard: {
		title: 'Spooky!',
		icon: 'fas fa-ghost',
		color: 'purple',
		textColor: 'white',
	},
	Standard: {
		title: 'Standard',
		icon: 'standard-icon',
		color: 'purple',
		textColor: 'white',
	},
	OneSaber: {
		title: 'One Saber',
		icon: 'onesaber-icon',
		color: 'purple',
		textColor: 'white',
	},
	NoArrows: {
		title: 'No Arrows',
		icon: 'noarrows-icon',
		color: 'purple',
		textColor: 'white',
	},
	'90Degree': {
		title: '90 Degree',
		icon: 'degree90-icon',
		color: 'purple',
		textColor: 'white',
	},
	'360Degree': {
		title: '360 Degree',
		icon: 'degree360-icon',
		color: 'purple',
		textColor: 'white',
	},
	Lightshow: {
		title: 'Lightshow',
		icon: 'lightshow-icon',
		color: 'purple',
		textColor: 'white',
	},
	Lawless: {
		title: 'Lawless',
		icon: 'lawless-icon',
		color: 'purple',
		textColor: 'white',
	},
	Legacy: {
		title: 'Legacy',
		icon: 'legacy-icon',
		color: 'purple',
		textColor: 'white',
	},
	HorizontalStandard: {
		title: 'Horisontal Standard (Chirality mod)',
		icon: 'horizontalstandard-icon',
		color: 'purple',
		textColor: 'white',
	},
	InverseStandard: {
		title: 'Inverse Standard (Chirality mod)',
		icon: 'inversestandard-icon',
		color: 'purple',
		textColor: 'white',
	},
	InvertedStandard: {
		title: 'Inverted Standard (Chirality mod)',
		icon: 'invertedstandard-icon',
		color: 'purple',
		textColor: 'white',
	},
	VerticalStandard: {
		title: 'Vertical Standard (Chirality mod)',
		icon: 'verticalstandard-icon',
		color: 'purple',
		textColor: 'white',
	},
	'Standard-PinkPlay_Controllable': {
		title: 'Standard (Controllable mod)',
		icon: 'standard-controllable-icon',
		color: 'purple',
		textColor: 'white',
	},
	'OneSaber-PinkPlay_Controllable': {
		title: 'OneSaber (Controllable mod)',
		icon: 'onesaber-controllable-icon',
		color: 'purple',
		textColor: 'white',
	},
	'Lawless-PinkPlay_Controllable': {
		title: 'Lawless (Controllable mod)',
		icon: 'lawless-controllable-icon',
		color: 'purple',
		textColor: 'white',
	},
	RhythmGameStandard: {
		title: "It's a rhythm game!",
		icon: 'rhythmgamestandard-icon',
		color: 'purple',
		textColor: 'white',
	},
};

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

export const ModifiersList = [
	{
		id: 'NF',
		name: 'No Fail',
		icon: 'NoFailIcon.png',
	},
	{
		id: 'IF',
		name: '1 Life',
		icon: 'OneLifeIcon.png',
	},
	{
		id: 'BE',
		name: '4 Lives',
		icon: 'FourLivesIcon.png',
	},
	{
		id: 'NB',
		name: 'No Bombs',
		icon: 'NoBombsIcon.png',
	},
	{
		id: 'NO',
		name: 'No Walls',
		icon: 'NoObstaclesIcon.png',
	},
	{
		id: 'NA',
		name: 'No Arrows',
		icon: 'NoArrowsIcon.png',
	},
	{
		id: 'GN',
		name: 'Ghost Notes',
		icon: 'GhostNotes.png',
	},
	{
		id: 'DA',
		name: 'Disappearing Arrows',
		icon: 'DisappearingArrows.png',
	},
	{
		id: 'SC',
		name: 'Small Notes',
		icon: 'SmallNotesIcon.png',
	},
	{
		id: 'PM',
		name: 'Pro Mode',
		icon: 'ProModeIcon.png',
	},

	{
		id: 'SA',
		name: 'Strict Angles',
		icon: 'PreciseAnglesIcon.png',
	},
	{
		id: 'OD',
		name: 'Old Dots',
		icon: 'OldDotsIcon.png',
	},
	{
		id: 'SS',
		name: 'Slower Song',
		icon: 'SlowerSongIcon.png',
	},
	{
		id: 'FS',
		name: 'Faster Song',
		icon: 'FasterSongIcon.png',
	},
	{
		id: 'SF',
		name: 'Super Fast Song',
		icon: 'SuperFastSongIcon.png',
	},
	{
		id: 'OP',
		name: 'NJS cheesing',
		icon: 'OutsidePlatformIcon.png',
	},
];

export function userDescriptionForModifier(modifier) {
	return ModifiersList.find(m => m.id == modifier)?.name ?? 'Unknown modifier';
}

export const DifficultyStatus = {
	unranked: 0,
	nominated: 1,
	qualified: 2,
	ranked: 3,
	unrankable: 4,
	outdated: 5,
	inevent: 6,
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
		case DifficultyStatus.inevent:
			return 'In event';
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
		title: 'Slower map suitable for high accuracy plays.',
		name: 'acc',
		icon: 'acc-icon',
		color: 'purple',
		textColor: 'white',
	},
	tech: {
		title: 'Tech map with quirky patterns',
		name: 'tech',
		icon: 'tech-icon',
		color: 'red',
		textColor: 'white',
	},
	midspeed: {
		title: 'Medium speed map with regular patterns',
		name: 'midspeed',
		icon: 'midspeed-icon',
		color: 'green',
		textColor: 'white',
	},
	speed: {
		title: 'High speed map. Please warm up before playing!',
		name: 'speed',
		icon: 'speed-icon',
		color: 'orange',
		textColor: 'black',
	},
};

export function mapTypeFromMask(type) {
	const types = Object.keys(typesMap).filter(key => typesMap[key] & type);

	return types?.length ? types.join(',') : 'none';
}

export function mapTypeListFromMask(type) {
	return Object.keys(typesMap)
		.filter(key => typesMap[key] & type)
		.map(key => typesDescription[key])
		.filter(d => d);
}

export const requirementsMap = {
	chroma: 1 << 1,
	noodles: 1 << 2,
	mappingExtensions: 1 << 3,
	cinema: 1 << 4,
	V3: 1 << 5,
	optionalProperties: 1 << 6,
};

export const requirementsDescription = {
	chroma: {
		title: 'Map uses Chroma mod (rich visual effects)',
		name: 'Chroma',
		icon: 'fas fa-palette',
		color: 'red',
		textColor: 'white',
	},
	noodles: {
		title: 'Map requires Noodle Extensions mod (modcharts)',
		name: 'Noodle Extensions',
		icon: 'fas fa-mountain-sun',
		color: 'yellow',
		textColor: 'black',
	},
	mappingExtensions: {
		title: 'Map requires Mapping Extensions mod',
		name: 'Mapping Extensions',
		icon: 'fas fa-trowel-bricks',
		color: 'blue',
		textColor: 'white',
	},
	cinema: {
		title: 'Map uses Cinema mod (video on background)',
		name: 'Cinema',
		icon: 'fas fa-panorama',
		color: 'orange',
		textColor: 'black',
	},
	V3: {
		title: 'Map with arcs and/or chains.',
		name: 'V3 Notes',
		icon: 'v3-icon',
		color: 'purple',
		textColor: 'white',
	},
	optionalProperties: {
		title: 'v3.3 Map with optional properties for elements. May not work on Quest',
		name: 'Optional Properties',
		icon: 'fas fa-file',
		color: 'grey',
		textColor: 'white',
	},
};

export function mapRequirementsListFromMask(type) {
	return Object.keys(requirementsMap)
		.filter(key => requirementsMap[key] & type)
		.map(key => requirementsDescription[key])
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
			const value = multipliers[key.toLowerCase()] ?? 0;
			total += value;
			result +=
				'\n' + userDescriptionForModifier(key.toUpperCase()) + ': ' + (value > 0 ? ' +' : ' ') + Math.round(value * 10000) / 100 + '%';
		});
		if (modifiers.length > 1) {
			result += '\nTotal:' + (total > 0 ? ' +' : ' ') + Math.round(total * 10000) / 100 + '%';
		}
		return result;
	} else {
		return '';
	}
}

export function describeModifiersChanges(oldModifiers, newModifiers) {
	if (oldModifiers && newModifiers) {
		let result = '';
		Object.keys(oldModifiers).forEach(key => {
			const oldvalue = oldModifiers[key.toLowerCase()] ?? 0;
			const newvalue = newModifiers[key.toLowerCase()] ?? 0;

			if (oldvalue != newvalue) {
				result +=
					userDescriptionForModifier(key.toUpperCase()) +
					': ' +
					(oldvalue > 0 ? ' +' : ' ') +
					Math.round(oldvalue * 10000) / 100 +
					'% -> ' +
					(newvalue > 0 ? ' +' : ' ') +
					Math.round(newvalue * 10000) / 100 +
					'%' +
					'\n';
			}
		});
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

export function describeProfilePart(part) {
	switch (part) {
		case 'changes':
			return 'Rank change';
		case 'clans':
			return 'Clans';
		case 'graphs':
			return 'Graphs';
		case 'pinnedScores':
			return 'Pinned scores';
		case 'achievements':
			return 'Achievements';
		case 'histogram':
			return 'Histogram';
		case 'scoresToPlaylist':
			return 'Scores to playlist button';
		case 'globalMiniRanking':
			return 'Global mini ranking';
		case 'countryMiniRanking':
			return 'Country mini ranking';
		case 'friendsMiniRanking':
			return 'Friends mini ranking';
	}

	return 'Undefined';
}

export function describeGraphAxis(axis) {
	switch (axis) {
		case 'y0':
			return 'Rank';
		case 'y1':
			return 'Pp';
		case 'y2':
			return 'Country rank';
		case 'y3':
			return 'Ranked play count';
		case 'y4':
			return 'Total play count';
		case 'y5':
			return 'Ranked scores';
		case 'y6':
			return 'Ranked improved';
		case 'y7':
			return 'Unranked scores';
		case 'y8':
			return 'Unranked improved';
	}

	return 'Undefined';
}

export const all_countries = [
	'ad',
	'ae',
	'af',
	'ag',
	'ai',
	'al',
	'am',
	'ao',
	'aq',
	'ar',
	'as',
	'at',
	'au',
	'aw',
	'ax',
	'az',
	'ba',
	'bb',
	'bd',
	'be',
	'bf',
	'bg',
	'bh',
	'bi',
	'bj',
	'bl',
	'bm',
	'bn',
	'bo',
	'bq',
	'br',
	'bs',
	'bt',
	'bv',
	'bw',
	'by',
	'bz',
	'ca',
	'cc',
	'cd',
	'cf',
	'cg',
	'ch',
	'ci',
	'ck',
	'cl',
	'cm',
	'cn',
	'co',
	'cr',
	'cu',
	'cv',
	'cw',
	'cx',
	'cy',
	'cz',
	'de',
	'dj',
	'dk',
	'dm',
	'do',
	'dz',
	'ec',
	'ee',
	'eg',
	'eh',
	'er',
	'es',
	'et',
	'fi',
	'fj',
	'fk',
	'fm',
	'fo',
	'fr',
	'ga',
	'gb',
	'gd',
	'ge',
	'gf',
	'gg',
	'gh',
	'gi',
	'gl',
	'gm',
	'gn',
	'gp',
	'gq',
	'gr',
	'gs',
	'gt',
	'gu',
	'gw',
	'gy',
	'hk',
	'hm',
	'hn',
	'hr',
	'ht',
	'hu',
	'id',
	'ie',
	'il',
	'im',
	'in',
	'io',
	'iq',
	'ir',
	'is',
	'it',
	'je',
	'jm',
	'jo',
	'jp',
	'ke',
	'kg',
	'kh',
	'ki',
	'km',
	'kn',
	'kp',
	'kr',
	'kw',
	'ky',
	'kz',
	'la',
	'lb',
	'lc',
	'li',
	'lk',
	'lr',
	'ls',
	'lt',
	'lu',
	'lv',
	'ly',
	'ma',
	'mc',
	'md',
	'me',
	'mf',
	'mg',
	'mh',
	'mk',
	'ml',
	'mm',
	'mn',
	'mo',
	'mp',
	'mq',
	'mr',
	'ms',
	'mt',
	'mu',
	'mv',
	'mw',
	'mx',
	'my',
	'mz',
	'na',
	'nc',
	'ne',
	'nf',
	'ng',
	'ni',
	'nl',
	'no',
	'np',
	'nr',
	'nu',
	'nz',
	'om',
	'pa',
	'pe',
	'pf',
	'pg',
	'ph',
	'pk',
	'pl',
	'pm',
	'pn',
	'pr',
	'ps',
	'pt',
	'pw',
	'py',
	'qa',
	're',
	'ro',
	'rs',
	'ru',
	'rw',
	'sa',
	'sb',
	'sc',
	'sd',
	'se',
	'sg',
	'sh',
	'si',
	'sj',
	'sk',
	'sl',
	'sm',
	'sn',
	'so',
	'sr',
	'ss',
	'st',
	'sv',
	'sx',
	'sy',
	'sz',
	'tc',
	'td',
	'tf',
	'tg',
	'th',
	'tj',
	'tk',
	'tl',
	'tm',
	'tn',
	'to',
	'tr',
	'tt',
	'tv',
	'tw',
	'tz',
	'ua',
	'ug',
	'um',
	'us',
	'uy',
	'uz',
	'va',
	'vc',
	've',
	'vg',
	'vi',
	'vn',
	'vu',
	'wf',
	'ws',
	'xk',
	'ye',
	'yt',
	'za',
	'zm',
	'zw',
	'not set',
];
