import { writable } from 'svelte/store'
import { diffForDiffName } from '../../utils/beatleader/format';

let store = null;
let storeSubCount = 0;

export default () => {
    storeSubCount++;
    if (store) return store;

    let starRatings = {};

    const get = () => starRatings;
    const { subscribe: subscribeState, set } = writable(starRatings);

    const fetchStars = async (hash, diff, mode) => {
        if (!hash || !diff || !mode) return;
        fetch(`https://bs-replays-ai.azurewebsites.net/json/${hash}/${diffForDiffName(diff)}/basic`)
            .then(response => response.json())
            .then(data => {
                starRatings[hash + diff + mode] = parseFloat(data.balanced);
                set(starRatings);
            })
    }

    const subscribe = fn => {
        const stateUnsubscribe = subscribeState(fn);

        return () => {
            storeSubCount--;

            if (storeSubCount === 0) {
                store = null;

                stateUnsubscribe();
            }
        }
    }

    return {
        subscribe,
        get,
        fetchStars
    }
}

