import createTwitchService from '../../../../services/twitch'
import {findDiffInfoWithDiffAndTypeFromBeatMaps} from '../../../../utils/scoresaber/song'
import {opt} from '../../../../utils/js'

let twitchService;

export default async (data, playerId = null) => {
  if (!data || !data.score || !data.leaderboard || !data.leaderboard.beatMaps) return;

  const bmStats = findDiffInfoWithDiffAndTypeFromBeatMaps(opt(data.leaderboard.beatMaps, 'versions.0.diffs'), data.leaderboard.diffInfo);
  if (!bmStats || !bmStats.seconds) return;

  if (!twitchService) twitchService = createTwitchService();

  const twitchProfile = await twitchService.refresh(playerId);
  if (!twitchProfile) return;

  const video = await twitchService.findTwitchVideo(twitchProfile, data.score.timeSet, bmStats.seconds);
  if (!video || !video.url) return;

  data.twitchVideo = video;
}