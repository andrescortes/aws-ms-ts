import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { ddbClient } from '../ddbClient';
import {
  DeleteItemCommand,
  GetItemCommand,
  PutItemCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import { ebClient } from '../eventBridgeClient';
import { PutEventsCommand } from '@aws-sdk/client-eventbridge';

export const getBasket = async (userName) => {
  console.log("getBasket");
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: marshall({ userName: userName })
    };

    const { Item } = await ddbClient.send(new GetItemCommand(params));

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
      TableName: process.env.DYNAMODB_TABLE_NAME
    };

    const { Items } = await ddbClient.send(new ScanCommand(params));

    console.log(Items);
    return (Items) ? Items.map((item) => unmarshall(item)) : {};

  } catch (e) {
    console.error(e);
    throw e;
  }
}

export const createBasket = async (event) => {
  console.log(`createBasket function. event : "${event}"`);
  try {
    const requestBody = JSON.parse(event.body);
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Item: marshall(requestBody || {})
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
      Key: marshall({ userName: userName }),
    };

    const deleteResult = await ddbClient.send(new DeleteItemCommand(params));
    console.log(deleteResult);
    return deleteResult;

  } catch (e) {
    console.error(e);
    throw e;
  }
}

export const checkoutBasket = async (event) => {
  console.log("checkoutBasket");

  // expected request payload : { userName : swn, attributes[firstName, lastName, email ..] 
  const checkoutRequest = JSON.parse(event.body);
  if (checkoutRequest == null || checkoutRequest.userName == null) {
    throw new Error(`userName should exist in checkoutRequest: "${checkoutRequest}"`);
  }

  // 1- Get existing basket with items
  const basket = await getBasket(checkoutRequest.userName);

  // 2- create an event json object with basket items, 
  // calculate totalprice, prepare order create json data to send ordering ms 
  var checkoutPayload = prepareOrderPayload(checkoutRequest, basket);

  // 3- publish an event to eventbridge - this will subscribe by order microservice and start ordering process.
  const publishedEvent = await publishCheckoutBasketEvent(checkoutPayload);

  // 4- remove existing basket
  await deleteBasket(checkoutRequest.userName);

}

const prepareOrderPayload = (checkoutRequest, basket) => {
  console.log("prepareOrderPayload");

  // prepare order payload -> calculate totalprice and combine checkoutRequest and basket items
  // aggregate and enrich request and basket data in order to create order payload    
  try {
    if (basket == null || basket.items == null) {
      throw new Error(`basket should exist in items: "${basket}"`);
    }

    // calculate totalPrice
    let totalPrice = 0;
    basket.items.forEach(item => totalPrice = totalPrice + item.price);
    checkoutRequest.totalPrice = totalPrice;
    console.log(checkoutRequest);

    // copies all properties from basket into checkoutRequest
    Object.assign(checkoutRequest, basket);
    console.log("Success prepareOrderPayload, orderPayload:", checkoutRequest);
    return checkoutRequest;

  } catch (e) {
    console.error(e);
    throw e;
  }
}

const publishCheckoutBasketEvent = async (checkoutPayload) => {
  console.log("publishCheckoutBasketEvent with payload :", checkoutPayload);
  try {
    // eventbridge parameters for setting event to target system
    const params = {
      Entries: [
        {
          Source: process.env.EVENT_SOURCE,
          Detail: JSON.stringify(checkoutPayload),
          DetailType: process.env.EVENT_DETAILTYPE,
          Resources: [],
          EventBusName: process.env.EVENT_BUSNAME
        },
      ],
    };

    const data = await ebClient.send(new PutEventsCommand(params));

    console.log("Success, event sent; requestID:", data);
    return data;

  } catch (e) {
    console.error(e);
    throw e;
  }
}

