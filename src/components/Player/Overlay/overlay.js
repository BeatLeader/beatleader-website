const OVERLAY_URL = ''; // TODO: replace it with BL CDN

export const allOverlays = [
	{
		title: 'The Sun',
		items: [
			{
				title: 'Tier 1',
				name: 'TheSun_Tier1',
				url: OVERLAY_URL + '/assets/profile-overlay/TheSun_Tier1.webp',
				preview: OVERLAY_URL + '/assets/profile-overlay/TheSun_Tier1_preview.webp',
				neededRoles: ['tipper'],
			},
			{
				title: 'Tier 2',
				name: 'TheSun_Tier2',
				url: OVERLAY_URL + '/assets/profile-overlay/TheSun_Tier2.webp',
				preview: OVERLAY_URL + '/assets/profile-overlay/TheSun_Tier2_preview.webp',
				neededRoles: ['supporter'],
			},
			{
				title: 'Tier 3',
				name: 'TheSun_Tier3',
				url: OVERLAY_URL + '/assets/profile-overlay/TheSun_Tier3.webp',
				preview: OVERLAY_URL + '/assets/profile-overlay/TheSun_Tier3_preview.webp',
				neededRoles: ['sponsor'],
			},
		],
	},

	{
		title: 'The Moon',
		items: [
			{
				title: 'Tier 1',
				name: 'TheMoon_Tier1',
				url: OVERLAY_URL + '/assets/profile-overlay/TheMoon_Tier1.webp',
				preview: OVERLAY_URL + '/assets/profile-overlay/TheMoon_Tier1_preview.webp',
				neededRoles: ['tipper'],
			},
			{
				title: 'Tier 2',
				name: 'TheMoon_Tier2',
				url: OVERLAY_URL + '/assets/profile-overlay/TheMoon_Tier2.webp',
				preview: OVERLAY_URL + '/assets/profile-overlay/TheMoon_Tier2_preview.webp',
				neededRoles: ['supporter'],
			},
			{
				title: 'Tier 3',
				name: 'TheMoon_Tier3',
				url: OVERLAY_URL + '/assets/profile-overlay/TheMoon_Tier3.webp',
				preview: OVERLAY_URL + '/assets/profile-overlay/TheMoon_Tier3_preview.webp',
				neededRoles: ['sponsor'],
			},
		],
	},

	{
		title: 'The Star',
		items: [
			{
				title: 'Tier 1',
				name: 'TheStar_Tier1',
				url: OVERLAY_URL + '/assets/profile-overlay/TheStar_Tier1.webp',
				preview: OVERLAY_URL + '/assets/profile-overlay/TheStar_Tier1_preview.webp',
				neededRoles: ['tipper'],
			},
			{
				title: 'Tier 2',
				name: 'TheStar_Tier2',
				url: OVERLAY_URL + '/assets/profile-overlay/TheStar_Tier2.webp',
				preview: OVERLAY_URL + '/assets/profile-overlay/TheStar_Tier2_preview.webp',
				neededRoles: ['supporter'],
			},
			{
				title: 'Tier 3',
				name: 'TheStar_Tier3',
				url: OVERLAY_URL + '/assets/profile-overlay/TheStar_Tier3.webp',
				preview: OVERLAY_URL + '/assets/profile-overlay/TheStar_Tier3_preview.webp',
				neededRoles: ['sponsor'],
			},
		],
	},

	{
		title: 'Sparks',
		items: [
			{
				title: 'Tier 1',
				name: 'Sparks_Tier1',
				url: OVERLAY_URL + '/assets/profile-overlay/Sparks_Tier1.webp',
				preview: OVERLAY_URL + '/assets/profile-overlay/Sparks_Tier1_preview.webp',
				neededRoles: ['tipper'],
			},
			{
				title: 'Tier 2',
				name: 'Sparks_Tier2',
				url: OVERLAY_URL + '/assets/profile-overlay/Sparks_Tier2.webp',
				preview: OVERLAY_URL + '/assets/profile-overlay/Sparks_Tier2_preview.webp',
				neededRoles: ['supporter'],
			},
			{
				title: 'Tier 3',
				name: 'Sparks_Tier3',
				url: OVERLAY_URL + '/assets/profile-overlay/Sparks_Tier3.webp',
				preview: OVERLAY_URL + '/assets/profile-overlay/Sparks_Tier3_preview.webp',
				neededRoles: ['sponsor'],
			},
		],
	},

	{
		title: 'Special',
		items: [
			{
				title: 'Tier 1',
				name: 'Special_Tier1',
				url: OVERLAY_URL + '/assets/profile-overlay/Special_Tier1.webp',
				preview: OVERLAY_URL + '/assets/profile-overlay/Special_Tier1_preview.webp',
				neededRoles: ['rankedteam', 'juniorrankedteam', 'creator', 'admin'],
			},
			{
				title: 'Tier 2',
				name: 'Special_Tier2',
				url: OVERLAY_URL + '/assets/profile-overlay/Special_Tier2.webp',
				preview: OVERLAY_URL + '/assets/profile-overlay/Special_Tier2_preview.webp',
				neededRoles: ['rankedteam', 'juniorrankedteam', 'creator', 'admin'],
			},
			{
				title: 'Tier 3',
				name: 'Special_Tier3',
				url: OVERLAY_URL + '/assets/profile-overlay/Special_Tier3.webp',
				preview: OVERLAY_URL + '/assets/profile-overlay/Special_Tier3_preview.webp',
				neededRoles: ['rankedteam', 'juniorrankedteam', 'creator', 'admin'],
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
