import {writable} from 'svelte/store';
import {BL_API_URL} from '../../network/queues/beatleader/api-queue';

export const DELETION_REASONS = [
	{id: 'Cheating', label: 'Cheating', iconFa: 'fas fa-user-secret'},
	{id: 'BrokenReplay', label: 'Broken replay', iconFa: 'fas fa-file-circle-xmark'},
	{id: 'Bug', label: 'Bug', iconFa: 'fas fa-bug'},
	{id: 'AccountSharing', label: 'Account sharing', iconFa: 'fas fa-user-group'},
	{id: 'WrongMap', label: 'Wrong map', iconFa: 'fas fa-map'},
	{id: 'PlayerRequest', label: 'Player request', iconFa: 'fas fa-hand'},
	{id: 'SimulationMismatch', label: 'Simulation mismatch', iconFa: 'fas fa-robot'},
	{id: 'Other', label: 'Other', iconFa: 'fas fa-ellipsis'},
];

export function reasonLabel(id) {
	return DELETION_REASONS.find(r => r.id === id)?.label ?? id ?? 'Unknown';
}

export function reasonIcon(id) {
	return DELETION_REASONS.find(r => r.id === id)?.iconFa ?? 'fas fa-circle-question';
}

export const markedScores = writable(new Map());

function setMarked(scoreIds, reason) {
	markedScores.update(map => {
		const next = new Map(map);
		scoreIds.forEach(id => (reason ? next.set(id, reason) : next.delete(id)));
		return next;
	});
}

async function request(path, method = 'GET', body = null) {
	const response = await fetch(BL_API_URL + path, {
		method,
		credentials: 'include',
		headers: body ? {'Content-Type': 'application/json'} : undefined,
		body: body ? JSON.stringify(body) : undefined,
	});
	if (!response.ok) {
		const text = await response.text();
		throw new Error(text?.length ? text.replace(/^"|"$/g, '') : `Request failed (${response.status})`);
	}
	const text = await response.text();
	return text?.length ? JSON.parse(text) : null;
}

function query(params) {
	const search = new URLSearchParams();
	Object.entries(params).forEach(([key, value]) => {
		if (value !== null && value !== undefined && value !== '') search.set(key, value);
	});
	return search.toString();
}

export const fetchMarks = ({page = 1, count = 50, reason = null, search = null} = {}) =>
	request(`admin/scoredeletions?${query({page, count, reason, search})}`);

export const fetchHistory = ({page = 1, count = 50, reason = null, search = null} = {}) =>
	request(`admin/scoredeletions/history?${query({page, count, reason, search})}`);

export async function fetchScoreStatus(scoreId) {
	const status = await request(`admin/scoredeletions/score/${scoreId}`);
	setMarked([scoreId], status?.mark?.reason ?? null);
	return status;
}

export async function markScores(scoreIds, reason, comment) {
	const result = await request('admin/scoredeletions/mark', 'POST', {scoreIds, reason, comment});
	setMarked(
		scoreIds.filter(id => !result.missing.includes(id)),
		reason
	);
	return result;
}

export async function unmarkScores(scoreIds) {
	const result = await request('admin/scoredeletions/unmark', 'POST', {scoreIds});
	setMarked(scoreIds, null);
	return result;
}

export async function deleteMarked({scoreIds = null, all = false, reason = null}) {
	const result = await request('admin/scoredeletions/execute', 'POST', {scoreIds, all, reason});
	if (scoreIds) setMarked(scoreIds, null);
	return result;
}

export const restoreScore = id => request(`admin/scoredeletions/restore?id=${id}`, 'POST');

export const simulateScore = id => request(`admin/simulator/score/${id}`);

export function describeSimulation(result) {
	const accuracy = score => ((score * 100) / Math.max(result.maxScore, 1)).toFixed(2);
	const sign = result.accuracyDifference >= 0 ? '+' : '';
	return (
		`Simulated on the ${result.build} build: the replay's movements give ${result.simulatedScore.toLocaleString('en-US')} (${accuracy(result.simulatedScore)}%), ` +
		`its notes claim ${result.recordedScore.toLocaleString('en-US')} (${accuracy(result.recordedScore)}%), ` +
		`${sign}${result.accuracyDifference.toFixed(2)}%. ${result.mismatchedNotes} of ${result.notes} notes scored differently.`
	);
}

export function parseScoreIds(text) {
	const ids = new Set();
	(text ?? '').split(/[\s,;]+/).forEach(token => {
		if (!token) return;
		const match = /^\d+$/.test(token) ? token : token.match(/(?:\/score\/|[?&]scoreId=)(\d+)/)?.[1];
		const id = match ? parseInt(match, 10) : NaN;
		if (Number.isFinite(id) && id > 0) ids.add(id);
	});
	return [...ids];
}
