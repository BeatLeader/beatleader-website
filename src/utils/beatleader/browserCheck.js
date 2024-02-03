export function isIOSSafari() {
	var ua = window.navigator.userAgent;
	var iOS = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i);
	var webkit = !!ua.match(/WebKit/i);
	return iOS && webkit && !ua.match(/CriOS/i);
}
