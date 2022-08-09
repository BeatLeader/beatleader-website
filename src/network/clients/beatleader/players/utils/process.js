import queue from '../../../../queues/queues'

export default response => {
  if (!response?.metadata || !Array.isArray(response?.data)) return null;

  return {
    metadata: response.metadata,
    data: response.data.map(player => {
      let { avatar, country, countryRank, histories: history, id: playerId, name, pp, rank, lastTwoWeeksTime, allTime, clans, scoreStats } = player;
      const rankHistory =
        history && history.length
          ? history.split(',').map(r => parseInt(r, 10)).filter(r => !isNaN(r))
          : []
      const difference = rankHistory.length > 1 ? rankHistory[rankHistory.length > 7 ? rankHistory.length - 7 : 0] - rank : null;

      if (avatar && !avatar.startsWith('http')) {
        avatar = `${queue.BEATLEADER_API.BL_API_URL}${!avatar.startsWith('/') ? '/' : ''}${avatar}`;
      }

      return {
        playerId,
        name,
        playerInfo: {
          avatar,
          countries: [{ country, rank: countryRank }],
          pp,
          lastTwoWeeksTime,
          allTime,
          rank,
          rankHistory,
        },
        others: {
          difference,
          improvement: scoreStats?.dailyImprovements
        },
        clans,
        scoreStats: player?.scoreStats ?? null
      }
    })
  };
};