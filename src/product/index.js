import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import {
    DeleteItemCommand,
    GetItemCommand,
    PutItemCommand,
    ScanCommand,
    UpdateItemCommand,
} from '@aws-sdk/client-dynamodb';
import { v4 as uuidv4 } from 'uuid';

import { ddbClient } from './ddbClient';

exports.handler = async function(event) {
    console.log("request: ", JSON.stringify(event,undefined,2));
    let body= null;
    //TODO - switch case event.httpMethod to perform CRUD operations
    // with using ddbClient Object
    switch (event.httpMethod){
        case 'GET':{
            if(event.pathParameters != null){
                body = await getProduct(event.pathParameters.id);// GET product/1
            }else {
                body = await getAllProducts();
            }
            break;
        }
        case 'PUT': {
            body = await updateProduct(event);
            break;
        }
        case 'POST': {
            body = await createProduct(event);
            break;
        }
        case 'DELETE':{
            body = await deleteProduct(event.pathParameters.id);
            break;
        }
    }
    return {
        statusCode: 200,
        headers: {
            "Content-Type" : "text/plain"
        },
        body: `Hello from Product! You've hit ${event.path}\n`
    };
};

const getProduct = async (productId) => {
    console.log("getProduct");
    try {

        const params = {
            TableName: process.env.DYNAME_TABLE_NAME,
            Key: marshall({id:productId})
        };

        const { Item } = await ddbClient.send(new GetItemCommand(params));

        console.log(Item)
        return (Item) ? unmarshall(Item) : {};

    }catch (e) {
        console.error(e);
        throw e;
    }
}

const getAllProducts = async () => {
    console.log("getProducts");
    try {
        const params = {
            TableName: process.env.DYNAME_TABLE_NAME,
        };

        const { Items } = await ddbClient.send(new ScanCommand(params));

        console.log(Items)
        return (Items) ? Items.map((item) =>  unmarshall(item)) : {};
    }catch (e) {
        console.error(e);
        throw e;
    }
}

const createProduct = async (event) => {
    console.log("createProduct");
    try {
        const productRequest = JSON.parse(event.body);
        //set productId
        const productId = uuidv4();
        productRequest.id = productId;
        const params = {
            TableName: process.env.DYNAME_TABLE_NAME,
            Item: marshall(productRequest || {})
        };

        const createResult = await ddbClient.send(new PutItemCommand(params));

        console.log(createResult)
        return createResult;
    }catch (e) {
        console.error(e);
        throw e;
    }
}
const updateProduct = async (event) => {
    console.log(`updateProduct function.productId: ${event}`);
    try {
        const requestBody = JSON.parse(event.body);
        const objKeys = Object.keys(requestBody);
        console.log(`requestBody ${requestBody}, objKey: ${objKeys}`);
        const params = {
            TableName: process.env.DYNAME_TABLE_NAME,
            Key: marshall({id : event.pathParameters.id}),
            UpdateExpression: `SET ${objKeys.map((_, index) => `#key${index} = :value${index}`).join(", ")}`,
            ExpressionAttributeNames: objKeys.reduce((acc,key,index) => ({
                ...acc,
                [`#key${index}`]: key,
            }),{}),
            ExpressionAttributeValues: marshall(objKeys.reduce((acc,key,index) => ({
                ...acc,
                [`#key${index}`]: requestBody[key],
            }), {}))
        };

        const updateResult = await ddbClient.send(new UpdateItemCommand(params));

        console.log(updateResult);
        return updateResult;
    }catch (e){
        console.error(e);
        throw e;
    }
}

const deleteProduct = async (productId) => {
    console.log(`deleteProduct function.productId: ${productId}`);
    try {
        const params = {
            TableName: process.env.DYNAME_TABLE_NAME,
            Key: marshall({ id : productId })
        };

        const deleteResult = await ddbClient.send(new DeleteItemCommand(params));
        console.log(deleteResult);
        return deleteResult;
    }catch (e){
        console.error(e);
        throw e;
    }
}
