// Internal
import { serializeArgs } from './utilities';

/**
 * A re-usable thread implementation based on https://github.com/developit/greenlet and https://github.com/developit/task-worklet
 */
export class Thread {
  private taskId = 0;
  private taskPromises: {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    [k: number]: [(value?: unknown) => void, (reason?: any) => void];
  } = {};
  private worker = new Worker(
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

    this.worker?.postMessage(['h']);
  }

  public run(...args: any) {
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
