import { SIM } from "@/game/config/constants";

// fixed-timestep game loop
// simulation runs in equal slices so movement and collision behave the same on any frame rate
// however rendering happens once per animation frame
export class Loop {
  private rafId = 0;
  private running = false;
  private lastTime = 0;
  private accumulator = 0;

  constructor(
    private readonly onStep: (dt: number) => void,
    private readonly onRender: (frameTime: number) => void // receives real seconds elapsed this frame (for independent easing)
  ) {}

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.rafId = requestAnimationFrame(this.tick);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  private tick = (now: number) => {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(this.tick);

    // Seconds since previous frame
    // capped so a long pause (eg a backgrounded tab) doesn't unleash a flood of catch-up steps
    const frameTime = Math.min((now - this.lastTime) / 1000, SIM.timestep * SIM.maxStepsPerFrame);
    this.lastTime = now;
    this.accumulator += frameTime;

    while (this.accumulator >= SIM.timestep) {
      this.onStep(SIM.timestep);
      this.accumulator -= SIM.timestep;
    }

    this.onRender(frameTime);
  };
}
