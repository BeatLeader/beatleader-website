import {writable} from 'svelte/store'
import createPlayerStore from './players'
import createPlayerService from '../../services/scoresaber/player'

export default () => {
  const playerService = createPlayerService();

  const {subscribe, unsubscribe: stateUnsubscribe, set} = writable([]);

  const playerStore = createPlayerStore();

  const playerStoreUnsubscribe = playerStore.subscribe(async players => {
    const friends = await playerService.getFriends();

    set(
      players
        .filter(p => p && p.playerId && friends.includes(p.playerId))
        .sort((a,b) => a.name ? a.name.localeCompare(b.name) : 0)
    );
  })

  const unsubscribe = () => {
    stateUnsubscribe();
    playerStoreUnsubscribe()();
    playerService.destroyService();
  }

  return {
    subscribe,
    unsubscribe,
  }
};
