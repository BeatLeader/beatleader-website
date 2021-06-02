let bc;

const createGlobalPubSub = () => {
    const subscribers = {}
    if (!bc) bc = new BroadcastChannel('global-pub-sub');

    const exists = eventName => Array.isArray(subscribers[eventName]);

    const notify = (eventName, value, _local = true) => {
        if (!exists(eventName)) return;

        subscribers[eventName].forEach(handler => handler(value, _local, eventName));
    }

    const unsubscribe = (eventName, handler) => {
        if (!exists(eventName)) return;

        subscribers[eventName] = subscribers[eventName].filter(h => h !== handler);
    }

    bc.onmessage = ({data: {eventName, value}}) => notify(eventName, value, false)

    return {
        on(eventName, handler) {
            if (!exists(eventName)) subscribers[eventName] = [];

            // workaround - have no idea why some handlers are registered multiple times
            if (subscribers[eventName].find(h => h === handler)) return;

            subscribers[eventName].push(handler);

            return () => {
                unsubscribe(eventName, handler);
            }
        },
        unsubscribe,
        publish(eventName, value) {
            notify(eventName, value);

            bc.postMessage({eventName, value})
        }
    }
}

const pubSub = createGlobalPubSub();

export default pubSub;