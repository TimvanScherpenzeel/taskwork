// Vendor
import { Heap } from '@thi.ng/heaps';

interface Entry {
  priority: number;
  data: unknown[];
}

/**
 * A priority queue implementation based on https://github.com/thi-ng/umbrella/blob/develop/packages/heaps/src/heap.ts
 */
export class PriorityQueue {
  private map: Map<number, unknown[]> = new Map();
  private heap: Heap<number> = new Heap<number>();

  constructor(entries?: Entry[]) {
    if (entries) {
      this.into(entries);
    }
  }

  get length() {
    return this.heap.length;
  }

  public into(entries: Entry[]) {
    entries.forEach(({ priority, data }) => this.push(priority, data));
  }

  public push(priority: number, data: unknown[]) {
    this.map.set(priority, data);
    this.heap.push(priority);
  }

  public pop() {
    const key = this.heap.pop();
    const value = this.map.get(key);
    this.map.delete(key);

    return value;
  }

  public peek() {
    const key = this.heap.peek();
    const value = this.map.get(key);

    return value;
  }

  public clear() {
    this.heap.clear();
    this.map.clear();
  }
}
