import {
  createDropParams,
  deactivateDropParams,
  editDropParams,
  getDropParamsTransactionStatus,
  reconcileDropParamsTransactions
} from "../shared/drop-params/drop-params-transaction.mjs";

const command = process.argv[2];
if (process.argv.length !== 3 || !["create", "edit", "deactivate", "status", "reconcile"].includes(command)) {
  console.error("Usage: node scripts/drop-params-transaction.mjs <create|edit|deactivate|status|reconcile>");
  process.exitCode = 1;
} else {
  try {
    let result;
    if (command === "status") {
      result = await getDropParamsTransactionStatus();
    } else if (command === "reconcile") {
      result = await reconcileDropParamsTransactions();
    } else {
      let input = "";
      process.stdin.setEncoding("utf8");
      for await (const chunk of process.stdin) input += chunk;
      if (input.trim() === "") {
        throw new TypeError(`${command} requires one structured JSON object on stdin`);
      }
      const request = JSON.parse(input);
      if (!request || typeof request !== "object" || Array.isArray(request)) {
        throw new TypeError("transaction input must be a JSON object");
      }
      result = command === "create"
        ? await createDropParams(request)
        : command === "edit"
          ? await editDropParams(request)
          : await deactivateDropParams(request);
    }
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(JSON.stringify({
      ok: false,
      name: error?.name || "Error",
      code: error?.code || "transaction_failed",
      message: error?.message || String(error),
      operationId: error?.operationId || null,
      status: error?.status || null
    }, null, 2));
    process.exitCode = 1;
  }
}
