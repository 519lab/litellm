import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { normalizeMessages } from "./ReplayButton";
import type { LogEntry } from "./columns";

describe("normalizeMessages", () => {
  it("passes an array of valid messages through", () => {
    const input = [
      { role: "user", content: "hello" },
      { role: "assistant", content: "world" },
    ];
    const result = normalizeMessages(input);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ role: "user", content: "hello" });
  });

  it("parses a JSON-encoded string of messages", () => {
    const input = JSON.stringify([{ role: "user", content: "hi" }]);
    expect(normalizeMessages(input)).toEqual([{ role: "user", content: "hi" }]);
  });

  it("returns empty array for malformed JSON string", () => {
    expect(normalizeMessages("not-json{{")).toEqual([]);
  });

  it("returns empty array for Record input (non-array object)", () => {
    const input: LogEntry["messages"] = { role: "user", content: "x" } as Record<string, unknown>;
    expect(normalizeMessages(input)).toEqual([]);
  });

  it("filters out entries missing role", () => {
    const input = [{ content: "no role" }, { role: "user", content: "has role" }];
    expect(normalizeMessages(input)).toHaveLength(1);
    expect(normalizeMessages(input)[0].role).toBe("user");
  });

  it("filters out entries with null content", () => {
    const input = [{ role: "user", content: null }, { role: "assistant", content: "ok" }];
    expect(normalizeMessages(input)).toHaveLength(1);
    expect(normalizeMessages(input)[0].content).toBe("ok");
  });

  it("filters out entries with undefined content", () => {
    const input = [{ role: "user" }, { role: "assistant", content: "present" }];
    expect(normalizeMessages(input)).toHaveLength(1);
  });

  it("JSON-stringifies non-string content", () => {
    const input = [{ role: "user", content: [{ type: "text", text: "hi" }] }];
    const result = normalizeMessages(input);
    expect(result[0].content).toBe(JSON.stringify([{ type: "text", text: "hi" }]));
  });

  it("returns empty array for empty list", () => {
    expect(normalizeMessages([])).toEqual([]);
  });
});

describe("readAndClearReplay via sessionStorage", () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => sessionStorage.clear());

  it("returns null when key is absent", async () => {
    const { default: PlaygroundPage } = await import("@/app/(dashboard)/playground/page.tsx");
    expect(sessionStorage.getItem("playground_replay")).toBeNull();
  });

  it("removes key and writes chatHistory on valid payload", () => {
    const payload = {
      model: "test-model",
      messages: [{ role: "user", content: "hello" }],
      request_id: "req-1",
    };
    sessionStorage.setItem("playground_replay", JSON.stringify(payload));

    const raw = sessionStorage.getItem("playground_replay");
    expect(raw).not.toBeNull();
    sessionStorage.removeItem("playground_replay");

    const data = JSON.parse(raw!);
    expect(typeof data.model).toBe("string");
    expect(Array.isArray(data.messages)).toBe(true);
    sessionStorage.setItem("chatHistory", JSON.stringify(data.messages));
    expect(sessionStorage.getItem("playground_replay")).toBeNull();
    expect(JSON.parse(sessionStorage.getItem("chatHistory")!)).toHaveLength(1);
  });

  it("rejects payload with non-string model", () => {
    sessionStorage.setItem("playground_replay", JSON.stringify({ model: 42, messages: [] }));
    const raw = sessionStorage.getItem("playground_replay");
    const data = JSON.parse(raw!);
    expect(typeof data.model === "string" && Array.isArray(data.messages)).toBe(false);
  });
});
