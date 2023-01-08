import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { ddbClient } from '../ddbClient';
import {
    DeleteItemCommand,
    GetItemCommand,
    PutItemCommand,
    QueryCommand,
    ScanCommand,
    UpdateItemCommand,
} from '@aws-sdk/client-dynamodb';
import { v4 as uuidV4 } from 'uuid';

export const getProductById = async (productId) => {
    console.log("getProduct with id: ", productId);

    try {
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: marshall({id: productId}),
        };

        const {Item} = await ddbClient.send(new GetItemCommand(params));

        console.log(Item);
        return (Item) ? unmarshall(Item) : {};

    } catch (e) {
        console.error(e);
        throw e;
    }
}

export const getAllProducts = async () => {
    console.log("getAllProducts");
    try {
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
        };

        const {Items} = await ddbClient.send(new ScanCommand(params));

        console.log(Items);
        return (Items) ? Items.map((item) => unmarshall(item)) : {};

    } catch (e) {
        console.error(e);
        throw e;
    }
}

export const createProduct = async (event) => {
    console.log(`createProduct function. event : "${JSON.stringify(event.body, undefined, 2)}"`);
    try {
        const productRequest = JSON.parse(event.body);
        // set productid
        productRequest.id = uuidV4();

        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Item: marshall(productRequest || {}),
        };

        const createResult = await ddbClient.send(new PutItemCommand(params));

        console.log(createResult);
        return createResult;

    } catch (e) {
        console.error(e);
        throw e;
    }
}

export const deleteProduct = async (productId) => {
    console.log(`deleteProduct function. productId : "${productId}"`);

    try {
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: marshall({id: productId}),
        };

        const deleteResult = await ddbClient.send(
            new DeleteItemCommand(params));

        console.log(deleteResult);
        return deleteResult;
    } catch (e) {
        console.error(e);
        throw e;
    }
}

export const updateProduct = async (event) => {
    console.log(`updateProduct function. event : "${event}"`);
    try {
        const requestBody = JSON.parse(event.body);
        const objKeys = Object.keys(requestBody);
        console.log(
            `updateProduct function. requestBody : "${requestBody}", objKeys: "${objKeys}"`);

        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: marshall({id: event.pathParameters.id}),
            UpdateExpression: `SET ${objKeys.map(
                (_, index) => `#key${index} = :value${index}`).join(", ")}`,
            ExpressionAttributeNames: objKeys.reduce((acc, key, index) => ({
                ...acc,
                [`#key${index}`]: key,
            }), {}),
            ExpressionAttributeValues: marshall(
                objKeys.reduce((acc, key, index) => ({
                    ...acc,
                    [`:value${index}`]: requestBody[key],
                }), {})),
        };

        const updateResult = await ddbClient.send(
            new UpdateItemCommand(params));

        console.log(updateResult);
        return updateResult;
    } catch (e) {
        console.error(e);
        throw e;
    }

}

export const getProductsByCategory = async (event) => {
    console.log("getProductsByCategory: ", event.queryStringParameters);
    try {
        // GET product/1234?category=Phone
        const productId = event.pathParameters.id;
        const category = event.queryStringParameters.category;

        const params = {
            KeyConditionExpression: "id = :productId",
            FilterExpression: "contains (category, :category)",
            ExpressionAttributeValues: {
                ":productId": {S: productId},
                ":category": {S: category},
            },
            TableName: process.env.DYNAMODB_TABLE_NAME,
        };

        const {Items} = await ddbClient.send(new QueryCommand(params));

        console.log(Items);
        return Items.map((item) => unmarshall(item));
    } catch (e) {
        console.error(e);
        throw e;
    }
}
