import {TRIGGERS} from 'svelte-dnd-action';

// Playlists share one dnd zone type, so ids carry the playlist key to stay unique across them
const dndId = (playlistKey, item) => `${playlistKey}:${item.itemId ?? item.hash ?? item.key ?? `${item.replayType}-${item.id}`}`;

export const toDndEntries = (playlistKey, items) => items.map(item => ({id: dndId(playlistKey, item), from: playlistKey, item}));

export const onlyItems = items => items.filter(entry => entry?.item);

export const droppedElsewhere = info => info?.trigger === TRIGGERS.DROPPED_INTO_ANOTHER;

export const isTouchLayout = () => 'ontouchstart' in window && window.matchMedia('(max-width: 768px)').matches;
