/* eslint-disable @typescript-eslint/no-explicit-any */

// Internal
import { RPC, sanitize } from './internal/RPC';
import { Profiler } from './internal/Profiler';
import { PriorityQueue } from './internal/PriorityQueue';

export type PriorityLevel =
  | Priorities.ImmediatePriority
  | Priorities.HighPriority
  | Priorities.NormalPriority
  | Priorities.LowPriority;

export enum Priorities {
  ImmediatePriority,
  HighPriority,
  NormalPriority,
  LowPriority,
}

export class Scheduler {
  private taskId = 0;
  private taskPromises: any = {};
  private deferScheduled = false;
  private frameTarget: number;
  private executors: {
    executorId: number;
    executor: RPC;
    isRunning: boolean;
  }[];
  private profiler = new Profiler();
  private priorityQueue = new PriorityQueue();
  private threadCount: number;
  private sharedBuffer: SharedArrayBuffer;
  private sharedBufferArray: Int32Array;

  constructor({
    frameTarget = 60,
    threadCount = Math.min(Math.max(navigator?.hardwareConcurrency - 1, 2), 4),
    bufferSize = 1024,
  }: {
    frameTarget?: number;
    threadCount?: number;
    bufferSize?: number;
  } = {}) {
    this.frameTarget = 1000 / frameTarget;
    this.threadCount = threadCount;
    this.sharedBuffer = new SharedArrayBuffer(bufferSize);
    this.sharedBufferArray = new Int32Array(this.sharedBuffer);
    this.executors = [...Array(this.threadCount)].map((_, index) => ({
      executor: new RPC(),
      executorId: index,
      isRunning: false,
    }));

    this.runTasks = this.runTasks.bind(this);

    this.deferTasks();
  }

  public addTask(priority: PriorityLevel, task: unknown, args: unknown[]) {
    return new Promise((resolve, reject) => {
      this.taskPromises[++this.taskId] = [resolve, reject];
      this.priorityQueue.push(priority, [
        task,
        sanitize(args),
        this.sharedBuffer,
      ]);
    });
  }

  private deferTasks() {
    if (!this.deferScheduled) {
      this.deferScheduled = true;
      window?.requestAnimationFrame(this.runTasks);
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
          break;
        }

        const task = this.priorityQueue.pop();

        if (task) {
          this.profiler.start('executor');
          this.executors[executorId].isRunning = true;

          executor
            .run(task[0], task[1], task[2])
            .then((response) => {
              this.taskPromises[this.taskId][0](response);
            })
            .catch((err) => {
              console.error(err);
              this.taskPromises[this.taskId][1](err);
            })
            .finally(() => {
              this.executors[executorId].isRunning = false;
              delete this.taskPromises[this.taskId];
              this.profiler.end('executor');
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
