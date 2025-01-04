import { initExpressApp } from "../lib/bullboard";

export { alertsBulkWorker } from "./alerts";
export { timezonesWorker } from "./timezones";
export { newPostNotificationsWorker } from "./new-posts";

// Run bull board
initExpressApp();
