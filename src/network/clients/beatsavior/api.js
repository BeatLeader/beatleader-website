import queue from '../../queues/queues'
import {dateFromString} from '../../../utils/date'
import createClient from '../generic'

const SONG_DATA_TYPES = {
  None: 0,
  Pass: 1,
  Fail: 2,
  Practice: 3,
  Replay: 4,
  Campaign: 5
}

const process = response => {
  if (!response || !Array.isArray(response)) return null;

  return response
    .map(s => {
      let {
        _id: beatSaviorId,
        playerID: playerId,
        songDataType: type,
        songID: hash,
        songMapper: levelAuthorName,
        songName: name,
        songArtist: authorName,
        songDifficultyRank: difficulty,
        songDifficulty: diff,
        songJumpDistance: songJumpDistance,
        timeSet,
        trackers,
        trackers: {
          accuracyTracker: {accLeft, accRight, leftAverageCut, rightAverageCut, leftTimeDependence, rightTimeDependence, leftPreswing, leftPostswing, rightPreswing, rightPostswing},
          winTracker: {won, nbOfPause: pauses, rank},
          hitTracker: {bombHit, miss, missedNotes, badCuts, nbOfWallHit: wallHit, maxCombo},
          scoreTracker: {score},
        },
      } = s;

      if (![SONG_DATA_TYPES.Pass, SONG_DATA_TYPES.Fail, SONG_DATA_TYPES.Campaign].includes(type)) return null;

      const leaderboardId = null;

      hash = hash ? hash.toLowerCase() : null;

      if (!playerId || !playerId.length || !hash || !hash.length || !diff || !diff.length || !score) return null;

      const song = {hash, name, subName: '', authorName, levelAuthorName};
      const leaderboard = {
        leaderboardId,
        difficulty,
        diffInfo: {diff: diff === 'expertplus' ? 'expertPlus' : diff, type: 'Standard'},
        song,
      }

      const stats = {
        won,
        pauses,
        rank,
        miss,
        missedNotes,
        badCuts,
        bombHit,
        wallHit,
        maxCombo,
        accLeft, accRight, leftAverageCut, rightAverageCut, leftTimeDependence, rightTimeDependence,
        leftPreswing, leftPostswing, rightPreswing, rightPostswing,
      }

      return {
        beatSaviorId,
        playerId,
        leaderboardId,
        scoreId: null,
        hash,
        songJumpDistance,
        diff: diff === 'expertplus' ? 'expertPlus' : diff,
        score,
        type,
        leaderboard,
        timeSet: dateFromString(timeSet),
        stats,
        trackers,
      }

    })
    .filter(s => s);
};

const get = async ({playerId, priority = queue.PRIORITY.FG_HIGH, ...queueOptions} = {}) => queue.BEATSAVIOR.player(playerId, priority, queueOptions);

const client = createClient(get, process);

export default {
  ...client,
  SONG_DATA_TYPES
};