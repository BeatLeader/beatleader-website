import queue from '../../../../queues/queues';

export default response => {
	if (!response?.metadata || !Array.isArray(response?.data)) return null;

	return {
		metadata: response.metadata,
		data: response.data.map(player => {
			let {avatar, country, countryRank, id: playerId, name, pp, rank, lastWeekRank, clans, profileSettings} = player;
			const difference = lastWeekRank > 0 ? lastWeekRank - rank : null;

			if (avatar && !avatar.startsWith('http')) {
				avatar = `${queue.BEATLEADER_API.BL_API_URL}${!avatar.startsWith('/') ? '/' : ''}${avatar}`;
			}

			return {
				playerId,
				name,
				playerInfo: {
					avatar,
					countries: [{country, rank: countryRank}],
					pp,
					rank,
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
