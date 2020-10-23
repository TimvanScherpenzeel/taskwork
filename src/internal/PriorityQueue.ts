// Internal
// import { BinaryHeap } from './BinaryHeap';

type Entry = { priority: number; taskId: number };

/**
 * A priority queue implementation based on https://github.com/thi-ng/umbrella/blob/develop/packages/heaps/src/heap.ts
 */
export class PriorityQueue {
  private static compare = (a: number, b: number) =>
    a === b ? 0 : a < b ? -1 : a > b ? 1 : 0;

  private values: Entry[] = [];
  private map: Map<number, unknown[]> = new Map();

  get length() {
    return this.values.length;
  }

  public push(priority: number, taskId: number, data: unknown[]) {
    this.map.set(taskId, data);
    this.values.push({ priority, taskId });
    this.percolateUp(this.values.length - 1);
  }

  public pop() {
    const tail = this.values.pop() || { priority: -1, taskId: -1 };
    let result: Entry;

    if (this.values.length > 0) {
      result = this.values[0];
      this.values[0] = tail;
      this.percolateDown(0);
    } else {
      result = tail;
    }

    const { taskId } = result;
    const data = this.map.get(taskId);
    this.map.delete(taskId);

    return data;
  }

  private percolateUp(index: number) {
    const node = this.values[index];

    while (index > 0) {
      const parentIndex = (index - 1) >> 1;
      const parent = this.values[parentIndex];

      if (PriorityQueue.compare(node.priority, parent.priority) >= 0) {
        break;
      }

      this.values[parentIndex] = node;
      this.values[index] = parent;
      index = parentIndex;
    }
  }

  private percolateDown(index: number) {
    const length = this.values.length;
    const node = this.values[index];
    let child = (index << 1) + 1;

    while (child < length) {
      const next = child + 1;

      if (
        next < length &&
        PriorityQueue.compare(
          this.values[child].priority,
          this.values[next].priority
        ) >= 0
      ) {
        child = next;
      }

      if (
        PriorityQueue.compare(this.values[child].priority, node.priority) < 0
      ) {
        this.values[index] = this.values[child];
      } else {
        break;
      }

      index = child;
      child = (index << 1) + 1;
    }

    this.values[index] = node;
  }
}
