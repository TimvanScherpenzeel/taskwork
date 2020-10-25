/* eslint-disable @typescript-eslint/no-explicit-any */

// Internal
import { serializeArgs } from './utilities';

// Types
import { Nullable } from '../types';

declare global {
  interface Window {
    $$tw: { [k: string]: Nullable<Worker> };
  }
}

// iOS Safari seems to wrongly GC the worker.
// Mounting it to the global prevents that from happening.
window.$$tw = {};

/**
 * A re-usable thread implementation based on https://github.com/developit/greenlet and https://github.com/developit/task-worklet
 */
export class Thread {
  private taskId = 0;
  private taskPromises: {
    [k: number]: [(value?: unknown) => void, (reason?: any) => void];
  } = {};
  private worker: Nullable<Worker> = new Worker(
    URL.createObjectURL(
      new Blob([
        `(${() =>
          ((self as any).onmessage = (e: MessageEvent) => {
            if (e.data[0] === 'h') {
              setTimeout(() => (self as any).postMessage(['h']), 3000);
            } else {
              Promise.resolve(Function(`return(${e.data[1]})(${e.data[2]})`)())
                .then((r) => {
                  (self as any).postMessage(
                    ['r', r, e.data[0], 0],
                    [r].filter(
                      (x: unknown) =>
                        x instanceof ArrayBuffer ||
                        x instanceof MessagePort ||
                        (ImageBitmap && x instanceof ImageBitmap)
                    )
                  );
                })
                .catch((f) =>
                  (self as any).postMessage(['r', f, e.data[0], 1])
                );
            }
          })})()`,
      ])
    )
  );

  constructor() {
    this.worker?.addEventListener('message', (e: MessageEvent) => {
      switch (e.data[0]) {
        case 'h':
          this.worker?.postMessage(['h']);
          break;
        case 'r':
          this.taskPromises[e.data[2]][e.data[3]](e.data[1]);
          delete this.taskPromises[e.data[2]];
          break;
      }
    });

    // iOS Safari seems to wrongly GC the worker.
    // Mounting it to the global prevents that from happening.
    window.$$tw[
      `${Math.random().toString(36).substr(2, 8)}-${this.taskId}`
    ] = this.worker;

    // Start heartbeat messaging to worker
    this.worker?.postMessage(['h']);
  }

  public run(...args: any) {
    if (this.worker === null) {
      throw new Error('Worker is not active anymore');
    }

    return new Promise((resolve, reject) => {
      this.taskPromises[++this.taskId] = [resolve, reject];

      const fn = args.shift();

      this.worker?.postMessage(
        [this.taskId, fn.toString(), serializeArgs(args)],
        [args].filter(
          (x: unknown) =>
            x instanceof ArrayBuffer ||
            x instanceof MessagePort ||
            (ImageBitmap && x instanceof ImageBitmap)
        )
      );
    });
  }
}
