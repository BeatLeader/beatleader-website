export default () => {
	function invertColor(hex) {
		if (hex.indexOf('#') === 0) {
			hex = hex.slice(1);
		}
		// convert 3-digit hex to 6-digits.
		if (hex.length === 3) {
			hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
		}
		if (hex.length === 6) {
			hex = hex + 'FF';
		}
		var r = parseInt(hex.slice(0, 2), 16),
			g = parseInt(hex.slice(2, 4), 16),
			b = parseInt(hex.slice(4, 6), 16),
			a = parseInt(hex.slice(6, 8), 16);
		// https://stackoverflow.com/a/3943023/112731
		return r * 0.299 + g * 0.687 + b * 0.114 > 186 && a > 128 ? '#000000' : '#FFFFFF';
	}

	return {
        invertColor,
	};
};
