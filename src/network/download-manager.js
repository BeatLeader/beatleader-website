import eventBus from '../utils/broadcast-channel-pubsub';
import log from '../utils/logger';
import createQueue, {PRIORITY} from '../utils/queue';
import createBeatSaviorService from '../services/beatsavior';
// import createAccSaberService from '../services/accsaber';
import {PRIORITY as HTTP_QUEUE_PRIORITY} from './queues/http-queue';
import {HOUR, MINUTE} from '../utils/date';

const INTERVAL_TICK = MINUTE;

let initialized = false;
let beatSaviorService = null;
// let accSaberService = null;

const TYPES = {
	BEATSAVIOR: {name: 'BEATSAVIOR', priority: PRIORITY.LOW},
	ACCSABER: {name: 'ACCSABER', priority: PRIORITY.NORMAL},
};

const enqueue = async (queue, type, force = false, data = null, then = null) => {
	if (!type || !type.name || !Number.isFinite(type.priority)) {
		log.warn(`Unknown type enqueued.`, 'DlManager', type);

		return;
	}

	log.debug(`Try to enqueue type ${type.name}. Forced: ${force}, data: ${JSON.stringify(data)}`, 'DlManager');

	const priority = force ? PRIORITY.HIGHEST : type.priority;
	const networkPriority = priority === PRIORITY.HIGHEST ? HTTP_QUEUE_PRIORITY.BG_HIGH : HTTP_QUEUE_PRIORITY.BG_NORMAL;

	const processThen = async (promise, then = null) => {
		promise.then(result => {
			if (then) log.debug('Processing then command...', 'DlManager');

			return then ? {result, thenResult: then()} : result;
		});
	};

	switch (type) {
		case TYPES.BEATSAVIOR:
			log.debug(`Enqueue Beat Savior`, 'DlManager');

			processThen(
				queue.add(async () => beatSaviorService.refreshAll(force, networkPriority), priority),
				then
			).then(_ => log.debug('Enqueued Beat Savior processed.', 'DlManager'));

			break;

		// case TYPES.ACCSABER:
		// 	log.debug(`Enqueue AccSaber updates`, 'DlManager');

		// 	processThen(
		// 		queue.add(async () => accSaberService.refreshAll(), priority),
		// 		then
		// 	).then(_ => log.debug('Enqueued AccSaber updates processed.', 'DlManager'));

		// 	break;
	}
};

const enqueueAllJobs = async queue => {
	log.debug(`Try to enqueue & process queue.`, 'DlManager');

	await Promise.all([enqueue(queue, TYPES.BEATSAVIOR), enqueue(queue, TYPES.ACCSABER)]);
};

let intervalId;
const startSyncing = async queue => {
	await enqueueAllJobs(queue);
	intervalId = setInterval(() => enqueueAllJobs(queue), INTERVAL_TICK);
};

export default async () => {
	if (initialized) {
		log.debug(`Download manager already initialized.`, 'DlManager');

		return;
	}

	const queue = createQueue({
		concurrency: 2,
		timeout: HOUR * 2,
		throwOnTimeout: true,
	});

	beatSaviorService = createBeatSaviorService();
	// accSaberService = createAccSaberService();

	eventBus.leaderStore.subscribe(async isLeader => {
		if (isLeader) {
			queue.clear();
			queue.start();

			const nodeId = eventBus.getNodeId();
			log.info(`Node ${nodeId} is a leader, queue processing enabled`, 'DlManager');

			await startSyncing(queue);
		}
	});

	const pause = () => {
		log.debug('Pause Dl Manager', 'DlManager');

		queue.clear();
		queue.pause();
	};

	const start = () => {
		log.debug('Unpause Dl Manager', 'DlManager');

		queue.clear();
		queue.start();
	};

	if (eventBus.isLeader()) await startSyncing(queue);

	initialized = true;

	log.info(`Download manager initialized`, 'DlManager');

	return {
		start,
		pause,
	};
};
