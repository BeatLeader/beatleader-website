export const WEIGHT_COEFFICIENT = 0.965;

export const getTotalPpFromSortedPps = (ppArray, startIdx = 0) => ppArray.reduce((cum, pp, idx) => cum + Math.pow(WEIGHT_COEFFICIENT, idx + startIdx) * pp, 0);