import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { client } from './redis';

type IncrementVisitCounter = {
    visitCount: number;
};

type Body = {
    page: string;
};

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */
export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        if (!event || !event.body) {
            return {
                statusCode: 415,
                body: JSON.stringify({ error: 'Incorrect body' }),
            };
        }

        let body: Body;
        try {
            body = JSON.parse(event.body);

            if (!body || !body.page) {
                return {
                    statusCode: 415,
                    body: JSON.stringify({ error: 'Incorrect body' }),
                };
            }
        } catch (err) {
            return {
                statusCode: 415,
                body: JSON.stringify({ error: 'Incorrect body' }),
            };
        }

        const { page } = body;
        const ip = getIp(event);
        const rateLimitKey = `rate-limit:${ip}:${page}`;

        console.info(ip, rateLimitKey);

        const isRateLimited = await client.exists(rateLimitKey);

        if (isRateLimited) {
            return {
                statusCode: 429,
                body: JSON.stringify({}),
            };
        }

        await client.set(rateLimitKey, '1', 'EX', 60);

        const r: IncrementVisitCounter = {
            visitCount: await client.hincrby(page, 'visitCount', 1),
        };

        return {
            statusCode: 200,
            body: JSON.stringify({ ...r }),
        };
    } catch (err) {
        console.log(err);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'some error happened',
            }),
        };
    }
};

const getIp = (event: APIGatewayProxyEvent) => {
    if (!event) {
        return 'unknown-ip';
    }

    if (event.headers !== null) {
        if (event.headers['x-forwarded-for']) {
            return event.headers['x-forwarded-for'];
        }

        if (event.headers['remote-host']) {
            return event.headers['remote-host'];
        }
    }

    return 'unknown-ip';
}