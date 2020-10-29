/* eslint-disable @typescript-eslint/no-explicit-any */

// Types
export type TaskPromises = {
  [k: number]: [(value?: unknown) => void, (reason?: any) => void];
};

/**
 * A re-usable thread implementation based on https://github.com/developit/greenlet and https://github.com/developit/task-worklet
 */
export class Thread {
  public static serializeArgs = (args: any[] = []) =>
    args.map((m: unknown) => (typeof m === 'string' ? JSON.stringify(m) : m));

  private taskId = 0;
  private taskPromises: TaskPromises = {};
  private worker = new Worker(
    URL.createObjectURL(
      new Blob([
        `(${() =>
          ((self as any).onmessage = (e: MessageEvent) => {
            switch (e.data[0]) {
              case 'h':
                setTimeout(() => (self as any).postMessage(['h']), 3000);
                break;
              case 't':
                Promise.resolve(
                  Function(`return(${e.data[2]})(${e.data[3]})`)()
                )
                  .then((r) => {
                    (self as any).postMessage(
                      ['r', r, e.data[1], 0],
                      [r].filter(
                        (x: unknown) =>
                          x instanceof ArrayBuffer ||
                          x instanceof MessagePort ||
                          (ImageBitmap && x instanceof ImageBitmap)
                      )
                    );
                  })
                  .catch((f) =>
                    (self as any).postMessage(['r', f, e.data[1], 1])
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

    this.worker?.postMessage(['h']);
  }

  public run(...args: any) {
    return new Promise((resolve, reject) => {
      this.taskPromises[++this.taskId] = [resolve, reject];

      const fn = args.shift();

      this.worker?.postMessage(
        ['t', this.taskId, fn.toString(), Thread.serializeArgs(args)],
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
