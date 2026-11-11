import {writable} from 'svelte/store';
import {BL_API_URL} from '../../network/queues/beatleader/api-queue';
import process from '../../network/clients/beatleader/scores/utils/process';

export const FAILED_SCORES_PER_PAGE = 20;

let store = null;
let storeSubCount = 0;
export default (refreshOnCreate = true) => {
	storeSubCount++;
	if (store) return store;

	let totalScores = {};
	let currentPage = 1;
	let currentFilters = {};

	const get = () => totalScores;
	const {subscribe: subscribeState, set} = writable(totalScores);

	const update = changes => {
		totalScores = {...totalScores, ...changes};
		set(totalScores);
	};

	async function readError(response) {
		const text = await response.text();
		return text?.length ? text.replace(/^"|"$/g, '') : `Request failed (${response.status})`;
	}

	const fetchScores = async (page = currentPage, filters = currentFilters) => {
		currentPage = page;
		currentFilters = filters;

		const params = new URLSearchParams({
			page,
			count: FAILED_SCORES_PER_PAGE,
			sortBy: filters.sortBy ?? 'date',
			order: filters.order ?? 'desc',
		});
		if (filters.type && filters.type != 'all') params.set('type', filters.type);
		const search = filters.search?.trim();
		if (search?.length) params.set('search', search);

		update({loading: true, error: null});
		try {
			const response = await fetch(`${BL_API_URL}user/failedscores?${params}`, {credentials: 'include'});
			if (!response.ok) throw new Error(await readError(response));

			const data = await response.json();
			if (page != currentPage || filters != currentFilters) return;

			const processed = process(data);
			update({
				scores: processed.data,
				metadata: processed.metadata,
				groups: data.groups ?? [],
				playerCounts: data.playerCounts ?? {},
				loading: false,
			});
		} catch (e) {
			update({loading: false, error: e.message});
		}
	};

	const removeFromList = id => update({scores: (totalScores.scores ?? []).filter(s => s.score.id != id)});

	const deleteScore = async id => {
		removeFromList(id);

		await fetch(BL_API_URL + 'user/failedscore/remove?id=' + id, {credentials: 'include', method: 'POST'});
		fetchScores();
	};

	const retryScore = async (id, allow = false) => {
		const score = totalScores.scores?.find(s => s.score.id == id);
		removeFromList(id);

		let result;
		try {
			const response = await fetch(BL_API_URL + `user/failedscore/retry?id=${id}&allow=${allow}`, {credentials: 'include', method: 'POST'});
			if (response.ok) {
				const upload = await response.json();
				result = {ok: upload?.status == 1 || upload?.status == 2, text: upload?.description};
			} else {
				result = {ok: false, text: await readError(response)};
			}
		} catch (e) {
			result = {ok: false, text: e.message};
		}

		const name = score?.leaderboard?.song?.name ?? 'Score';
		update({notice: {...result, text: `${allow ? 'Allowed' : 'Retried'} ${name}${result.text ? ': ' + result.text : ''}`}});
		fetchScores();
	};

	const clearNotice = () => update({notice: null});

	const refresh = async () => fetchScores(1);

	const subscribe = fn => {
		const stateUnsubscribe = subscribeState(fn);

		return () => {
			storeSubCount--;

			if (storeSubCount === 0) {
				store = null;

				stateUnsubscribe();
			}
		};
	};

	store = {
		subscribe,
		get,
		refresh,
		deleteScore,
		retryScore,
		clearNotice,
		fetchScores,
	};

	return store;
};
