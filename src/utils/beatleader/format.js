import {capitalize, opt} from '../js'

export const diffColors = {
  easy: 'MediumSeaGreen',
  normal: '#59b0f4',
  hard: 'tomato',
  expert: '#bf2a42',
  expertPlus: '#8f48db',
  expertplus: '#8f48db',
}

const diffTypes = [
  "horizontalstandard",
  "inversestandard",
  "invertedstandard",
  "verticalstandard",
  "standard",
  "90degree",
  "360degree",
  "noarrows",
  "onesaber",
  "lightshow",
  "lawless"
]

const diffDescriptions = {
  "horizontalstandard": "Horisontal Standard (Chirality mod)",
  "inversestandard": "Inverse Standard (Chirality mod)",
  "invertedstandard": "Inverted Standard (Chirality mod)",
  "verticalstandard": "Vertical Standard (Chirality mod)",
  "standard": "Standard",
  "90degree": "90 Degree",
  "360degree": "360 Degree",
  "noarrows": "No Arrows",
  "onesaber": "One Saber",
  "lightshow": "Light Show",
  "lawless": "Lawless"
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

export function getIconNameForDiff(diffInfo) {
  for (var i = 0; i < diffTypes.length; i++) {
    const diffType = diffTypes[i];
    if (diffInfo.type.toLowerCase().includes(diffType)) {
      if (diffType == "360degree") {
        return "degree360-icon"
      } else if (diffType == "90degree") {
        return "degree90-icon"
      } else {
        return diffType + "-icon"
      }
    }
  }
  return "standard-icon"
}

export function getDescriptionForDiff(diffInfo) {
  return diffDescriptions[diffInfo.type.toLowerCase()] ?? "Standard";
}

const HMDs = {
  0: {name: 'Unknown headset', icon: 'unknown', color: 'invert(70%) sepia(65%) saturate(4492%) hue-rotate(354deg) brightness(96%) contrast(91%)'},
  1: {name: 'Oculus Rift CV1', icon: 'oculus', color: 'invert(99%) sepia(3%) saturate(82%) hue-rotate(58deg) brightness(118%) contrast(100%)'},
  2: {name: 'Vive', icon: 'vive', color: 'invert(54%) sepia(78%) saturate(2598%) hue-rotate(157deg) brightness(97%) contrast(101%)'},
  4: {name: 'Vive Pro', icon: 'vive', color: 'invert(99%) sepia(3%) saturate(82%) hue-rotate(58deg) brightness(118%) contrast(100%)'},
  8: {name: 'Windows Mixed Reality', icon: 'wmr', color: 'invert(34%) sepia(67%) saturate(7482%) hue-rotate(193deg) brightness(103%) contrast(101%)'},
  16: {name: 'Rift S', icon: 'oculus', color: 'invert(96%) sepia(9%) saturate(5456%) hue-rotate(170deg) brightness(100%) contrast(107%)'},
  32: {name: 'Oculus Quest', icon: 'oculus', color: 'invert(73%) sepia(55%) saturate(5479%) hue-rotate(271deg) brightness(106%) contrast(107%)'},
  64: {name: 'Valve Index', icon: 'index', color: 'invert(81%) sepia(27%) saturate(6288%) hue-rotate(344deg) brightness(103%) contrast(103%)'},
  128: {name: 'Vive Cosmos', icon: 'vive', color: 'invert(11%) sepia(100%) saturate(7426%) hue-rotate(297deg) brightness(85%) contrast(109%)'},
  256: {name: 'Oculus Quest 2', icon: 'oculus', color: 'invert(69%) sepia(52%) saturate(501%) hue-rotate(107deg) brightness(98%) contrast(86%)'}
};

export function getHeadsetForHMD(hmd) {
  return HMDs[hmd];
}

export function userDescriptionForModifier(modifier) {
  switch (modifier) {
    case "DA": return "Dissapearing arrows";
    case "FS": return "Faster song";
    case "SS": return "Slower song";
    case "SF": return "Super fast song";
    case "GN": return "Ghost notes";
    case "NA": return "No arrows";
    case "NB": return "No bombs";
    case "NF": return "No fail";
    case "NO": return "No obstacles";
  }
  return "Undefined modifier";
}

export const votingTypes = ['acc', 'tech', 'midspeed', 'speed',]
export const typesMap = {
  'acc': 1,
  'tech': 2,
  'midspeed': 4,
  'speed': 8,
}

export function mapTypeFromMask(type) {
  let result = "";
  Object.keys(typesMap).forEach(key => {
    const mask = typesMap[key];
    if ((type & mask) === mask) {
      result += key + ", ";
    }
  })
  return result.length ? result.substring(0, result.length - 2) : null;
}

export function votingsForTypeStats(stats) {

  let result = "";
  stats.forEach((element, i) => {
    if (element > 0) {
      result += votingTypes[i] + "  " + element + ", ";
    }
  });
  return result.length ? result.substring(0, result.length - 2) : null;
}

export function describeModifiersAndMultipliers(modifiers, multipliers) {
  if (modifiers && multipliers) {
    let result = "Mods:";
    let total = 0;
    modifiers.forEach(key => {
      const value = multipliers[key];
      total += value;
      result += "\n" + userDescriptionForModifier(key) + (value > 0 ? " +" : " ") + Math.round(value * 100) + "%";
    });
    if (modifiers.length > 1) {
      result += "\nTotal:" + (total > 0 ? " +" : " ") + Math.round(total * 100) + "%";
    }
    return result;
  } else {
    return "";
  }
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
      return {name, type: diffInfo.type, fullName: "Expert+" + typeSuffix, shortName: 'E+', difficulty: 9, color: getDiffColor(diffInfo)};

    default: return null;
  }
}