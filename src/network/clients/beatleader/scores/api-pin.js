import queue, {getResponseBody} from '../../../queues/queues';

const update = async ({
	scoreId,
	pin = true,
	description = null,
	link = null,
	service = null,
	pinPriority = 1,
	priority = queue.PRIORITY.FG_HIGH,
	fullResponse = true,
	...queueOptions
} = {}) => {
	const response = await queue.BEATLEADER_API.pinScore(scoreId, pin, description, link, service, pinPriority, priority, queueOptions);

	return fullResponse ? response : getResponseBody(response);
};

const pin = async (scoreId, pinPriority = 1) => update({scoreId, pin: true, pinPriority});
const unpin = async scoreId => update({scoreId, pin: false});

const client = {
	update,
	pin,
	unpin,
};

export default client;
