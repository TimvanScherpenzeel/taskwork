export class Profiler {
  public start(markName: string) {
    performance.mark(`${markName}-start`);
  }

  public end(markName: string) {
    performance.mark(`${markName}-end`);
    performance.measure(
      `${markName}-measure`,
      `${markName}-start`,
      `${markName}-end`
    );

    performance.getEntriesByType('measure').forEach((entry) => {
      console.table(entry.toJSON());
    });

    performance.clearMarks(markName);
    performance.clearMeasures(`${markName}-measure`);
  }
}
