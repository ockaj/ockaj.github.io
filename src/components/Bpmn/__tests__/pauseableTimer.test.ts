import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PauseableTimer } from "../pauseableTimer";

describe("PauseableTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should trigger onExpire after the duration expires", () => {
    const onExpire = vi.fn();
    const timer = new PauseableTimer({ durationMs: 10000, onExpire });

    timer.start();

    vi.advanceTimersByTime(9999);
    expect(onExpire).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it("should pause on hover and resume on pointer leave with exact remaining duration", () => {
    const onExpire = vi.fn();
    const timer = new PauseableTimer({ durationMs: 10000, onExpire });

    timer.start();

    // Advance 3 seconds
    vi.advanceTimersByTime(3000);
    expect(onExpire).not.toHaveBeenCalled();

    // Hover starts
    timer.setHovered(true);
    expect(timer.isPaused()).toBe(true);

    // Advance 15 seconds while hovered
    vi.advanceTimersByTime(15000);
    expect(onExpire).not.toHaveBeenCalled();

    // Pointer leaves, resumes with 7000ms remaining
    timer.setHovered(false);
    expect(timer.isPaused()).toBe(false);

    vi.advanceTimersByTime(6999);
    expect(onExpire).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it("should pause on focus and resume on blur", () => {
    const onExpire = vi.fn();
    const timer = new PauseableTimer({ durationMs: 10000, onExpire });

    timer.start();

    vi.advanceTimersByTime(5000);
    timer.setFocused(true);

    vi.advanceTimersByTime(20000);
    expect(onExpire).not.toHaveBeenCalled();

    timer.setFocused(false);

    vi.advanceTimersByTime(4999);
    expect(onExpire).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it("should keep timer paused when unhovered but still focused", () => {
    const onExpire = vi.fn();
    const timer = new PauseableTimer({ durationMs: 10000, onExpire });

    timer.start();
    vi.advanceTimersByTime(2000);

    // Hover then focus
    timer.setHovered(true);
    timer.setFocused(true);

    // Hover ends, but focus remains
    timer.setHovered(false);
    expect(timer.isPaused()).toBe(true);

    vi.advanceTimersByTime(10000);
    expect(onExpire).not.toHaveBeenCalled();

    // Focus ends
    timer.setFocused(false);
    expect(timer.isPaused()).toBe(false);

    vi.advanceTimersByTime(7999);
    expect(onExpire).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it("should keep timer paused when blurred but still hovered", () => {
    const onExpire = vi.fn();
    const timer = new PauseableTimer({ durationMs: 10000, onExpire });

    timer.start();
    vi.advanceTimersByTime(4000);

    timer.setFocused(true);
    timer.setHovered(true);

    // Focus blurs, but hover remains
    timer.setFocused(false);
    expect(timer.isPaused()).toBe(true);

    vi.advanceTimersByTime(10000);
    expect(onExpire).not.toHaveBeenCalled();

    // Hover ends
    timer.setHovered(false);
    expect(timer.isPaused()).toBe(false);

    vi.advanceTimersByTime(6000);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it("should prevent expiration after dispose is called", () => {
    const onExpire = vi.fn();
    const timer = new PauseableTimer({ durationMs: 10000, onExpire });

    timer.start();
    vi.advanceTimersByTime(5000);

    timer.dispose();

    vi.advanceTimersByTime(20000);
    expect(onExpire).not.toHaveBeenCalled();
  });

  it("should accurately track getRemainingMs while running and paused", () => {
    const onExpire = vi.fn();
    const timer = new PauseableTimer({ durationMs: 10000, onExpire });

    timer.start();
    vi.advanceTimersByTime(4000);
    expect(timer.getRemainingMs()).toBe(6000);

    timer.setHovered(true);
    vi.advanceTimersByTime(5000);
    expect(timer.getRemainingMs()).toBe(6000);

    timer.setHovered(false);
    vi.advanceTimersByTime(2000);
    expect(timer.getRemainingMs()).toBe(4000);
  });
});
