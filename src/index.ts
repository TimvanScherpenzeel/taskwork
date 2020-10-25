/* eslint-disable @typescript-eslint/no-explicit-any */

// Internal
import {
  Priorities,
  PriorityLevel,
  PriorityQueue,
  StoreEntry,
} from './internal/PriorityQueue';
import { Profiler } from './internal/Profiler';
import { Thread } from './internal/Thread';
import { serializeArgs } from './internal/utilities';

// Types
import { Undefinable } from './types';
export { Priorities };

export class Scheduler {
  private deferScheduled = false;
  private executors: {
    executorId: number;
    executor: Thread;
    isRunning: boolean;
  }[];
  private frameTarget: number;
  private priorityQueue = new PriorityQueue();
  private taskId = 0;
  private taskPromises: {
    [k: number]: [(value?: unknown) => void, (reason?: any) => void];
  } = {};
  private threadCount: number;
  private profiler = new Profiler();

  constructor({
    frameTarget = 60,
    threadCount = Math.min(Math.max(navigator?.hardwareConcurrency - 1, 2), 4),
  }: {
    frameTarget?: number;
    threadCount?: number;
  } = {}) {
    this.frameTarget = 1000 / frameTarget;
    this.threadCount = threadCount;

    this.executors = [...Array(this.threadCount)].map((_, index) => ({
      executor: new Thread(),
      executorId: index,
      isRunning: false,
    }));

    this.runTasks = this.runTasks.bind(this);

    this.deferTasks();
  }

  public addTask(priority: PriorityLevel, task: any, args?: any[]) {
    return new Promise((resolve, reject) => {
      this.taskPromises[++this.taskId] = [resolve, reject];
      this.priorityQueue.push(priority, [
        this.taskId,
        task,
        serializeArgs(args),
      ]);
    });
  }

  private deferTasks() {
    if (!this.deferScheduled) {
      this.deferScheduled = true;
      window.requestAnimationFrame(this.runTasks);
    }
  }

  private runTasks() {
    const timeRan = performance.now();

    while (true) {
      if (
        this.priorityQueue.length === 0 ||
        performance.now() - timeRan > this.frameTarget
      ) {
        break;
      } else {
        const { executor, executorId } =
          this.executors.find(({ isRunning }) => isRunning === false) || {};

        if (executor === undefined || executorId === undefined) {
          return;
        }

        const task: Undefinable<StoreEntry> = this.priorityQueue.pop();

        if (task) {
          const [taskId, fn, args] = task;

          this.executors[executorId].isRunning = true;

          executor
            .run(fn, args)
            .then((response) => {
              this.taskPromises[taskId][0](response);
            })
            .catch((err) => {
              console.error(err);
              this.taskPromises[taskId][1](err);
            })
            .finally(() => {
              this.executors[executorId].isRunning = false;
              delete this.taskPromises[taskId];
            });
        }
      }
    }

    this.deferScheduled = false;

    if (this.priorityQueue.length > 0) {
      this.deferTasks();
    }
  }
}
