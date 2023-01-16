import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { ddbClient } from '../ddbClient';
import {
    DeleteItemCommand,
    GetItemCommand,
    PutItemCommand,
    ScanCommand,
} from '@aws-sdk/client-dynamodb';
import { v4 as uuidV4 } from 'uuid';

export const getBasketById = async (userName) => {
    console.log("getBasket with id: ", userName);

    try {
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: marshall({id: userName}),
        };

        const {Item} = await ddbClient.send(new GetItemCommand(params));

        console.log(Item);
        return (Item) ? unmarshall(Item) : {};

    } catch (e) {
        console.error(e);
        throw e;
    }
}

export const getAllBaskets = async () => {
    console.log("getAllBaskets");
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

export const checkoutBasket = async (event) => {
    console.log(`checkoutBasket function. event : "${JSON.stringify(event.body,
        undefined, 2)}"`);
    try {
        const basketRequest = JSON.parse(event.body);
        // set basketId
        basketRequest.id = uuidV4();

        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Item: marshall(basketRequest || {}),
        };

        const createResult = await ddbClient.send(new PutItemCommand(params));

        console.log(createResult);
        return createResult;

    } catch (e) {
        console.error(e);
        throw e;
    }
}

export const createBasket = async (event) => {
    console.log(`checkoutBasket function. event : "${JSON.stringify(event.body,
        undefined, 2)}"`);
    try {
        const basketRequest = JSON.parse(event.body);
        // set basketId
        basketRequest.id = uuidV4();

        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Item: marshall(basketRequest || {}),
        };

        const createResult = await ddbClient.send(new PutItemCommand(params));

        console.log(createResult);
        return createResult;

    } catch (e) {
        console.error(e);
        throw e;
    }
}

export const deleteBasket = async (userName) => {
    console.log(`deleteBasket function. userName : "${userName}"`);

    try {
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: marshall({userName: userName}),
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

