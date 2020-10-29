// Internal
import { Priorities, PriorityQueue } from './internal/PriorityQueue';
import { Thread } from './internal/Thread';
export { Priorities };

// Types
import type { PriorityLevel, StoreEntry } from './internal/PriorityQueue';
import type { TaskPromises } from './internal/Thread';

export class Scheduler {
  private captureStart = 0;
  private captureEnd = 0;
  private captureLength = 10;
  private captureFrames: number[] = Array(this.captureLength).fill(60);

  // Reserve 30% of the frame budget to the browser (4-6 ms at 60 fps)
  private frameBudget = 0.7;

  private frameCount = 0;
  private frameRate = 60.0;
  private frameRateAverage = 0.0;
  private priorityQueue = new PriorityQueue();
  private taskId = 0;
  private taskPromises: TaskPromises = {};
  private threads: {
    isRunning: boolean;
    thread: Thread;
    threadId: number;
  }[];
  private threadCount: number;

  constructor({
    frameBudget = 0.7,
    threadCount = Math.min(Math.max(navigator?.hardwareConcurrency - 1, 2), 4),
  }: {
    frameBudget?: number;
    threadCount?: number;
  } = {}) {
    this.frameBudget = frameBudget;
    this.threadCount = threadCount;

    this.threads = [...Array(this.threadCount)].map((_, index) => ({
      isRunning: false,
      thread: new Thread(),
      threadId: index,
    }));

    this.runTasks = this.runTasks.bind(this);

    this.runTasks();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public addTask(priority: PriorityLevel, task: any, args?: any[]) {
    return new Promise((resolve, reject) => {
      this.taskPromises[++this.taskId] = [resolve, reject];
      this.priorityQueue.push(priority, [
        this.taskId,
        task,
        Thread.serializeArgs(args),
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
        performance.now() >
          this.captureStart + (1000 / this.frameRateAverage) * this.frameBudget
      ) {
        break;
      } else {
        const { thread, threadId } =
          this.threads.find(({ isRunning }) => isRunning === false) || {};

        if (thread === undefined || threadId === undefined) {
          break;
        }

        const task: StoreEntry | undefined = this.priorityQueue.pop();

        if (task) {
          const [taskId, fn, args] = task;

          this.threads[threadId].isRunning = true;

          thread
            .run(fn, args)
            .then((response) => {
              this.taskPromises[taskId][0](response);
            })
            .catch((err) => {
              console.error(err);
              this.taskPromises[taskId][1](err);
            })
            .finally(() => {
              this.threads[threadId].isRunning = false;
              delete this.taskPromises[taskId];
            });
        }
      }
    }
  }
}
