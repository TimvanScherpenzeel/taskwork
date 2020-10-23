/* eslint-disable @typescript-eslint/no-explicit-any */

// iOS Safari seems to wrongly GC the worker.
// Mounting it to the global prevents that from happening.
(self as any).$$w = {};

// Make sure string arguments are kept as strings
export const serializeArgs = (args: any[] = []) =>
  args.map((m: unknown) => (typeof m === 'string' ? JSON.stringify(m) : m));

/**
 * A re-usable thread implementation based on https://github.com/developit/greenlet and https://github.com/developit/task-worklet
 */
export class Thread {
  private taskId = 0;
  private taskPromises: any = {};
  private worker: Worker | null = new Worker(
    URL.createObjectURL(
      new Blob(
        [
          `(${() =>
            (self.onmessage = (e: MessageEvent) => {
              Promise.resolve(Function(`return(${e.data[1]})(${e.data[2]})`)())
                .then((r) => {
                  (self as any).postMessage(
                    ['r', r, e.data[0], 0],
                    [r].filter(
                      (x: unknown) =>
                        x instanceof ArrayBuffer ||
                        x instanceof MessagePort ||
                        (self.ImageBitmap && x instanceof ImageBitmap)
                    )
                  );
                })
                .catch((f) =>
                  (self as any).postMessage(['r', f, e.data[0], 1])
                );
            })})()`,
        ],
        { type: 'text/javascript' }
      )
    )
  );

  constructor() {
    this.worker?.addEventListener('message', (e: MessageEvent) => {
      if (e.data[0] === 'r') {
        this.taskPromises[e.data[2]][e.data[3]](e.data[1]);
        delete this.taskPromises[e.data[2]];
      }
    });

    // iOS Safari seems to wrongly GC the worker.
    // Mounting it to the global prevents that from happening.
    (self as any).$$w[this.taskId] = this.worker;
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
            (self.ImageBitmap && x instanceof ImageBitmap)
        )
      );
    });
  }
}
