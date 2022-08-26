import PQueue from 'p-queue';
import EventEmitter from 'eventemitter3';
import {TimeoutError} from 'p-timeout';
import {SsrTimeoutError} from '../others/errors';

export const PRIORITY = {
	HIGHEST: 4,
	HIGH: 3,
	NORMAL: 2,
	LOW: 1,
	LOWEST: 0,
};

const defaultOptions = {
	concurrency: 4,
	timeout: 60000,
	throwOnTimeout: true,
};

export default (options = defaultOptions) => {
	const queue = new PQueue({...defaultOptions, ...options});
	const emitter = new EventEmitter();

	const add = async (fn, priority = PRIORITY.HIGHEST) =>
		queue.add(fn, {priority}).catch(err => {
			if (err instanceof TimeoutError) throw new SsrTimeoutError(queue.timeout, err.message);

			throw err;
		});
	const start = () => queue.start();
	const pause = () => queue.pause();
	const isPaused = () => queue.isPaused;
	const clear = () => queue.clear();
	const size = () => queue.size;
	const sizeByPriority = (priority = PRIORITY.HIGHEST) => queue.sizeBy({priority});
	const pending = () => queue.pending;

	const on = (event, fn, context) => emitter.on(event, fn, context);
	const once = (event, fn, context) => emitter.once(event, fn, context);
	const removeListener = (event, fn, context) => emitter.removeListener(event, fn, context);

	let windowNum = 0,
		windowCnt = 0;
	queue.on('add', () => {
		emitter.emit('change', {size: queue.size, pending: queue.pending});

		windowCnt++;

		if (windowCnt > 0) emitter.emit('progress', {progress: windowNum / windowCnt, num: windowNum, count: windowCnt});
	});

	queue.on('active', () => {
		// Note: emited when job is taken from queue but not yet added to pending, so we have to increase pending count
		emitter.emit('change', {size: queue.size, pending: queue.pending + 1});
	});

	queue.on('next', () => {
		emitter.emit('change', {size: queue.size, pending: queue.pending});

		if (windowCnt > 0) {
			windowNum++;
			emitter.emit('progress', {progress: windowNum / windowCnt, num: windowNum, count: windowCnt});
		}
	});

	queue.on('idle', () => {
		emitter.emit('progress', {progress: 1, num: windowCnt, count: windowCnt});

		windowNum = 0;
		windowCnt = 0;
	});

	return {
		add,
		start,
		pause,
		isPaused,
		clear,
		size,
		sizeByPriority,
		pending,
		on,
		once,
		removeListener,
		emitter,
	};
};
