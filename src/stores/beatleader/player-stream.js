import {writable} from 'svelte/store';

const STREAM_URL = 'wss://sockets.api.beatleader.com/stream/player/listen';
const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_DELAY = 30000;

export default function createPlayerStreamStore() {
	let socket = null;
	let playerId = null;
	let reconnectTimer = null;
	let reconnectDelay = RECONNECT_DELAY;
	let intentionalClose = false;

	const {subscribe, set, update} = writable({
		connected: false,
		status: null,
		map: null,
		context: null,
		event: null,
		events: [],
	});

	function connect(pid) {
		if (socket) disconnect();

		playerId = pid;
		intentionalClose = false;

		try {
			socket = new WebSocket(STREAM_URL);
		} catch {
			scheduleReconnect();
			return;
		}

		socket.addEventListener('open', () => {
			reconnectDelay = RECONNECT_DELAY;

			socket.send(JSON.stringify({action: 'status', playerId}));

			update(s => ({...s, connected: true}));
		});

		socket.addEventListener('message', e => {
			try {
				const msg = JSON.parse(e.data);
				handleMessage(msg);
			} catch {}
		});

		socket.addEventListener('close', () => {
			update(s => ({...s, connected: false}));
			socket = null;
			if (!intentionalClose) scheduleReconnect();
		});

		socket.addEventListener('error', () => {
			socket?.close();
		});
	}

	function handleMessage(msg) {
		update(state => {
			const next = {...state};

			next.status = msg.Status;

			if (msg.Status === 'startedMap' && msg.Context?.Map) {
				next.map = msg.Context.Map;
				next.context = {
					Time: msg.Context.Time,
					Accuracy: msg.Context.Accuracy,
					Pp: msg.Context.Pp,
					Score: msg.Context.Score,
				};
				next.events = [];
				next.event = null;
			} else if (msg.Status === 'playing' && msg.Context) {
				next.context = {
					...state.context,
					Time: msg.Context.Time,
					Accuracy: msg.Context.Accuracy,
					Pp: msg.Context.Pp,
					Score: msg.Context.Score,
				};
			}

			if (msg.Event) {
				const ev = {
					...msg.Event,
					id: Date.now() + Math.random(),
				};
				next.event = ev;
				next.events = [...(state.events ?? []).slice(-49), ev];
			}

			return next;
		});
	}

	function scheduleReconnect() {
		if (reconnectTimer) clearTimeout(reconnectTimer);

		reconnectTimer = setTimeout(() => {
			reconnectTimer = null;
			if (playerId) connect(playerId);
		}, reconnectDelay);

		reconnectDelay = Math.min(reconnectDelay * 1.5, MAX_RECONNECT_DELAY);
	}

	function disconnect() {
		intentionalClose = true;
		if (reconnectTimer) {
			clearTimeout(reconnectTimer);
			reconnectTimer = null;
		}
		if (socket) {
			socket.close();
			socket = null;
		}
		set({
			connected: false,
			status: null,
			map: null,
			context: null,
			event: null,
			events: [],
		});
	}

	return {
		subscribe,
		connect,
		disconnect,
	};
}
