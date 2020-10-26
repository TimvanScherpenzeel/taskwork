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
  private captureStart = 0;
  private captureEnd = 0;
  private captureLength = 5;
  private captureFrames: number[] = Array(this.captureLength).fill(60);
  private executors: {
    executorId: number;
    executor: Thread;
    isRunning: boolean;
  }[];
  private frameCount = 0;
  private frameRate = 60;
  private frameRateAverage = 0;
  private priorityQueue = new PriorityQueue();
  private taskId = 0;
  private taskPromises: {
    [k: number]: [(value?: unknown) => void, (reason?: any) => void];
  } = {};
  private threadCount: number;

  constructor({
    threadCount = Math.min(Math.max(navigator?.hardwareConcurrency - 1, 2), 4),
  }: {
    threadCount?: number;
  } = {}) {
    this.threadCount = threadCount;

    this.executors = [...Array(this.threadCount)].map((_, index) => ({
      executor: new Thread(),
      executorId: index,
      isRunning: false,
    }));

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

    this.captureStart = performance.now();
    this.frameCount++;

    if (this.captureStart >= this.captureEnd + 1000) {
      this.frameRate = Math.round(
        (this.frameCount * 1000) / (this.captureStart - this.captureEnd)
      );
      this.captureFrames.shift();
      this.captureFrames.push(this.frameRate);
      this.frameRateAverage =
        this.captureFrames.reduce((a, b) => a + b) / this.captureLength;

      this.captureEnd = this.captureStart;
      this.frameCount = 0;
    }

    while (true) {
      if (
        this.priorityQueue.length === 0 ||
        performance.now() > this.captureStart + 1000 / this.frameRateAverage
      ) {
        break;
      } else {
        const { executor, executorId } =
          this.executors.find(({ isRunning }) => isRunning === false) || {};

        if (executor === undefined || executorId === undefined) {
          break;
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
}
