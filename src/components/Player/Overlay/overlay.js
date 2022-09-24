import {BL_CDN} from '../../../network/queues/beatleader/page-queue';

const CREATOR = ['rankedteam', 'juniorrankedteam', 'creator', 'admin'];
const SPONSOR = ['sponsor', ...CREATOR];
const SUPPORTER = ['supporter', ...SPONSOR];
const TIPPER = ['tipper', ...SUPPORTER];

const allOverlays = [
	{
		title: 'The Sun',
		items: [
			{
				title: 'Tier 1',
				name: 'TheSun_Tier1',
				url: BL_CDN + '/assets/TheSun_Tier1.webp',
				preview: BL_CDN + '/assets/TheSun_Tier1_preview.webp',
				neededRoles: TIPPER,
				tooltip: 'You must be a Tipper to use this overlay',
			},
			{
				title: 'Tier 2',
				name: 'TheSun_Tier2',
				url: BL_CDN + '/assets/TheSun_Tier2.webp',
				preview: BL_CDN + '/assets/TheSun_Tier2_preview.webp',
				neededRoles: SUPPORTER,
				tooltip: 'You must be a Supporter to use this overlay',
			},
			{
				title: 'Tier 3',
				name: 'TheSun_Tier3',
				url: BL_CDN + '/assets/TheSun_Tier3.webp',
				preview: BL_CDN + '/assets/TheSun_Tier3_preview.webp',
				neededRoles: SPONSOR,
				tooltip: 'You must be a Sponsor to use this overlay',
			},
		],
	},

	{
		title: 'The Moon',
		items: [
			{
				title: 'Tier 1',
				name: 'TheMoon_Tier1',
				url: BL_CDN + '/assets/TheMoon_Tier1.webp',
				preview: BL_CDN + '/assets/TheMoon_Tier1_preview.webp',
				neededRoles: TIPPER,
				tooltip: 'You must be a Tipper to use this overlay',
			},
			{
				title: 'Tier 2',
				name: 'TheMoon_Tier2',
				url: BL_CDN + '/assets/TheMoon_Tier2.webp',
				preview: BL_CDN + '/assets/TheMoon_Tier2_preview.webp',
				neededRoles: SUPPORTER,
				tooltip: 'You must be a Supporter to use this overlay',
			},
			{
				title: 'Tier 3',
				name: 'TheMoon_Tier3',
				url: BL_CDN + '/assets/TheMoon_Tier3.webp',
				preview: BL_CDN + '/assets/TheMoon_Tier3_preview.webp',
				neededRoles: SPONSOR,
				tooltip: 'You must be a Sponsor to use this overlay',
			},
		],
	},

	{
		title: 'The Star',
		items: [
			{
				title: 'Tier 1',
				name: 'TheStar_Tier1',
				url: BL_CDN + '/assets/TheStar_Tier1.webp',
				preview: BL_CDN + '/assets/TheStar_Tier1_preview.webp',
				neededRoles: TIPPER,
				tooltip: 'You must be a Tipper to use this overlay',
			},
			{
				title: 'Tier 2',
				name: 'TheStar_Tier2',
				url: BL_CDN + '/assets/TheStar_Tier2.webp',
				preview: BL_CDN + '/assets/TheStar_Tier2_preview.webp',
				neededRoles: SUPPORTER,
				tooltip: 'You must be a Supporter to use this overlay',
			},
			{
				title: 'Tier 3',
				name: 'TheStar_Tier3',
				url: BL_CDN + '/assets/TheStar_Tier3.webp',
				preview: BL_CDN + '/assets/TheStar_Tier3_preview.webp',
				neededRoles: SPONSOR,
				tooltip: 'You must be a Sponsor to use this overlay',
			},
		],
	},

	{
		title: 'Sparks',
		items: [
			{
				title: 'Tier 1',
				name: 'Sparks_Tier1',
				url: BL_CDN + '/assets/Sparks_Tier1.webp',
				preview: BL_CDN + '/assets/Sparks_Tier1_preview.webp',
				neededRoles: TIPPER,
				tooltip: 'You must be a Tipper to use this overlay',
			},
			{
				title: 'Tier 2',
				name: 'Sparks_Tier2',
				url: BL_CDN + '/assets/Sparks_Tier2.webp',
				preview: BL_CDN + '/assets/Sparks_Tier2_preview.webp',
				neededRoles: SUPPORTER,
				tooltip: 'You must be a Supporter to use this overlay',
			},
			{
				title: 'Tier 3',
				name: 'Sparks_Tier3',
				url: BL_CDN + '/assets/Sparks_Tier3.webp',
				preview: BL_CDN + '/assets/Sparks_Tier3_preview.webp',
				neededRoles: SPONSOR,
				tooltip: 'You must be a Sponsor to use this overlay',
			},
		],
	},

	{
		title: 'Special',
		items: [
			{
				title: 'Tier 1',
				name: 'Special_Tier1',
				url: BL_CDN + '/assets/Special_Tier1.webp',
				preview: BL_CDN + '/assets/Special_Tier1_preview.webp',
				neededRoles: CREATOR,
				tooltip: 'You must be a Beat Leader Creator to use this overlay',
			},
			{
				title: 'Tier 2',
				name: 'Special_Tier2',
				url: BL_CDN + '/assets/Special_Tier2.webp',
				preview: BL_CDN + '/assets/Special_Tier2_preview.webp',
				neededRoles: CREATOR,
				tooltip: 'You must be a Beat Leader Creator to use this overlay',
			},
			{
				title: 'Tier 3',
				name: 'Special_Tier3',
				url: BL_CDN + '/assets/Special_Tier3.webp',
				preview: BL_CDN + '/assets/Special_Tier3_preview.webp',
				neededRoles: CREATOR,
				tooltip: 'You must be a Beat Leader Creator to use this overlay',
			},
		],
	},
];

export const getAllOverlays = roles => {
	return allOverlays.map(a => ({
		...a,
		items: a.items.map(i => {
			return {...i, locked: !(!i.neededRoles?.length || i.neededRoles.some(r => (roles ?? []).includes(r)))};
		}),
	}));
};

export const getOverlayByName = (name, full = true) =>
	allOverlays.reduce((acc, o) => acc.concat(o.items), []).find(i => i.name === name)?.[full ? 'url' : 'preview'] ?? null;
