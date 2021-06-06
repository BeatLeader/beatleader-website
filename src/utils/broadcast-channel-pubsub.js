import {BroadcastChannel, createLeaderElection} from 'broadcast-channel'
import {readable} from 'svelte/store'
import log from './logger'
import {uuid} from './uuid'

let bc;

const createGlobalPubSub = () => {
    const subscribers = {}

    const nodeId = uuid();
    log.info(`Create pub/sub channel for node ${nodeId}`, 'PubSub')

    bc = new BroadcastChannel('global-pub-sub', {webWorkerSupport: false});
    const elector = createLeaderElection(bc);

    let isLeader = false;
    const leaderStore = readable(isLeader, set => {
      elector.awaitLeadership().then(() => {
        isLeader = true;
        set(isLeader);

        log.info(`Node ${nodeId} is a new leader`, 'PubSub')

        return () => {}
      });
    });

    const exists = eventName => Array.isArray(subscribers[eventName]);

    const notify = (eventName, value, isLocal = true) => {
        if (!exists(eventName)) return;

        subscribers[eventName].forEach(handler => handler(value, isLocal, eventName));
    }

    const unsubscribe = (eventName, handler) => {
        if (!exists(eventName)) return;

        subscribers[eventName] = subscribers[eventName].filter(h => h !== handler);
    }

    const publish = (eventName, value) => {
        notify(eventName, value);

        bc.postMessage({eventName, nodeId, value})
    }

    bc.onmessage = ({eventName, nodeId: eventNodeId, value}) => notify(eventName, value, eventNodeId === nodeId);

    const removeNode = async () => {
        log.info(`Node ${nodeId} is about to be removed`, 'PubSub');

        publish('node-removed', nodeId);
    }

    // add close handler (also prevents back-forward cache)
    window.addEventListener('beforeunload', () => removeNode(), {capture: true});

    publish('node-added', nodeId)
    log.info(`Node ${nodeId} has been created`, 'PubSub')

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
        publish,
        leaderStore,
        isLeader() {return isLeader},
    }
}

const pubSub = createGlobalPubSub();

export default pubSub;