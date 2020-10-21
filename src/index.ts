// Internal
import { Thread } from './internal';

console.log('hello');

// SharedArrayBuffer
// Semaphore
// WebWorkers
// Atomic

// wait()
// post() / signal()

// lock() / release() like Mutex locks

export class Scheduler {
  private size: number;

  constructor(size: number) {
    this.size = size || Math.min(Math.max(navigator.hardwareConcurrency, 2), 4);
  }
}
