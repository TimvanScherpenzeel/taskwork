// Internal
import { BinaryHeap } from './BinaryHeap';

/**
 * A priority queue implementation based on https://github.com/thi-ng/umbrella/blob/develop/packages/heaps/src/heap.ts
 */
export class PriorityQueue {
  private map: Map<number, unknown[]> = new Map();
  private heap: BinaryHeap = new BinaryHeap();

  get length() {
    return this.heap.length;
  }

  public push(priority: number, taskId: number, data: unknown[]) {
    this.map.set(taskId, data);
    this.heap.push({ priority, taskId });
  }

  public pop() {
    const { taskId } = this.heap.pop();
    const data = this.map.get(taskId);
    this.map.delete(taskId);

    return data;
  }
}
