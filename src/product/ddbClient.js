// Create service client module using ES6 syntax.
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
// Create an Amazon DynamoDB service client object.
const ddbClient = new DynamoDBClient({
    region: 'us-east-1',
});
export { ddbClient };
