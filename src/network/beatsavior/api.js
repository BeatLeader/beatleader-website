import queue from '../queues'
import {dateFromString} from '../../utils/date'

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
        timeSet,
        trackers,
        trackers: {
          accuracyTracker: {accLeft, accRight, leftAverageCut, rightAverageCut, leftTimeDependence, rightTimeDependence},
          winTracker: {won, nbOfPause: pauses, rank},
          hitTracker: {miss, missedNotes, badCuts, nbOfWallHit: wallHit, maxCombo},
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
        wallHit,
        maxCombo,
        accLeft, accRight, leftAverageCut, rightAverageCut, leftTimeDependence, rightTimeDependence
      }

      return {
        beatSaviorId,
        playerId,
        leaderboardId,
        scoreId: null,
        hash,
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

const get = async ({playerId, priority = queue.PRIORITY.FG_HIGH, signal = null} = {}) => queue.BEATSAVIOR.player(playerId, signal, priority);

export default {
  get,
  process,
  getProcessed: async ({playerId, priority = queue.PRIORITY.FG_HIGH, signal = null} = {}) => process(await get({playerId, priority, signal})),
  SONG_DATA_TYPES
}