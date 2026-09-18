export interface PauseableTimerOptions {
  durationMs: number;
  onExpire: () => void;
}

export class PauseableTimer {
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private remainingMs: number;
  private startTime = 0;
  private isHovered = false;
  private isFocused = false;
  private isDisposed = false;
  private onExpire: () => void;

  constructor(options: PauseableTimerOptions) {
    this.remainingMs = options.durationMs;
    this.onExpire = options.onExpire;
  }

  start(): void {
    if (this.isDisposed || this.timerId !== null) return;
    if (this.isHovered || this.isFocused) return;
    if (this.remainingMs <= 0) {
      this.triggerExpire();
      return;
    }
    this.startTime = Date.now();
    this.timerId = setTimeout(() => {
      this.timerId = null;
      this.triggerExpire();
    }, this.remainingMs);
  }

  pause(): void {
    if (this.isDisposed || this.timerId === null) return;
    clearTimeout(this.timerId);
    this.timerId = null;
    const elapsed = Date.now() - this.startTime;
    this.remainingMs = Math.max(0, this.remainingMs - elapsed);
  }

  resume(): void {
    if (this.isDisposed || this.isHovered || this.isFocused) return;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.remainingMs <= 0) {
      this.triggerExpire();
      return;
    }
    this.startTime = Date.now();
    this.timerId = setTimeout(() => {
      this.timerId = null;
      this.triggerExpire();
    }, this.remainingMs);
  }

  setHovered(hovered: boolean): void {
    if (this.isDisposed) return;
    this.isHovered = hovered;
    if (hovered) {
      this.pause();
    } else {
      this.resume();
    }
  }

  setFocused(focused: boolean): void {
    if (this.isDisposed) return;
    this.isFocused = focused;
    if (focused) {
      this.pause();
    } else {
      this.resume();
    }
  }

  dispose(): void {
    this.isDisposed = true;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  getRemainingMs(): number {
    if (this.timerId !== null) {
      const elapsed = Date.now() - this.startTime;
      return Math.max(0, this.remainingMs - elapsed);
    }
    return this.remainingMs;
  }

  isPaused(): boolean {
    return this.isHovered || this.isFocused;
  }

  private triggerExpire(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;
    this.onExpire();
  }
}
