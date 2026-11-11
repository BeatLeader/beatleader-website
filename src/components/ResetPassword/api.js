import {writable} from 'svelte/store';
import {BL_API_URL} from '../../network/queues/beatleader/api-queue';

const TOKEN_KEY = 'bl-reset-token';

export const OAUTH_URL = BL_API_URL + 'passwordreset/oauth';
export const DISCORD_INVITE = 'https://discord.gg/2RG5YVqtG6';
export const DISCORD_HELP_CHANNEL = 'https://discord.com/channels/921820046345523311/951919251227295844';
export const PLATFORM_NAMES = {steam: 'Steam', oculus: 'Quest', oculuspc: 'Oculus PC', beatsaver: 'BeatSaver'};

export const session = writable(null);
export const notice = writable(null);

export function getToken() {
	try {
		return localStorage.getItem(TOKEN_KEY);
	} catch {
		return null;
	}
}

export function setToken(token) {
	try {
		if (token) localStorage.setItem(TOKEN_KEY, token);
		else localStorage.removeItem(TOKEN_KEY);
	} catch {}
}

async function request(path, {method = 'GET', body = null, headers = {}} = {}) {
	const token = getToken();
	let response;
	try {
		response = await fetch(BL_API_URL + path, {
			method,
			body,
			credentials: 'include',
			headers: token ? {...headers, 'X-Reset-Token': token} : headers,
		});
	} catch {
		throw new Error('Could not reach the server, check your connection');
	}

	const text = await response.text();
	if (!response.ok) {
		// Proxy error pages are HTML
		const message =
			text.length && text.length < 300 && !text.startsWith('<') ? text.replace(/^"|"$/g, '') : 'Something went wrong, try again later';
		throw Object.assign(new Error(message), {status: response.status});
	}
	return text.length ? JSON.parse(text) : null;
}

async function update(path, options) {
	try {
		const result = await request(path, options);
		if (result.token) setToken(result.token);
		session.set(result);
		notice.set(null);
		return result;
	} catch (e) {
		if (e.status == 410) startOver(e.message);
		throw e;
	}
}

export function startOver(message = null) {
	setToken(null);
	session.set(null);
	notice.set(message);
}

const POST = {method: 'POST'};
const json = value => ({method: 'POST', body: JSON.stringify(value), headers: {'Content-Type': 'application/json'}});

function form(fields) {
	const body = new FormData();
	Object.entries(fields).forEach(([key, value]) => body.append(key, value));
	return {method: 'POST', body};
}

export const searchPlayers = search => request('passwordreset/players?search=' + encodeURIComponent(search));
export const searchMaps = search => request('passwordreset/maps?search=' + encodeURIComponent(search));
export const pickReplays = files => request('passwordreset/replays', json(files));

export const start = playerId => update('passwordreset/start?playerId=' + encodeURIComponent(playerId), POST);
export const getSession = () => update('passwordreset/session');
export const adopt = () => update('passwordreset/adopt', POST);
export const checkLogin = login => update('passwordreset/login', form({login}));
export const declareLoggedOut = () => update('passwordreset/loggedout', POST);
export const runCheck = () => update('passwordreset/check', POST);
export const checkHint = hint => update('passwordreset/hint', form({hint}));
export const startChallenge = songId => update('passwordreset/challenge?songId=' + encodeURIComponent(songId), POST);
export const checkReplay = bytes =>
	update('passwordreset/replay', {method: 'POST', body: bytes, headers: {'Content-Type': 'application/octet-stream'}});
export const complete = password => update('passwordreset/complete', form({password}));
export const sendRequest = fields => update('passwordreset/request', json(fields));

export async function copyContinueLink() {
	try {
		await navigator.clipboard.writeText(`${location.origin}/reset-password?token=${getToken() ?? ''}`);
		return true;
	} catch {
		return false;
	}
}
