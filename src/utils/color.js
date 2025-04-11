function componentToHex(c) {
	var hex = c.toString(16);
	return hex.length == 1 ? '0' + hex : hex;
}

export function rgbToHex(r, g, b) {
	return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

export function HSVtoRGB(h, s, v) {
	var r, g, b, i, f, p, q, t;
	if (arguments.length === 1) {
		(s = h.s), (v = h.v), (h = h.h);
	}
	i = Math.floor(h * 6);
	f = h * 6 - i;
	p = v * (1 - s);
	q = v * (1 - f * s);
	t = v * (1 - (1 - f) * s);
	switch (i % 6) {
		case 0:
			(r = v), (g = t), (b = p);
			break;
		case 1:
			(r = q), (g = v), (b = p);
			break;
		case 2:
			(r = p), (g = v), (b = t);
			break;
		case 3:
			(r = p), (g = q), (b = v);
			break;
		case 4:
			(r = t), (g = p), (b = v);
			break;
		case 5:
			(r = v), (g = p), (b = q);
			break;
	}
	return rgbToHex(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255));
}

export function HSLtoRGB(h, s, l) {
	let r, g, b;

	if (s === 0) {
		r = g = b = l;
	} else {
		const hue2rgb = (p, q, t) => {
			if (t < 0) t += 1;
			if (t > 1) t -= 1;
			if (t < 1 / 6) return p + (q - p) * 6 * t;
			if (t < 1 / 2) return q;
			if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
			return p;
		};

		const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		const p = 2 * l - q;

		r = hue2rgb(p, q, h + 1 / 3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1 / 3);
	}

	return rgbToHex(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255));
}

export function setGlobalCSSValue(name, value) {
	var r = document.querySelector(':root');
	r.style.setProperty('--' + name, value);
}

export function removeGlobalCSSValue(name) {
	var r = document.querySelector(':root');
	r.style.removeProperty('--' + name);
}

export function importFonts(fontNames) {
	// This is so we can avoid loading invalid google font API URLs for these generic font families:
	const cssFamilies = {
		serif: null,
		'sans-serif': null,
		monospace: null,
		cursive: null,
		fantasy: null, // Thar be dragons!
		'system-ui': null,
		'ui-serif': null,
		'ui-sans-serif': null,
		'ui-rounded': null,
		emoji: null, // 👍
		math: null, // It adds up
		fangsong: null, // aka Simplified Chinese
	};
	fontNames.split(',').forEach(name => {
		name = name.trim(); // Remove trailing whitespace *once*
		// Skip generic font family names
		if (name in cssFamilies) {
			return;
		}
		// Try loading the local version of the font (if present)
		var font = new FontFace(name, `local("${name}")`);
		document.fonts.add(font);
		font.load().then(
			() => {
				// Font loaded successfully; nothing left to do
			},
			err => {
				// Try loading the font via the google fonts API:
				var link = document.createElement('link');
				link.href = `https://fonts.googleapis.com/css2?family=${name
					.split(' ')
					.join('+')}:wght@100;200;300;400;500;600;700;800;900&display=swap`;
				link.rel = 'stylesheet';
				document.head.appendChild(link);
			}
		);
	});
}
