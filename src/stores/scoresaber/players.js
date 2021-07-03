import {writable} from 'svelte/store'
import createPlayerService from '../../services/scoresaber/player'
import eventBus from '../../utils/broadcast-channel-pubsub'

let store = null;

export default () => {
  if (store) return store;

  const playerService = createPlayerService();

  let players = [];
  const {subscribe: subscribeState, set} = writable(players);

  const refreshState = async () => {
    players = await playerService.getAll()

    set(players)
  }

  const get = () => players;

  const playerAddedUnsubscribe = eventBus.on('player-profile-added', refreshState);
  const playerRemovedUnsubscribe = eventBus.on('player-profile-removed', refreshState);

  const subscribe = fn => {
    const stateUnsubscribe = subscribeState(fn);

    return () => {
      stateUnsubscribe();
      playerAddedUnsubscribe();
      playerRemovedUnsubscribe();
    }
  }

  refreshState().then(_ => _);

  store = {
    subscribe,
    get,
  }

  return store;
}