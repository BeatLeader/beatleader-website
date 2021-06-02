import keyValueRepository from './repository/key-value';
import log from '../utils/logger';
import {db} from './db'

const FIXES_KEY = 'data-fix';

const getAppliedFixes = async () => keyValueRepository().get(FIXES_KEY, true);
const storeAppliedFixes = async fixes => keyValueRepository().set(fixes, FIXES_KEY);

const allFixes = {
};

export default async () => {
  const appliedFixes = await getAppliedFixes() ?? [];
  const neededFixes = Object.keys(allFixes).filter(f => !appliedFixes.includes(f) && (!allFixes[f].validTo || allFixes[f].validTo > new Date()));

  if (!neededFixes.length) return;

  for (let key of neededFixes) {
    await allFixes[key].apply();
  }
}