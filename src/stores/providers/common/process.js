import {dateFromString} from '../../../utils/date'
import {extractDiffAndType} from '../../../scoresaber/format'

export default response => {
  if (!response?.scores) return [];

  return response.scores.map(s => {
    const {
      songHash: hash,
      songName: name,
      songSubName: subName,
      songAuthorName: authorName,
      levelAuthorName,
      difficultyRaw,
      ...score
    } = s;

    const song = {hash, name, subName, authorName, levelAuthorName};

    const diffInfo = extractDiffAndType(difficultyRaw);

    return {...score, song, diffInfo, timeSet: dateFromString(s.timeSet)};
  });
}