import {writable} from 'svelte/store';

// Create a writable store for cinematics
export let cinematicsStore;

const cache = {};

export default () => {
	if (cinematicsStore) return cinematicsStore;

	const {subscribe, set, update} = writable(cache);

	cinematicsStore = {
		subscribe,
		set,
		update,

		// Get or create a cached image for a URL
		getImage: url => {
			if (!url) return null;

			// Return cached image if exists
			if (cache[url]) {
				return cache[url];
			}

			// Create and cache new image
			const img = new Image();
			img.src = url;

			// Store promise that resolves when image loads
			const promise = new Promise((resolve, reject) => {
				img.onload = () => resolve(img);
				img.onerror = reject;
			});

			cache[url] = promise;

			return promise;
		},

		// Draw image on canvas with cinematics effect
		drawCinematics: async (canvas, url) => {
			if (!url || !canvas) return;

			try {
				const img = await cinematicsStore.getImage(url);
				canvas.style.opacity = 1;
				const context = canvas.getContext('2d');
				context.drawImage(img, 0, 0, canvas.width, canvas.height);
			} catch (err) {
				console.error('Failed to draw cinematics:', err);
			}
		},

		// Clear the cache
		clearCache: () => {
			set({});
		},
	};

	return cinematicsStore;
};
