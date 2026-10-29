import { describe, it, expect } from "vitest";
import { TaskStatus, isValidDateString } from "../src/types";

describe("Core Types and Helpers", () => {
  it("validates standard task status enum values", () => {
    expect(TaskStatus.TODO).toBe("todo");
    expect(TaskStatus.IN_PROGRESS).toBe("in-progress");
    expect(TaskStatus.DONE).toBe("done");
    expect(TaskStatus.BLOCKED).toBe("blocked");
  });

  it("validates date string formats YYYY-MM-DD", () => {
    expect(isValidDateString("2026-10-29")).toBe(true);
    expect(isValidDateString("2026-02-30")).toBe(false);
    expect(isValidDateString("invalid")).toBe(false);
  });
});
