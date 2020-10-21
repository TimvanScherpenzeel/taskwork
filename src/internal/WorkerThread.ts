/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * A re-usable thread implementation based on https://github.com/developit/greenlet and https://github.com/developit/task-worklet
 */
export class WorkerThread {
  private taskId = 0;
  private promises: any = {};
  private worker: Worker | null = new Worker(
    URL.createObjectURL(
      new Blob(
        [
          `(${() => {
            self.onmessage = (e: MessageEvent) => {
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
                .catch((f) => {
                  (self as any).postMessage(['r', f, e.data[0], 1]);
                });
            };
          }})()`,
        ],
        { type: 'text/javascript' }
      )
    )
  );

  constructor() {
    this.worker?.addEventListener('message', (e: MessageEvent) => {
      if (e.data[0] === 'r') {
        this.promises[e.data[2]][e.data[3]](e.data[1]);
        delete this.promises[e.data[2]];
      }
    });
  }

  public run(...args: any) {
    if (this.worker === null) {
      throw new Error('Worker is not active anymore');
    }

    return new Promise((resolve, reject) => {
      this.promises[++this.taskId] = [resolve, reject];

      const fn = args.shift();

      this.worker?.postMessage(
        [
          this.taskId,
          fn.toString(),
          args.map((m: unknown) =>
            typeof m === 'string' ? JSON.stringify(m) : m
          ),
        ],
        [args].filter(
          (x: unknown) =>
            x instanceof ArrayBuffer ||
            x instanceof MessagePort ||
            (self.ImageBitmap && x instanceof ImageBitmap)
        )
      );
    });
  }

  public terminate() {
    this.worker?.terminate();
    this.worker = null;
  }
}
