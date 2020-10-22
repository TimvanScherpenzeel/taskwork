/* eslint-disable @typescript-eslint/no-explicit-any */

// Internal
import { Executor, sanitize } from './internal/Executor';
import { PriorityQueue } from './internal/PriorityQueue';

// Task scheduler which can spread tasks across multiple frames
// SharedArrayBuffer
// Semaphore
// WebWorkers
// Atomic

// wait()
// post() / signal()

// lock() / release() like Mutex locks

export type PriorityLevel =
  | Priorities.NoPriority
  | Priorities.ImmediatePriority
  | Priorities.UserBlockingPriority
  | Priorities.NormalPriority
  | Priorities.LowPriority
  | Priorities.IdlePriority;

export enum Priorities {
  NoPriority,
  ImmediatePriority,
  UserBlockingPriority,
  NormalPriority,
  LowPriority,
  IdlePriority,
}

export class Scheduler {
  private taskId = 0;
  private taskPromises: any = {};
  private deferScheduled = false;
  private frameTarget: number;
  private executors: { id: number; executor: Executor; isActive: boolean }[];
  private priorityQueue = new PriorityQueue();
  private threadCount: number;

  constructor({
    frameTarget = 60,
    threadCount = Math.min(Math.max(navigator.hardwareConcurrency - 1, 2), 4),
  }: {
    frameTarget?: number;
    threadCount?: number;
  }) {
    this.frameTarget = frameTarget;
    this.threadCount = threadCount;
    this.executors = [...Array(this.threadCount)].map((_, index) => ({
      executor: new Executor(),
      id: 1 + index,
      isActive: false,
    }));

    this.deferTasks();
  }

  public addTask(priority: PriorityLevel, task: unknown, args: unknown[]) {
    return new Promise((resolve, reject) => {
      this.taskPromises[++this.taskId] = [resolve, reject];
      this.priorityQueue.push(priority, [task, sanitize(args)]);
    });
  }

  private deferTasks() {
    if (!this.deferScheduled) {
      this.deferScheduled = true;
      window.requestAnimationFrame(this.runTasks.bind(this));
    }
  }

  private runTasks() {
    const timeRan = performance.now();

    while (true) {
      if (
        this.priorityQueue.length === 0 ||
        performance.now() - timeRan > 1000 / this.frameTarget
      ) {
        break;
      } else {
        const task = this.priorityQueue.pop();

        const { executor, id } =
          this.executors.find(({ isActive }) => isActive === false) || {};

        if (executor === undefined || id === undefined) {
          break;
        }

        if (task) {
          this.executors[id].isActive = true;

          executor
            .run(task[0], task[1])
            .then((response) => {
              this.executors[id].isActive = false;
              this.taskPromises[this.taskId][0](response);
              delete this.taskPromises[this.taskId];
            })
            .catch((err) => {
              this.executors[id].isActive = false;
              console.error(err);
              delete this.taskPromises[this.taskId];
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
