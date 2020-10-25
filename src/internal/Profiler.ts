declare global {
  interface Performance {
    memory: { usedJSHeapSize: number };
  }
}

export class Profiler {
  private startTime = 0;
  private endTime = 0;
  private frameCount = 0;
  private frameTime = 0;
  private framesPerSecond = 0;
  private frameCap = 1000 / 30;
  private requestId = 0;

  // private frameDelta = 0;
  // private defaultRefreshRate = 60;
  // private refreshRates = [30, 60, 72, 90, 100, 120, 144, 240];

  constructor() {
    this.startTime = performance.now();
    this.update = this.update.bind(this);
    this.requestId = window.requestAnimationFrame(this.update);
  }

  public update() {
    this.requestId = window.requestAnimationFrame(this.update);

    const time = performance.now();
    const delta = time - this.startTime;

    if (delta > this.frameCap) {
      this.frameCount++;
      this.startTime = time - (delta % this.frameCap);
      this.frameTime = this.startTime;

      if (time >= this.endTime + 1000) {
        this.framesPerSecond = Math.round(
          (this.frameCount * 1000) / (time - this.endTime)
        );
        this.endTime = time;
        this.frameCount = 0;
      }

      console.log(this.framesPerSecond);
    }
  }

  public stop() {
    window.cancelAnimationFrame(this.requestId);
  }
}
