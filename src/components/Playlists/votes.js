import {readable} from 'svelte/store';

export const VOTE_CONTEXT = 'playlist-vote';
export const NO_VOTE = readable(null);

export const RESULTS_LABELS = {
	always: 'Results are visible all along',
	voted: 'Results show once you vote',
	ended: 'Results show when the vote ends',
};

export function timeLeft(endsAt, now = Date.now()) {
	const secs = Math.max(0, Math.round(endsAt - now / 1000));
	const days = Math.floor(secs / 86400);
	const hours = Math.floor((secs % 86400) / 3600);
	const minutes = Math.floor((secs % 3600) / 60);
	if (days > 0) return hours ? `${days}d ${hours}h` : `${days}d`;
	if (hours > 0) return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
	if (minutes > 0) return `${minutes}m`;
	return `${secs}s`;
}

export const votePercent = (votes, voterCount) => (voterCount > 0 ? Math.round((votes / voterCount) * 100) : 0);
