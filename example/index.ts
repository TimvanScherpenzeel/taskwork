import { Priorities, Scheduler } from '../src';

const scheduler = new Scheduler();

const getUser = async (username: string) => {
  const url = `https://api.github.com/users/${username}`;
  const res = await fetch(url);
  const profile = await res.json();
  return profile.name;
};

(async () => {
  const a = await scheduler.addTask(Priorities.ImmediatePriority, getUser, [
    'timvanscherpenzeel',
  ]);

  console.log(a);
})();
