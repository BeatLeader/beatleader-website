export function hoverable(node) {
    function handleMouseover(event) {
        node.classList.add('hovered');

        node.dispatchEvent(new CustomEvent('hover', {
            detail: { target: event.target, clientX: event.clientX, clientY: event.clientY, pageX: event.pageX, pageY: event.pageY }
        }));
    }

    function handleMouseout(event) {
        node.classList.remove('hovered');

        node.dispatchEvent(new CustomEvent('unhover', {
            detail: { target: event.target, clientX: event.clientX, clientY: event.clientY, pageX: event.pageX, pageY: event.pageY }
        }));
    }

    node.addEventListener('mouseover', handleMouseover);
    node.addEventListener('mouseout', handleMouseout);

    node.classList.add('hoverable');

    return {
        destroy() {
            node.removeEventListener('mouseover', handleMouseover);
            node.removeEventListener('mouseout', handleMouseout);
            node.classList.remove('hoverable');
        }
    };
}