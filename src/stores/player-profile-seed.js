let seed = null;

export const setPlayerSeed = player => {
	seed = player?.playerId ? player : null;
};

export const takePlayerSeed = playerIdOrAlias => {
	const current = seed;
	seed = null;

	if (!current || !playerIdOrAlias) return null;

	return current.playerId === playerIdOrAlias || current.alias === playerIdOrAlias ? current : null;
};

export const seedToProfileData = seedPlayer => {
	if (!seedPlayer?.playerId) return null;

	const info = seedPlayer.playerInfo ?? {};

	return {
		playerId: seedPlayer.playerId,
		name: seedPlayer.name,
		alias: seedPlayer.alias,
		role: info.role ?? '',
		playerInfo: {
			avatar: info.avatar,
			country: {country: info.country?.country, rank: info.country?.rank},
			pp: info.pp,
			rank: info.rank,
			lastWeekPp: info.lastWeekPp,
			lastWeekRank: info.lastWeekRank,
			lastWeekCountryRank: info.lastWeekCountryRank,
			role: info.role,
			sponsor: info.role?.includes('sponsor') ?? false,
			badges: null,
			socials: null,
			changes: null,
			clans: seedPlayer.clans ?? null,
			level: info.level,
			prestige: info.prestige,
			experience: info.experience,
		},
		profileSettings: seedPlayer.profileSettings ? {...seedPlayer.profileSettings, profileAppearance: null} : {profileAppearance: null},
		scoreStats: null,
		scores: null,
	};
};
