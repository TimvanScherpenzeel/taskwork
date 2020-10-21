// Internal
import { Thread } from './internal/Thread';

// SharedArrayBuffer
// Semaphore
// WebWorkers
// Atomic

// wait()
// post() / signal()

// lock() / release() like Mutex locks

const align32Bits = (v: number) => (v & 0xffffffffffffc) + (v & 0x3 ? 0x4 : 0);

export class Scheduler {
  private sharedBuffer: SharedArrayBuffer;
  private sharedBufferArray: Uint32Array;
  private threadCount: number;
  private threads: Thread[];

  constructor(bufferSize: number, threadCount?: number) {
    if (!(bufferSize > 0)) {
      throw new RangeError('bufferSize must be a positive number');
    }

    // Align to 32-bits
    bufferSize = align32Bits(bufferSize);

    this.threadCount =
      threadCount || Math.min(Math.max(navigator.hardwareConcurrency, 2), 4);
    this.sharedBuffer = new SharedArrayBuffer(
      Uint32Array.BYTES_PER_ELEMENT * bufferSize
    );
    this.sharedBufferArray = new Uint32Array(this.sharedBuffer);
    this.threads = [...Array(this.threadCount)].map(() => new Thread());
  }
}
