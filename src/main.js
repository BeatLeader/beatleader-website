import App from './App.svelte';
import {default as createQueue, PRIORITY} from './utils/queue'
import {delay} from './utils/promise'


const queue = createQueue({concurrency: 2, timeout: 1500});
queue.on('change', ({size, pending}) => {
  console.warn(`Queue change: size=${size}, pending=${pending}`)
});
queue.on('progress', ({progress, num, count}) => {
  console.error(`${Math.round(progress*100)}% (${num}/${count})`)
});

queue.pause();

const addToQueue = (time, value, priority) => {
  queue.add(() => delay(time, value), priority).then(r => console.log(`Value=${r}`))
}
addToQueue(1000, 1, PRIORITY.LOW);
addToQueue(2000, 2, PRIORITY.NORMAL);
addToQueue(1000, 3, PRIORITY.NORMAL);
addToQueue(1000, 4, PRIORITY.HIGH);
addToQueue(1000, 5, PRIORITY.HIGH);
setTimeout(() => addToQueue(1000, 6, PRIORITY.HIGHEST), 1500);

queue.start();


const app = new App({
  target: document.body,
  props: {},
});

export default app;