import {capitalize, opt} from '../js'

export const diffColors = {
  easy: 'MediumSeaGreen',
  normal: '#59b0f4',
  hard: 'tomato',
  expert: '#bf2a42',
  expertPlus: '#8f48db',
  expertplus: '#8f48db',
}

export function getDiffColor(diffInfo) {
  return diffColors[diffInfo.diff.toLowerCase()] ? diffColors[diffInfo.diff.toLowerCase()] : null;
}

export function extractDiffAndType(ssDiff) {
  const match = /^_([^_]+)_Solo(.*)$/.exec(ssDiff);
  if (!match) return null;

  return {
    diff: match[1],
    type: opt(match, '2', 'Standard'),
  };
}
export function getHumanDiffInfo(diffInfo) {
  if (!diffInfo || !diffInfo.diff) return null;

  const name = diffInfo.diff;
  const typeSuffix = diffInfo.type !== 'Standard' ? '/' + diffInfo.type : '';

  switch(name) {
    case 'Easy':
    case 'easy':
      return {name, type: diffInfo.type, fullName: name + typeSuffix, shortName: 'Es', difficulty: 1, color: getDiffColor(diffInfo)};
    case 'Normal':
    case 'normal':
      return {name, type: diffInfo.type, fullName: name + typeSuffix, shortName: 'N', difficulty: 3, color: getDiffColor(diffInfo)};
    case 'Hard':
    case 'hard':
      return {name, type: diffInfo.type, fullName: name + typeSuffix, shortName: 'H', difficulty: 5, color: getDiffColor(diffInfo)};
    case 'Expert':
    case 'expert':
      return {name, type: diffInfo.type, fullName: name + typeSuffix, shortName: 'Ex', difficulty: 7, color: getDiffColor(diffInfo)};
    case 'ExpertPlus':
    case 'expertPlus':
      return {name, type: diffInfo.type, fullName: name + typeSuffix, shortName: 'E+', difficulty: 9, color: getDiffColor(diffInfo)};

    default: return null;
  }
}