/* eslint-disable @typescript-eslint/no-explicit-any */

import { Priorities, Scheduler } from '../src';

const scheduler = new Scheduler({ frameCap: 5 });

const getUser = async (username: string) => {
  // const url = `https://api.github.com/users/${username}`;
  // const res = await fetch(url);
  // const profile = await res.json();
  // return profile.name;
  return username;
};

(async () => {
  // await Promise.all([
  //   scheduler.addTask(Priorities.LowPriority, getUser, ['microsoft']),
  //   scheduler.addTask(Priorities.ImmediatePriority, getUser, [
  //     'timvanscherpenzeel',
  //   ]),
  // ]).then((response: any) => {
  //   console.log(response);
  // });

  for (let i = 0; i < 100; i++) {
    const a = await scheduler.addTask(Priorities.LowPriority, getUser, [
      'developit',
    ]);

    console.log(a);
  }

  // const b = scheduler.addTask(Priorities.ImmediatePriority, getUser, [
  //   'timvanscherpenzeel',
  // ]);

  // // const d = await a;
  // const e = await b;

  // console.log(e);
})();
