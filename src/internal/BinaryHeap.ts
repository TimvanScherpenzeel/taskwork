type Entry = { priority: number; taskId: number };

/**
 * A binary min-heap implementation based on https://github.com/thi-ng/umbrella/blob/develop/packages/heaps/src/heap.ts
 */
export class BinaryHeap {
  private static compare(a: Entry, b: Entry): number {
    if (a.priority === b.priority) {
      return 0;
    }

    return a.priority < b.priority ? -1 : a.priority > b.priority ? 1 : 0;
  }

  private values: Entry[] = [];

  get length() {
    return this.values.length;
  }

  public push(entry: Entry) {
    this.values.push(entry);
    this.percolateUp(this.values.length - 1);
  }

  public pop(): Entry {
    const tail = this.values.pop() || { priority: -1, taskId: -1 };
    let result: Entry;

    if (this.values.length > 0) {
      result = this.values[0];
      this.values[0] = tail;
      this.percolateDown(0);
    } else {
      result = tail;
    }

    return result;
  }

  private percolateUp(index: number) {
    const node = this.values[index];

    while (index > 0) {
      const parentIndex = (index - 1) >> 1;
      const parent = this.values[parentIndex];

      if (BinaryHeap.compare(node, parent) >= 0) {
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
        BinaryHeap.compare(this.values[child], this.values[next]) >= 0
      ) {
        child = next;
      }

      if (BinaryHeap.compare(this.values[child], node) < 0) {
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
