function componentToHex(c) {
	var hex = c.toString(16);
	return hex.length == 1 ? '0' + hex : hex;
}

function rgbToHex(r, g, b) {
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

export function setGlobalCSSValue(name, value) {
	var r = document.querySelector(':root');
	r.style.setProperty('--' + name, value);
}

export function removeGlobalCSSValue(name) {
	var r = document.querySelector(':root');
	r.style.removeProperty('--' + name);
}

export function importFonts(fontNames) {
	fontNames.split(',').forEach(name => {
		var link = document.createElement('link');
		link.href = `https://fonts.googleapis.com/css2?family=${name
			.trim()
			.split(' ')
			.join('+')}:wght@100;200;300;400;500;600;700;800;900&display=swap`;
		link.rel = 'stylesheet';
		document.head.appendChild(link);
	});
}

export function importFonts(fontNames) {
	// This is so we can avoid loading invalid google font API URLs for these generic font families:
	const cssFamilies = {
		"serif": null,
		"sans-serif": null,
		"monospace": null,
		"cursive": null,
		"fantasy": null, // Thar be dragons!
		"system-ui": null,
		"ui-serif": null,
		"ui-sans-serif": null,
		"ui-rounded": null,
		"emoji": null, // 👍
		"math": null, // It adds up
		"fangsong": null // aka Simplified Chinese
	};
	fontNames.split(',').forEach(name => {
		name = name.trim(); // Remove trailing whitespace *once*
		// Skip generic font family names
		if (name in cssFamilies) { return }
		// Try loading the local version of the font (if present)
		var font = new FontFace(name, `local("${name}")`);
		document.fonts.add(font);
		font.load().then(
			() => {
				// Font loaded successfully; nothing left to do
			},
			(err) => {
				// Try loading the font via the google fonts API:
				var link = document.createElement('link');
				link.href = `https://fonts.googleapis.com/css2?family=${name
					.split(' ')
					.join('+')}:wght@100;200;300;400;500;600;700;800;900&display=swap`;
				link.rel = 'stylesheet';
				document.head.appendChild(link);
				},
		  );
	});
}
