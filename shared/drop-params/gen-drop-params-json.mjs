import { generateOuterDropParamsJson } from "./drop-params-projector.mjs";

try {
  const result = await generateOuterDropParamsJson();
  console.log(`[drop-params] ${result.changed ? "wrote" : "unchanged"}`, result.path);
} catch (error) {
  console.error("[drop-params] generation failed:", error?.message || error);
  process.exitCode = 1;
}
