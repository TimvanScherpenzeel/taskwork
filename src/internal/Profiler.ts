export class Profiler {
  public start(markName: string) {
    performance.mark(`${markName}-start`);
  }

  public end(markName: string) {
    performance.mark(`${markName}-end`);

    performance.measure(`${markName}`, `${markName}-start`, `${markName}-end`);

    const entries = performance.getEntriesByType('measure');

    for (const entry of entries) {
      console.table(entry.toJSON());
    }
  }
}
