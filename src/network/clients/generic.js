import queue, {getResponseBody, isResponseCached, updateResponseBody} from '../queues/queues';

export default (get, process) => {
	const clientGet = async ({priority = queue.PRIORITY.FG_LOW, fullResponse = false, ...getOptions} = {}) => {
		const response = await get({...getOptions, priority});

		return fullResponse ? response : getResponseBody(response);
	};

	const clientGetProcessed = async ({priority = queue.PRIORITY.FG_LOW, fullResponse = false, ...getOptions} = {}) => {
		const response = await clientGet({...getOptions, priority, fullResponse});

		const processedResponse = process(fullResponse ? getResponseBody(response) : response);

		return fullResponse ? updateResponseBody(response, processedResponse) : processedResponse;
	};

	return {
		get: clientGet,
		process,
		getProcessed: clientGetProcessed,
		getDataFromResponse: getResponseBody,
		isResponseCached,
	};
};
