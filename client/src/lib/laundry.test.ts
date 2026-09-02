import { describe, expect, it } from "vitest";
import { customerStatusSteps, getCustomerNextStep } from "./laundry";

describe("customer tracking UX", () => {
  it("keeps the six operational statuses in order", () => {
    expect(customerStatusSteps.map(step => step.key)).toEqual([
      "to_collect",
      "received",
      "washing",
      "ready",
      "in_delivery",
      "delivered",
    ]);
  });

  it("explains the next step for each status", () => {
    expect(getCustomerNextStep("to_collect")).toContain("collecte");
    expect(getCustomerNextStep("washing")).toContain("préparation");
    expect(getCustomerNextStep("delivered")).toContain("terminée");
  });
});
