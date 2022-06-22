import queue from '../../../queues/queues'
import createClient from '../../generic'
import processPlayer from '../player/process'

const process = response => {
	const friends = response?.friends?.map(f => processPlayer(f)) ?? [];

	return {
		...response,
		friends,
		player: processPlayer(response?.player)
	}
}

const get = async ({priority = queue.PRIORITY.FG_HIGH, ...queueOptions} = {}) => queue.BEATLEADER_API.user(priority, queueOptions);

const client = createClient(get, process);

export default client;
