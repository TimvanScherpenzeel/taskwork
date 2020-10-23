/* eslint-disable @typescript-eslint/no-explicit-any */

import { Priorities, Scheduler } from '../src';

const scheduler = new Scheduler();

const getUser = async (username: string) => {
  const url = `https://api.github.com/users/${username}`;
  const res = await fetch(url);
  const profile = await res.json();
  return profile.name;
};

(async () => {
  await Promise.all([
    scheduler.addTask(Priorities.LowPriority, getUser, ['microsoft']),
    scheduler.addTask(Priorities.ImmediatePriority, getUser, [
      'timvanscherpenzeel',
    ]),
  ]).then((response: any) => {
    console.log(response);
  });

  // // const a = scheduler.addTask(Priorities.LowPriority, getUser, ['developit']);
  // const b = scheduler.addTask(Priorities.ImmediatePriority, getUser, [
  //   'timvanscherpenzeel',
  // ]);

  // // const d = await a;
  // const e = await b;

  // console.log(e);
})();

// import { BinaryHeap } from '../src/internal/BinaryHeap';

// const h = new BinaryHeap();
// h.push({ priority: 5, taskId: 2 });
// h.push({ priority: 1, taskId: 0 });
// h.push({ priority: 2, taskId: 1 });
// h.push({ priority: 3, taskId: 3 });

// console.log(h.pop()); // 5
// console.log(h.pop()); // 10
// console.log(h.pop()); // 15
// console.log(h.pop()); // 20
// console.log(h.pop()); // undefined
