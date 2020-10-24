# Taskwork

[![npm version](https://badge.fury.io/js/taskwork.svg)](https://badge.fury.io/js/taskwork)
[![gzip size](https://img.badgesize.io/https:/unpkg.com/taskwork/dist/taskwork.esm.js?compression=gzip)](https://unpkg.com/taskwork)
[![install size](https://packagephobia.now.sh/badge?p=taskwork)](https://packagephobia.now.sh/result?p=taskwork)

Efficient multi-threaded task scheduler for the browser using generic re-usable WebWorkers.

`Taskwork` is a task scheduler that is able to delegate tasks to [WebWorkers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API). These WebWorkers are special in the sense that they are able to execute and return the results from arbitrary tasks send to them. At the start of the application a fixed amount of threads are spawned and re-used throughout the lifetime of the application. This has the advantage of paying the spawn-cost of WebWorkers (`~45 ms`) and the overhead of spawning only once.

Another feature of `Taskwork` is the ability to schedule a task with a certain priority. By automatically min-sorting the task queue based on priority we can make sure that tasks with the highest priority are executed first. This is important because the goal is to stay within the `frameTarget (by default 60 fps)` frame budget. `Taskwork` internally checks wether there is enough time left in the frame to run a task and automatically defers it to the next frame if there is not.

## Status

UNSTABLE, IN-PROGRESS

ONLY SUPPORTED IN BROWSER

## Installation

Make sure you have [Node.js](http://nodejs.org/) installed.

```sh
 $ npm install taskwork
```

## Usage

```ts
// Priorities is just an enum with default levels, you can use your own
import { Priorities, Scheduler } from 'taskwork';

// Any function, sync or async (this will be serialized and executed inside of a WebWorker)
const getUser = async (username: string) => {
  const url = `https://api.github.com/users/${username}`;
  const res = await fetch(url);
  const profile = await res.json();
  return profile.name;
};

const scheduler = new Scheduler({
  frameTarget?: number; // (Default, 60) Time available per frame to execute tasks
  threadCount?: number; // (Default, 2 - 4 depending on CPU architecture) Amount of threads to spawn
});

async () => {
  // Gets executed on first executor, returns a Promise<result>
  const taskAp = scheduler.addTask(Priorities.LowPriority, getUser, [
    'microsoft',
  ]);
  // Gets executed on second executor, returns a Promise<result>
  const taskBp = scheduler.addTask(Priorities.ImmediatePriority, getUser, [
    'timvanscherpenzeel',
  ]);

  // Await results
  const taskA = await taskAp;
  const taskB = await taskBp;

  console.log(taskA, taskB); // -> 'Microsoft', 'Tim van Scherpenzeel'
};
```

## Licence

My work is released under the [MIT license](https://raw.githubusercontent.com/TimvanScherpenzeel/taskwork/master/LICENSE).
