import { Create, CreateBK, Delete, GetAll, GetById } from './services'

exports.handler = async function (event) {
    console.log("Request: ", JSON.stringify(event, undefined, 2));
    let body;
    try {
        switch (event.httpMethod) {
            case "GET":
                if (event.pathParameters != null) {
                    body = await GetById(event.pathParameters.userName)
                } else {
                    body = await GetAll();
                }
                break;
            case "POST":
                if (event.path == "/basket/checkout") {
                    body = Create(event);
                } else {
                    body = await CreateBK(event);
                }
                break;
            case "DELETE":
                body = await Delete(event.pathParameters.userName); // DELETE /product/{id}
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
}
