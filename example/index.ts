/* eslint-disable @typescript-eslint/no-explicit-any */

// import { Priorities, Scheduler } from '../src';

// const scheduler = new Scheduler();

// const getUser = async (username: string) => {
//   const url = `https://api.github.com/users/${username}`;
//   const res = await fetch(url);
//   const profile = await res.json();
//   return profile.name;
// };

// (async () => {
//   // await Promise.all([
//   //   scheduler.addTask(Priorities.LowPriority, getUser, ['developit']),
//   //   scheduler.addTask(Priorities.ImmediatePriority, getUser, [
//   //     'timvanscherpenzeel',
//   //   ]),
//   // ]).then((response: any) => {
//   //   console.log(response);
//   // });

//   // const a = scheduler.addTask(Priorities.LowPriority, getUser, ['developit']);
//   const b = scheduler.addTask(Priorities.ImmediatePriority, getUser, [
//     'timvanscherpenzeel',
//   ]);

//   // const d = await a;
//   const e = await b;

//   console.log(e);
// })();
