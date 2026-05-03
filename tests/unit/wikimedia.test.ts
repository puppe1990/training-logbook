import { afterEach, describe, expect, it, vi } from "vitest";

import { searchExerciseImage } from "@/lib/images/wikimedia";

describe("searchExerciseImage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns a primary image url and source metadata", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          query: {
            pages: {
              "1": {
                title: "File:Leg press machine.jpg",
                imageinfo: [
                  {
                    url: "https://upload.wikimedia.org/leg-press.jpg",
                    descriptionurl:
                      "https://commons.wikimedia.org/wiki/File:Leg_press_machine.jpg",
                  },
                ],
              },
            },
          },
        }),
      }),
    );

    const result = await searchExerciseImage("Leg press");

    expect(result?.imageUrl).toContain("wikimedia");
    expect(result?.sourceName).toBe("Wikimedia Commons");
  });
});
