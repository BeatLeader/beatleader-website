import keyValueRepository from './repository/key-value';
import log from '../utils/logger';
import {db} from './db'

const FIXES_KEY = 'data-fix';

const getAppliedFixes = async () => keyValueRepository().get(FIXES_KEY, true);
const storeAppliedFixes = async fixes => keyValueRepository().set(fixes, FIXES_KEY);

const allFixes = {
  'rankeds-20210725': {
    apply: async fixName => {
      log.info('Apply rankeds refresh fix (20210725)')

      return db.runInTransaction(['rankeds-changes', 'rankeds', 'key-value'], async tx => {
        await tx.objectStore('rankeds-changes').clear();
        await tx.objectStore('rankeds').clear();

        const keyValueStore = tx.objectStore('key-value')

        keyValueStore.delete('rankedsLastUpdated');

        const allAppliedFixes = await keyValueStore.get(FIXES_KEY);
        (allAppliedFixes ? allAppliedFixes : []).push(fixName);
        await keyValueStore.put(allAppliedFixes, FIXES_KEY);
      });
    },
  },
};

export default async () => {
  let appliedDbFixes = await getAppliedFixes();
  const appliedFixes = appliedDbFixes ? appliedDbFixes : [];
  const neededFixes = Object.keys(allFixes).filter(f => !appliedFixes.includes(f) && (!allFixes[f].validTo || allFixes[f].validTo > new Date()));

  if (!neededFixes.length) return;

  for (let key of neededFixes) {
    await allFixes[key].apply(key);
  }
}