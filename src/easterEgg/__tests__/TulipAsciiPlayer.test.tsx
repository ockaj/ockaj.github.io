import { describe, it, expect } from "vitest";
import { TULIP_CONFIG, TULIP_B64, TULIP_CB64 } from "../tulipData";
import {
  isValidModalHash,
  resolveSectionFromHash,
} from "../../utils/sectionResolution";

async function inflateTestBytes(b64: string): Promise<Uint8Array> {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  if (typeof DecompressionStream === "undefined") {
    return bytes;
  }
  const stream = new Blob([bytes])
    .stream()
    .pipeThrough(new DecompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

describe("TulipAsciiPlayer & EasterEgg Configuration", () => {
  it("exports valid cropped configuration parameters", () => {
    expect(TULIP_CONFIG.cols).toBe(112);
    expect(TULIP_CONFIG.rows).toBe(49);
    expect(TULIP_CONFIG.cw).toBe(56);
    expect(TULIP_CONFIG.ch).toBe(25);
    expect(TULIP_CONFIG.fps).toBe(12);
    expect(TULIP_CONFIG.mono).toBe("#9be89b");
  });

  it("exports non-empty base64 data strings", () => {
    expect(TULIP_B64.length).toBeGreaterThan(1000);
    expect(TULIP_CB64.length).toBeGreaterThan(1000);
  });

  it("decompresses ASCII frames into exactly 180 animation frames", async () => {
    const uncompressed = await inflateTestBytes(TULIP_B64);
    const text = new TextDecoder().decode(uncompressed);
    const frames = text.split(String.fromCharCode(30));

    expect(frames).toHaveLength(180);
    const firstFrameLines = frames[0].split("\n");
    expect(firstFrameLines).toHaveLength(TULIP_CONFIG.rows);
    expect(firstFrameLines[0]).toHaveLength(TULIP_CONFIG.cols);
  });

  it("decompresses tint buffer matching dimensions for all 180 frames", async () => {
    const uncompressed = await inflateTestBytes(TULIP_CB64);
    const expectedFrameSize = TULIP_CONFIG.cw * TULIP_CONFIG.ch * 3;
    const totalExpectedSize = 180 * expectedFrameSize;

    expect(uncompressed).toHaveLength(totalExpectedSize);
  });

  it("validates #bpmn-process modal hash routing", () => {
    expect(isValidModalHash("bpmn-process")).toBe(true);
    expect(isValidModalHash("#bpmn-process")).toBe(true);
    expect(resolveSectionFromHash("#bpmn-process")).toBe("home");
  });

  it("handles empty, invalid, and unknown boundary hashes correctly", () => {
    expect(isValidModalHash("")).toBe(false);
    expect(isValidModalHash("unknown-hash")).toBe(false);
    expect(isValidModalHash("null")).toBe(false);
    expect(isValidModalHash("undefined")).toBe(false);
    expect(resolveSectionFromHash("")).toBe("home");
    expect(resolveSectionFromHash("invalid-hash")).toBe("home");
  });
});
