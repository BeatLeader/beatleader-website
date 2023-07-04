import {BL_ASSETS_CDN} from '../../../network/queues/beatleader/page-queue';

const BOOSTER = ['booster'];
const CREATOR = ['rankedteam', 'qualityteam', 'juniorrankedteam', 'creator', 'admin'];
const SPONSOR = ['sponsor', ...CREATOR];
const SUPPORTER = ['supporter', ...SPONSOR];
const TIPPER = ['tipper', ...SUPPORTER];

const allOverlays = [
	{
		title: 'Booster',
		items: [
			{
				title: 'Discord Booster',
				name: 'Booster_Tier1',
				neededRoles: BOOSTER,
				tooltip: 'You must boost our Discord server to use this overlay',
			},
		],
	},
	{
		title: 'The Sun',
		items: [
			{
				title: 'Tier 1',
				name: 'TheSun_Tier1',
				neededRoles: TIPPER,
				tooltip: 'You must be a Tipper to use this overlay',
				patreonLink: true,
			},
			{
				title: 'Tier 2',
				name: 'TheSun_Tier2',
				neededRoles: SUPPORTER,
				tooltip: 'You must be a Supporter to use this overlay',
				patreonLink: true,
			},
			{
				title: 'Tier 3',
				name: 'TheSun_Tier3',
				neededRoles: SPONSOR,
				tooltip: 'You must be a Sponsor to use this overlay',
				patreonLink: true,
			},
		],
	},

	{
		title: 'The Moon',
		items: [
			{
				title: 'Tier 1',
				name: 'TheMoon_Tier1',
				neededRoles: TIPPER,
				tooltip: 'You must be a Tipper to use this overlay',
				patreonLink: true,
			},
			{
				title: 'Tier 2',
				name: 'TheMoon_Tier2',
				neededRoles: SUPPORTER,
				tooltip: 'You must be a Supporter to use this overlay',
				patreonLink: true,
			},
			{
				title: 'Tier 3',
				name: 'TheMoon_Tier3',
				neededRoles: SPONSOR,
				tooltip: 'You must be a Sponsor to use this overlay',
				patreonLink: true,
			},
		],
	},

	{
		title: 'The Star',
		items: [
			{
				title: 'Tier 1',
				name: 'TheStar_Tier1',
				neededRoles: TIPPER,
				tooltip: 'You must be a Tipper to use this overlay',
				patreonLink: true,
			},
			{
				title: 'Tier 2',
				name: 'TheStar_Tier2',
				neededRoles: SUPPORTER,
				tooltip: 'You must be a Supporter to use this overlay',
				patreonLink: true,
			},
			{
				title: 'Tier 3',
				name: 'TheStar_Tier3',
				neededRoles: SPONSOR,
				tooltip: 'You must be a Sponsor to use this overlay',
				patreonLink: true,
			},
		],
	},

	{
		title: 'Sparks',
		items: [
			{
				title: 'Tier 1',
				name: 'Sparks_Tier1',
				neededRoles: TIPPER,
				tooltip: 'You must be a Tipper to use this overlay',
				patreonLink: true,
			},
			{
				title: 'Tier 2',
				name: 'Sparks_Tier2',
				neededRoles: SUPPORTER,
				tooltip: 'You must be a Supporter to use this overlay',
				patreonLink: true,
			},
			{
				title: 'Tier 3',
				name: 'Sparks_Tier3',
				neededRoles: SPONSOR,
				tooltip: 'You must be a Sponsor to use this overlay',
				patreonLink: true,
			},
		],
	},

	{
		title: 'Special',
		items: [
			{
				title: 'Tier 1',
				name: 'Special_Tier1',
				neededRoles: CREATOR,
				tooltip: 'You must be a Beat Leader Creator to use this overlay',
			},
			{
				title: 'Tier 2',
				name: 'Special_Tier2',
				neededRoles: CREATOR,
				tooltip: 'You must be a Beat Leader Creator to use this overlay',
			},
			{
				title: 'Tier 3',
				name: 'Special_Tier3',
				neededRoles: CREATOR,
				tooltip: 'You must be a Beat Leader Creator to use this overlay',
			},
		],
	},
];

export const getOverlayUrlByName = (effectName, type = '') =>
	effectName?.length ? `${BL_ASSETS_CDN}/${effectName}${type?.length ? `_${type}` : ''}.webp` : null;

export const getAllOverlays = roles => {
	return allOverlays.map(a => ({
		...a,
		items: a.items.map(i => {
			return {
				...i,
				url: getOverlayUrlByName(i?.name),
				preview: getOverlayUrlByName(i?.name, 'preview'),
				small: getOverlayUrlByName(i?.name, 'small'),
				locked: !(!i.neededRoles?.length || i.neededRoles.some(r => (roles ?? []).includes(r))),
			};
		}),
	}));
};

export function isPatron(roles) {
	var result = false;
	if (roles) {
		TIPPER.forEach(role => {
			if (roles.includes(role)) {
				result = true;
			}
		});
	}
	return result;
}

export function isAnySupporter(roles) {
	var result = isPatron(roles);
	if (!result && roles) {
		BOOSTER.forEach(role => {
			if (roles.includes(role)) {
				result = true;
			}
		});
	}
	return result;
}
