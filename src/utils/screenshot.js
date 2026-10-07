export const SCREENSHOT_HOST = location.host.split('.').includes('screenshot');

export const SCREENSHOT_MODE = SCREENSHOT_HOST || new URLSearchParams(location.search).has('screenshot');
