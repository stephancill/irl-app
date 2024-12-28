import { initExpressApp } from "../lib/bullboard";

export { alertsBulkWorker } from "./alerts";
export { timezonesWorker } from "./timezones";

// Run bull board
initExpressApp();
