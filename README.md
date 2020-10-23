# Taskwork

[![npm version](https://badge.fury.io/js/taskwork.svg)](https://badge.fury.io/js/taskwork)
[![gzip size](https://img.badgesize.io/https:/unpkg.com/taskwork/dist/taskwork.esm.js?compression=gzip)](https://unpkg.com/taskwork)
[![install size](https://packagephobia.now.sh/badge?p=taskwork)](https://packagephobia.now.sh/result?p=taskwork)

Efficient multi-threaded task scheduler using generic re-usable WebWorkers.

## Status

UNSTABLE

## Installation

Make sure you have [Node.js](http://nodejs.org/) installed.

```sh
 $ npm install taskwork
```

## Usage

```ts
import { Priorities, Scheduler } from 'taskwork';

// Any function, sync or async
const getUser = async (username: string) => {
  const url = `https://api.github.com/users/${username}`;
  const res = await fetch(url);
  const profile = await res.json();
  return profile.name;
};

const scheduler = new Scheduler();

async () => {
  await Promise.all([
    // Add task to the scheduler .addTask(priority, fn name, [fn arguments])
    // Executed in parallel across multiple executors, returns a Promise<result>
    scheduler.addTask(Priorities.LowPriority, getUser, ['microsoft']),
    scheduler.addTask(Priorities.ImmediatePriority, getUser, [
      'timvanscherpenzeel',
    ]),
  ]).then((response: any) => {
    console.log(response); // -> ['Microsoft', 'Tim van Scherpenzeel']
  });

  // Or alternatively

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
