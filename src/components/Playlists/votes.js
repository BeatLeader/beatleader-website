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

const csvCell = value => {
	const text = value == null ? '' : String(value);
	return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

const difficultyLabel = (name, mode) => (name ? `${name.charAt(0).toUpperCase()}${name.slice(1)}${mode && mode !== 'Standard' ? ` (${mode})` : ''}` : '');

// One row per option, most votes first; tied options share a rank
export function voteCsv(vote, replays, origin) {
	const options = [...(vote.options ?? [])].sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0) || a.position - b.position);
	const rank = option => 1 + options.filter(o => (o.votes ?? 0) > (option.votes ?? 0)).length;
	const leaderboardUrl = option => (option.leaderboardId ? `${origin}/leaderboard/global/${option.leaderboardId}` : '');

	const header = replays
		? ['Rank', 'Votes', 'Percent of voters', 'Player', 'Song', 'Difficulty', 'Replay type', 'Link', 'Note']
		: ['Rank', 'Votes', 'Percent of voters', 'Song', 'Mapper', 'Difficulties', 'Hash', 'Key', 'Link', 'Note'];
	const rows = options.map(option => {
		const counts = [rank(option), option.votes, option.votes != null ? `${votePercent(option.votes, vote.voterCount)}%` : ''];
		return replays
			? [
					...counts,
					option.playerName,
					option.songName,
					difficultyLabel(option.difficultyName, option.modeName),
					option.replayType,
					option.replayType === 'score' && option.replayId ? `${origin}/score/${option.replayId}` : leaderboardUrl(option),
					option.description,
				]
			: [
					...counts,
					option.songName,
					option.mapper,
					(option.difficulties ?? []).map(d => difficultyLabel(d.name, d.characteristic)).join(', '),
					option.hash,
					option.key,
					leaderboardUrl(option),
					option.description,
				];
	});
	return [header, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n');
}
