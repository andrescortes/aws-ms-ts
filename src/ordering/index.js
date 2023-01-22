const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const { ddbClient } = require("./ddbClient");
const { PutItemCommand } = require("@aws-sdk/client-dynamodb");

exports.handler = async function (event) {
    console.log("request: ", JSON.stringify(event, undefined, 2));
    // TODO - catch and Process async EventBridge invocation and syn API Gateway  invocation
    const eventType = event['detail-type'];
    if (eventType !== undefined) {
        // EventBridge invocation
        await eventBridgeInvocation(event);
    } else {
        // api gateway invocation -- return sync response
        return apiGatewayInvocation(event);
    }
};

//create  eventBridgeInvocation method with const
const eventBridgeInvocation = async (event) => {
    console.log("EventBridge Invocation", JSON.stringify(event, undefined, 2));
    // create order item into db
    await createOrder(event.detail);
};

// create arrow function called createOrder

const createOrder = async (basketCheckoutEvent) => {
    try {
        console.log("createOrder", JSON.stringify(basketCheckoutEvent, undefined, 2));
        // set orderDate for SK of order dynamodb
        const orderDate = new Date().toISOString();
        basketCheckoutEvent.orderDate = orderDate;
        console.log(basketCheckoutEvent);

        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Item: marshall(basketCheckoutEvent || {}),
        };

        const createResult = await ddbClient.send(new PutItemCommand(params));
        console.log("createResult: ", createResult);
        return createResult;

    } catch (err) {
        console.error("createOrder Error", err);
        throw err;
    }
};


// create apiGatewayInvocation method with const
const apiGatewayInvocation = async (event) => {
    let body;
    try {
        switch (event.httpMethod) {
            case 'GET':
                if (event.pathParameters != null) {
                    body = await getOrder(event);
                } else {
                    body = await getAllOrders();
                }
                break;

            default:
                throw new Error(`Unsupported method "${event.httpMethod}"`);
        }
        console.log("body: ", body);
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: `Successfully finished ${event.httpMethod} operation`,
                body: body
            })
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: `Failed ${event.httpMethod} operation`,
                errorMsg: error.message,
                errorStack: error.stack
            })
        };
    }
}

// create arrow function called getOrder
const getOrder = async (event) => {
    try {
        // expected request : xxx/order/swn?orderDate=timestamp
        console.log("getOrder", JSON.stringify(event, undefined, 2));
        const userName = event.pathParameters.userName;
        const orderDate = event.queryStringParameters.orderDate;

        const params = {
            KeyConditionExpression: "userName = :userName and orderDate = :orderDate",
            ExpressionAttributeValues: {
                ":userName": { S: userName },
                ":orderDate": { S: orderDate }
            }
        };
        const { Items } = await ddbClient.send(new QueryCommand(params));
        console.log("Items: ", Items);
        return Items.map((item) => unmarshall(item));
    } catch (err) {
        console.error("getOrder Error", err);
        throw err;
    }
}

// create arrow function called getAllOrders
const getAllOrders = async () => {
    console.log("getAllOrders");
    try {
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
        };
        const { Items } = await ddbClient.send(new ScanCommand(params));
        console.log("Items: ", Items);
        return (Items) ? Items.map((item) => unmarshall(item)) : {};
    } catch (err) {
        console.error("getAllOrders Error", err);
        throw err;
    }
}