import {capitalize} from '../js'

export function findDiffInfoWithDiffAndTypeFromBeatMaps(diffs, diffAndType) {
  return !diffs || !Array.isArray(diffs) || !diffAndType || !diffAndType.type || !diffAndType.diff
    ? null
    : diffs.find(diff => diff.characteristic === diffAndType.type && diff.difficulty === capitalize(diffAndType.diff));
}

