/* eslint-disable @typescript-eslint/no-explicit-any */

// Internal
import {
  Priorities,
  PriorityLevel,
  PriorityQueue,
  StoreEntry,
} from './internal/PriorityQueue';
import { Thread } from './internal/Thread';
import { serializeArgs } from './internal/utilities';

// Types
import { Undefinable } from './types';
export { Priorities };

export class Scheduler {
  private executors: {
    executorId: number;
    executor: Thread;
    isRunning: boolean;
  }[];
  private currentTime = 0;
  private startTime = 0;
  private frameDelta = 0;
  private frameCap: number;
  private priorityQueue = new PriorityQueue();
  private taskId = 0;
  private taskPromises: {
    [k: number]: [(value?: unknown) => void, (reason?: any) => void];
  } = {};
  private threadCount: number;

  constructor({
    frameCap = 60,
    threadCount = Math.min(Math.max(navigator?.hardwareConcurrency - 1, 2), 4),
  }: {
    frameCap?: number;
    threadCount?: number;
  } = {}) {
    this.frameCap = 1000 / frameCap;
    this.threadCount = threadCount;

    this.executors = [...Array(this.threadCount)].map((_, index) => ({
      executor: new Thread(),
      executorId: index,
      isRunning: false,
    }));

    this.startTime = performance.now();

    this.runTasks = this.runTasks.bind(this);

    this.runTasks();
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

  private runTasks() {
    window.requestAnimationFrame(this.runTasks);

    this.currentTime = performance.now();
    this.frameDelta = this.currentTime - this.startTime;

    if (this.frameDelta > this.frameCap) {
      this.startTime = this.currentTime - (this.frameDelta % this.frameCap);

      if (this.priorityQueue.length === 0) {
        return;
      }

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
}
