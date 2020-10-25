declare global {
  interface Performance {
    memory: { usedJSHeapSize: number };
  }
}

export class Profiler {
  private currentTime = 0;
  private startTime = 0;
  private endTime = 0;
  private frameCount = 0;
  private frameDelta = 0;
  private framesPerSecond = 0;
  private frameCap = 1000 / 30;
  private requestId = 0;

  constructor() {
    this.startTime = performance.now();
    this.update = this.update.bind(this);
    this.update();
  }

  public update() {
    this.requestId = window.requestAnimationFrame(this.update);

    this.currentTime = performance.now();
    this.frameDelta = this.currentTime - this.startTime;

    if (this.frameDelta > this.frameCap) {
      this.frameCount++;
      this.startTime = this.currentTime - (this.frameDelta % this.frameCap);

      if (this.currentTime >= this.endTime + 1000) {
        this.framesPerSecond = Math.round(
          (this.frameCount * 1000) / (this.currentTime - this.endTime)
        );
        this.endTime = this.currentTime;
        this.frameCount = 0;
      }

      // Perfrom expensive work

      console.log(this.framesPerSecond);
    }
  }

  public stop() {
    window.cancelAnimationFrame(this.requestId);
  }
}
