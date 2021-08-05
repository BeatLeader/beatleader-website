import log from './logger';

function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;

    // Avoid scrolling to bottom
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        document.execCommand('copy');
    } catch (err) {
        log.error('Fallback: Oops, unable to copy to clipboard', err);
    }

    document.body.removeChild(textArea);
}

export function copyToClipboard(text) {
    navigator.permissions.query({name: 'clipboard-write'})
        .then(result => {
            if (result.state === 'granted' || result.state === 'prompt') {
                navigator.clipboard.writeText(text).then(() => {});
            } else {
                fallbackCopyTextToClipboard(text);
            }
        })
        .catch(() => fallbackCopyTextToClipboard(text))
    ;
}