export default async (data) => {
    if (!data || !data.leaderboard) return data;

    data.leaderboard.beatSaver = {test: 'BEAT SAVER ENHANCER'}

    return data;
}