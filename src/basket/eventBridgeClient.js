import { EventBridgeClient } from "@aws-sdk/client-eventbridge";

// create an amazon eventBridge client object
export const ebClient = new EventBridgeClient();