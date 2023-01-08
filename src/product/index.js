import {
    Create,
    Delete,
    GetAll,
    GetById,
    GetByQueryCategory,
    Update,
} from './services';

exports.handler = async function(event) {
    console.log("request:", JSON.stringify(event, undefined, 2));
    let body;
    try {
        switch (event.httpMethod) {
            case "GET":
                if (event.queryStringParameters != null) {
                    body = await GetByQueryCategory(event); // GET product/1234?category=Phone
                } else if (event.pathParameters != null) {
                    body = await GetById(event.pathParameters.id); // GET product/{id}
                } else {
                    body = await GetAll(); // GET product
                }
                break;
            case "POST":
                body = await Create(event); // POST /product
                break;
            case "DELETE":
                body = await Delete(event.pathParameters.id); // DELETE /product/{id}
                break;
            case "PUT":
                body = await Update(event); // PUT /product/{id}
                break;
            default:
                throw new Error(`Unsupported route: "${event.httpMethod}"`);
        }

        console.log(`Body recover: ${JSON.stringify(body, undefined, 2)}`);
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: `Successfully finished operation: "${event.httpMethod}"`,
                body: body,
            }),
        };

    } catch (e) {
        console.error(e);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "Failed to perform operation.",
                errorMsg: e.message,
                errorStack: e.stack,
            }),
        };
    }
};
