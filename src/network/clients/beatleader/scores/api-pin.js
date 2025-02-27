import queue, {getResponseBody} from '../../../queues/queues';

const update = async ({
	scoreId,
	attempt = false,
	pin = true,
	description = null,
	link = null,
	service = null,
	pinPriority = 0,
	priority = queue.PRIORITY.FG_HIGH,
	fullResponse = true,
	...queueOptions
} = {}) => {
	const response = await queue.BEATLEADER_API.pinScore(
		scoreId,
		attempt,
		pin,
		description,
		link,
		service,
		pinPriority,
		priority,
		queueOptions
	);

	return fullResponse ? response : getResponseBody(response);
};

const pin = async (scoreId, attempt = false, pinPriority = 0) => update({scoreId, attempt, pin: true, pinPriority});
const unpin = async (scoreId, attempt = false) => update({scoreId, attempt, pin: false});

const client = {
	update,
	pin,
	unpin,
};

export default client;
