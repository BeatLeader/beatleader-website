const MAPS = {viewBox: '35 27 188 188', paths: [
	'M35.7 184C35.7 138.7 35.9 94 35.5 49.2C35.4 38.7 45.9 28 56.7 28.1C104.5 28.5 152.4 28.4 200.3 28.1C210.4 28 221.1 37.1 221.3 47.6C221.7 67.5 222.2 87.5 222.3 107.5C222.5 133.8 222.5 160.2 222.3 186.5C222.2 193.6 221.6 201 216.3 206.7C212.5 210.9 208.1 213.9 201.9 213.9C153 213.8 104 213.9 55 213.9C45.4 213.9 36 204.7 35.7 195.1C35.6 191.6 35.7 188.1 35.7 184M54.5 68.6C54.5 108.7 54.5 148.8 54.4 189C54.3 193.8 55.7 195.2 60.6 195.2C105.8 195 151.1 195 196.4 195.2C201.2 195.2 202.6 193.9 202.6 189C202.4 143.7 202.5 98.4 202.6 53.2C202.6 48.3 201.3 46.9 196.4 46.9C164 47.1 131.6 47 99.2 47C86 47 72.7 47.1 59.5 47C55.7 46.9 54.2 48.1 54.4 52C54.7 57.2 54.5 62.3 54.5 68.6Z',
	'M86.2 94.8C83.3 93.3 80.8 91.9 78.1 90.9C70.3 88.2 68.6 79.5 73.3 72C74.5 70 77.8 68.2 80.1 68.2C112.3 68 144.5 68 176.7 68.2C178.9 68.2 182 70 183.3 71.9C187.5 77.9 184.7 87.2 178.2 90.5C162.9 98.1 147.5 105.4 132.4 113.2C127.4 115.8 123.7 113.2 119.8 111.3C108.6 106 97.6 100.5 86.2 94.8Z',
]};

const REPLAYS = {viewBox: '49 40.7 172.5 172.5', paths: [
	'M202.46,53.79a6,6,0,0,1,6,6V194.11a6,6,0,0,1-6,6H68.09a6,6,0,0,1-6-6V59.75a6,6,0,0,1,6-6H202.46m0-13H68.09a19,19,0,0,0-19,19V194.11a19,19,0,0,0,19,19H202.46a19,19,0,0,0,19-19V59.75a19,19,0,0,0-19-19Z',
	'M119.8,83.84H118c-2.75,0-5.16,1-5.86,2.42l-18.91,38.5a7,7,0,0,0,0,6.34l18.91,38.5c.7,1.43,3.11,2.42,5.86,2.42h2.81c3.48,0,6.3-1.86,6.3-4.16V88.65C127.09,86,123.83,83.84,119.8,83.84Z',
	'M166.82,83.84H165c-2.75,0-5.16,1-5.86,2.42l-18.91,38.5a7,7,0,0,0,0,6.34l18.91,38.5c.7,1.43,3.11,2.42,5.86,2.42h2.81c3.48,0,6.29-1.86,6.29-4.16V88.65C174.1,86,170.84,83.84,166.82,83.84Z',
]};

export function playlistTypeIcon(replays, size = '1em') {
	const {viewBox, paths} = replays ? REPLAYS : MAPS;
	return `<svg class="playlist-type-icon" xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="currentColor" aria-hidden="true" style="width: ${size}; height: ${size}">${paths
		.map(d => `<path d="${d}"/>`)
		.join('')}</svg>`;
}

export const MAPS_ICON = playlistTypeIcon(false);
export const REPLAYS_ICON = playlistTypeIcon(true);

// Strokes set fill="none" themselves: Button.svelte fills any svg inside a button
export function activePlaylistIcon(size = '1em') {
	return `<svg class="active-playlist-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width: ${size}; height: ${size}"><path d="M18.99 10.09A8.5 8.5 0 1 1 13.91 5.01" fill="none"/><path d="M15.23 11.46A4.5 4.5 0 1 1 12.54 8.77" fill="none"/><circle cx="11" cy="13" r="1" fill="currentColor"/><path d="M11 13l5-5" fill="none"/><path d="M16 5v3h3l3-3h-3V2z" fill="currentColor"/></svg>`;
}
