export enum Priorities {
  ImmediatePriority,
  HighPriority,
  NormalPriority,
  LowPriority,
}

export type PriorityLevel =
  | Priorities.ImmediatePriority
  | Priorities.HighPriority
  | Priorities.NormalPriority
  | Priorities.LowPriority
  | number;

export type StoreEntry = [taskId: number, task: unknown, args: unknown[]];

type QueueEntry = { priority: PriorityLevel; taskId: number };

/**
 * A priority queue implementation based on https://github.com/thi-ng/umbrella/blob/develop/packages/heaps/src/heap.ts
 */
export class PriorityQueue {
  private static compare = (a: number, b: number) =>
    a === b ? 0 : a < b ? -1 : a > b ? 1 : 0;

  private queue: QueueEntry[] = [];
  private store: Map<number, StoreEntry> = new Map();

  get length() {
    return this.queue.length;
  }

  public push(priority: PriorityLevel, data: StoreEntry) {
    this.store.set(data[0], data);
    this.queue.push({ priority, taskId: data[0] });
    this.percolateUp(this.queue.length - 1);
  }

  public pop() {
    const tail = this.queue.pop() || { priority: -1, taskId: -1 };
    let entry: QueueEntry;

    if (this.queue.length > 0) {
      entry = this.queue[0];
      this.queue[0] = tail;
      this.percolateDown(0);
    } else {
      entry = tail;
    }

    const data: StoreEntry | undefined = this.store.get(entry.taskId);
    this.store.delete(entry.taskId);

    return data;
  }

  private percolateUp(index: number) {
    const node = this.queue[index];

    while (index > 0) {
      const parentIndex = (index - 1) >> 1;
      const parent = this.queue[parentIndex];

      if (PriorityQueue.compare(node.priority, parent.priority) >= 0) {
        break;
      }

      this.queue[parentIndex] = node;
      this.queue[index] = parent;
      index = parentIndex;
    }
  }

  private percolateDown(index: number) {
    const length = this.queue.length;
    const node = this.queue[index];
    let child = (index << 1) + 1;

    while (child < length) {
      const next = child + 1;

      if (
        next < length &&
        PriorityQueue.compare(
          this.queue[child].priority,
          this.queue[next].priority
        ) >= 0
      ) {
        child = next;
      }

      if (
        PriorityQueue.compare(this.queue[child].priority, node.priority) < 0
      ) {
        this.queue[index] = this.queue[child];
      } else {
        break;
      }

      index = child;
      child = (index << 1) + 1;
    }

    this.queue[index] = node;
  }
}
