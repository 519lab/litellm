import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { normalizeMessages } from "./ReplayButton";
import { readAndClearReplay } from "@/app/(dashboard)/playground/page";
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

describe("readAndClearReplay", () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => sessionStorage.clear());

  it("returns null when key is absent", () => {
    expect(readAndClearReplay()).toBeNull();
  });

  it("returns the payload and removes the key", () => {
    const payload = {
      model: "test-model",
      messages: [{ role: "user", content: "hello" }],
      request_id: "req-1",
    };
    sessionStorage.setItem("playground_replay", JSON.stringify(payload));

    const result = readAndClearReplay();

    expect(result).not.toBeNull();
    expect(result!.model).toBe("test-model");
    expect(result!.messages).toHaveLength(1);
    expect(result!.request_id).toBe("req-1");
    expect(sessionStorage.getItem("playground_replay")).toBeNull();
  });

  it("does not write to chatHistory in sessionStorage", () => {
    const payload = {
      model: "test-model",
      messages: [{ role: "user", content: "hello" }],
      request_id: "req-1",
    };
    sessionStorage.setItem("playground_replay", JSON.stringify(payload));

    readAndClearReplay();

    expect(sessionStorage.getItem("chatHistory")).toBeNull();
  });

  it("returns null and cleans up the key for a payload with non-string model", () => {
    sessionStorage.setItem("playground_replay", JSON.stringify({ model: 42, messages: [] }));

    const result = readAndClearReplay();

    expect(result).toBeNull();
    expect(sessionStorage.getItem("playground_replay")).toBeNull();
  });

  it("returns null and cleans up the key for a payload with non-array messages", () => {
    sessionStorage.setItem("playground_replay", JSON.stringify({ model: "gpt-4", messages: "not-an-array" }));

    const result = readAndClearReplay();

    expect(result).toBeNull();
    expect(sessionStorage.getItem("playground_replay")).toBeNull();
  });

  it("returns null and cleans up the key for malformed JSON", () => {
    sessionStorage.setItem("playground_replay", "{{broken");

    const result = readAndClearReplay();

    expect(result).toBeNull();
    expect(sessionStorage.getItem("playground_replay")).toBeNull();
  });
});
