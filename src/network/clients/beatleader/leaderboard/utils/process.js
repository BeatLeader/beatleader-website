export const processLeaderboardScore = s => {
	if (!s) return null;

	let { unmodififiedScore: unmodifiedScore, mods, ...score } = s.score;

	if (mods && typeof mods === 'string') mods = mods.split(',').map(m => m.trim().toUpperCase()).filter(m => m.length);
	else if (!mods) mods = null;


	const ppWeighted = score?.pp && score?.weight ? score.pp * score.weight : null;

	return {
		...s,
		score: { ...score, unmodifiedScore: unmodifiedScore || null, mods, ppWeighted },
	};
}

export const process = response => {
	if (!response?.scores || !Array.isArray(response.scores)) return null;

	const scores = response.scores.map(processLeaderboardScore);

	return {
		...response,
		scores,
	}
}