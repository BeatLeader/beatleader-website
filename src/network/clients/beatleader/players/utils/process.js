import queue from '../../../../queues/queues';

export default response => {
	if (!response?.metadata || !Array.isArray(response?.data)) return null;

	return {
		metadata: response.metadata,
		data: response.data.map(player => {
			let {
				avatar,
				country,
				countryRank,
				id: playerId,
				alias,
				name,
				pp,
				accPp,
				techPp,
				passPp,
				rank,
				lastWeekPp,
				lastWeekRank,
				lastWeekCountryRank,
				clans,
				profileSettings,
				role,
			} = player;
			const difference = lastWeekRank > 0 ? lastWeekRank - rank : null;

			if (avatar && !avatar.startsWith('http')) {
				avatar = `${queue.BEATLEADER_API.BL_API_URL}${!avatar.startsWith('/') ? '/' : ''}${avatar}`;
			}

			return {
				playerId,
				name,
				alias,
				playerInfo: {
					avatar,
					countries: [{country, rank: countryRank, lastWeekCountryRank}],
					pp,
					accPp,
					techPp,
					passPp,
					rank,
					lastWeekPp,
					lastWeekRank,
					lastWeekCountryRank,
					role,
				},
				others: {
					difference,
				},
				clans,
				scoreStats: player?.scoreStats ?? null,
				profileSettings: profileSettings ?? null,
			};
		}),
	};
};
