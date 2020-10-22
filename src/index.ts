/* eslint-disable @typescript-eslint/no-explicit-any */

// Internal
import { Executor, sanitize } from './internal/Executor';
import { PriorityQueue } from './internal/PriorityQueue';

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
  private executors: {
    executorId: number;
    executor: Executor;
    isActive: boolean;
  }[];
  private priorityQueue = new PriorityQueue();
  private threadCount: number;

  constructor({
    frameTarget = 60,
    threadCount = Math.min(Math.max(navigator.hardwareConcurrency - 1, 2), 4),
  }: {
    frameTarget?: number;
    threadCount?: number;
  }) {
    this.frameTarget = 1000 / frameTarget;
    this.threadCount = threadCount;
    this.executors = [...Array(this.threadCount)].map((_, index) => ({
      executor: new Executor(),
      executorId: 1 + index,
      isActive: false,
    }));

    this.runTasks = this.runTasks.bind(this);

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
          this.executors.find(({ isActive }) => isActive === false) || {};

        if (executor === undefined || executorId === undefined) {
          break;
        }

        const task = this.priorityQueue.pop();

        if (task) {
          this.executors[executorId].isActive = true;

          executor
            .run(task[0], task[1])
            .then((response) => {
              this.taskPromises[this.taskId][0](response);
            })
            .catch((err) => {
              console.error(err);
              this.taskPromises[this.taskId][1](err);
            })
            .finally(() => {
              this.executors[executorId].isActive = false;
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
