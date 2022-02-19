import queue from '../../../queues/queues'
import createClient from '../../generic'

const process = response => {

    if (!response.response.games) return null;

    let games = response.response.games;
    let beatSaber = games.find(game => game.appid == 620980);
    if (!beatSaber) return null;
    
    return {lastTwoWeeks: (beatSaber.playtime_2weeks / 60).toFixed(2), allTime: (beatSaber.playtime_forever / 60).toFixed(2)};
  }

const get = async ({playerId, priority = queue.PRIORITY.FG_HIGH, ...queueOptions} = {}) => queue.BEATLEADER_API.gameInfo(playerId, priority, queueOptions);

const client = createClient(get, process);

export default client;