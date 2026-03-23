import { describe, it, expect } from "vitest";
import {
  CONTENT_STATES,
  STATE_TRANSITIONS,
  isValidTransition,
} from "@nepalens/shared";

describe("Content State Machine", () => {
  describe("CONTENT_STATES", () => {
    it("has exactly 12 states", () => {
      expect(Object.keys(CONTENT_STATES)).toHaveLength(12);
    });

    it("contains all required states", () => {
      const expected = [
        "draft", "uploaded", "processing", "processing_failed",
        "pending_review", "approved", "rejected", "needs_changes",
        "published", "hidden", "removed", "reported",
      ];
      const actual = Object.values(CONTENT_STATES);
      for (const state of expected) {
        expect(actual).toContain(state);
      }
    });
  });

  describe("isValidTransition", () => {
    // Happy path transitions
    const validTransitions: [string, string][] = [
      ["draft", "uploaded"],
      ["uploaded", "processing"],
      ["processing", "pending_review"],
      ["processing", "processing_failed"],
      ["processing_failed", "processing"], // retry
      ["pending_review", "approved"],
      ["pending_review", "rejected"],
      ["pending_review", "needs_changes"],
      ["approved", "published"],
      ["approved", "hidden"],
      ["approved", "removed"],
      ["approved", "reported"],
      ["rejected", "pending_review"], // resubmit
      ["needs_changes", "pending_review"], // resubmit
      ["published", "hidden"],
      ["published", "removed"],
      ["published", "reported"],
      ["hidden", "published"],
      ["hidden", "removed"],
      ["removed", "pending_review"], // restore
      ["reported", "approved"],
      ["reported", "removed"],
    ];

    it.each(validTransitions)(
      "allows transition from %s to %s",
      (from, to) => {
        expect(isValidTransition(from, to)).toBe(true);
      }
    );

    // Invalid transitions
    const invalidTransitions: [string, string][] = [
      ["draft", "approved"],
      ["draft", "published"],
      ["uploaded", "approved"],
      ["processing", "approved"],
      ["pending_review", "published"], // must be approved first
      ["rejected", "published"],
      ["published", "draft"],
      ["approved", "draft"],
      ["removed", "published"],
      ["hidden", "draft"],
    ];

    it.each(invalidTransitions)(
      "blocks transition from %s to %s",
      (from, to) => {
        expect(isValidTransition(from, to)).toBe(false);
      }
    );

    it("returns false for unknown states", () => {
      expect(isValidTransition("nonexistent", "approved")).toBe(false);
      expect(isValidTransition("draft", "nonexistent")).toBe(false);
    });
  });

  describe("STATE_TRANSITIONS completeness", () => {
    it("every state has defined transitions", () => {
      for (const state of Object.values(CONTENT_STATES)) {
        expect(STATE_TRANSITIONS).toHaveProperty(state);
        expect(Array.isArray(STATE_TRANSITIONS[state])).toBe(true);
      }
    });

    it("all transition targets are valid states", () => {
      const validStates = new Set(Object.values(CONTENT_STATES));
      for (const [from, targets] of Object.entries(STATE_TRANSITIONS)) {
        for (const target of targets) {
          expect(validStates.has(target as any)).toBe(true);
        }
      }
    });

    it("draft can only go to uploaded", () => {
      expect(STATE_TRANSITIONS["draft"]).toEqual(["uploaded"]);
    });

    it("processing_failed can retry (go back to processing)", () => {
      expect(STATE_TRANSITIONS["processing_failed"]).toContain("processing");
    });
  });
});
