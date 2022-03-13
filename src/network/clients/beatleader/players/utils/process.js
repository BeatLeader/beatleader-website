import queue from '../../../../queues/queues'

export default response => {

  if (!Array.isArray(response)) return null;

  return response.map(player => {
    let {avatar, country, countryRank, histories: history, id: playerId, name, pp, rank} = player;
    let difference = (history && history.length > 7 ? parseInt(history[history.length - 7]) - parseInt(history[history.length - 1]) : null);

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
        rankHistory: history && history.length
          ? history.split(',').map(r => parseInt(r, 10)).filter(r => !isNaN(r))
          : [],
      },
      others: {
        difference,
      },
    }
  });
};