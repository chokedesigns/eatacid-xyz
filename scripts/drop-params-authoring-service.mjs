import {
  DROP_PARAMS_AUTHORING_HOST,
  DROP_PARAMS_AUTHORING_PORT,
  startDropParamsAuthoringService
} from "../shared/drop-params/drop-params-authoring-service.mjs";

let instance;
try {
  instance = await startDropParamsAuthoringService();
} catch (error) {
  console.error(`[drop-params-authoring] ${error.code || "startup_failed"}: ${error.message}`);
  process.exitCode = 1;
}

if (instance?.reused) {
  console.log(`[drop-params-authoring] reusing existing service at http://${DROP_PARAMS_AUTHORING_HOST}:${DROP_PARAMS_AUTHORING_PORT}`);
} else if (instance?.server) {
  console.log(`[drop-params-authoring] READY at http://${DROP_PARAMS_AUTHORING_HOST}:${DROP_PARAMS_AUTHORING_PORT}`);
  let closing = false;
  const close = signal => {
    if (closing) return;
    closing = true;
    instance.server.close(error => {
      if (error) {
        console.error(`[drop-params-authoring] shutdown failed: ${error.message}`);
        process.exitCode = 1;
      } else {
        console.log(`[drop-params-authoring] stopped (${signal})`);
      }
    });
  };
  process.once("SIGINT", () => close("SIGINT"));
  process.once("SIGTERM", () => close("SIGTERM"));
}
