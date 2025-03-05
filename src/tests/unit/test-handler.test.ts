import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { lambdaHandler } from '../../app';
import { client } from '../../redis';
import { vi, describe, it, afterEach, expect } from 'vitest';

vi.mock('../../redis', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const RedisMock = require('ioredis-mock');

    return {
        client: new RedisMock(),
    };
});

const getDefaultEvent: (body: string) => APIGatewayProxyEvent = (body) => {
    return {
        httpMethod: 'get',
        body,
        headers: {},
        isBase64Encoded: false,
        multiValueHeaders: {},
        multiValueQueryStringParameters: {},
        path: '/hello',
        pathParameters: {},
        queryStringParameters: {},
        requestContext: {
            accountId: '123456789012',
            apiId: '1234',
            authorizer: {},
            httpMethod: 'get',
            identity: {
                accessKey: '',
                accountId: '',
                apiKey: '',
                apiKeyId: '',
                caller: '',
                clientCert: {
                    clientCertPem: '',
                    issuerDN: '',
                    serialNumber: '',
                    subjectDN: '',
                    validity: { notAfter: '', notBefore: '' },
                },
                cognitoAuthenticationProvider: '',
                cognitoAuthenticationType: '',
                cognitoIdentityId: '',
                cognitoIdentityPoolId: '',
                principalOrgId: '',
                sourceIp: '',
                user: '',
                userAgent: '',
                userArn: '',
            },
            path: '/hello',
            protocol: 'HTTP/1.1',
            requestId: 'c6af9ac6-7b61-11e6-9a41-93e8deadbeef',
            requestTimeEpoch: 1428582896000,
            resourceId: '123456',
            resourcePath: '/hello',
            stage: 'dev',
        },
        resource: '',
        stageVariables: {},
    };
};

describe('Unit test for app handler', function () {
    afterEach(async () => {
        await client.flushall();
    });

    it('verifies empty body of request', async () => {
        const r_body = null;
        const body = JSON.stringify(r_body);

        const event = getDefaultEvent(body);
        const result: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result.statusCode).toEqual(415);
        expect(result.body).toEqual(JSON.stringify({ error: 'Incorrect body' }));
    });

    it('verifies successful response', async () => {
        const r_body = {
            page: 'my_page',
        };
        const body = JSON.stringify(r_body);
        const event = getDefaultEvent(body);
        const result: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result.statusCode).toEqual(200);
        expect(result.body).toEqual(
            JSON.stringify({
                visitCount: 1,
            }),
        );
    });

    it('verifies rate limit', async () => {
        const r_body = {
            page: 'my_page',
        };
        const body = JSON.stringify(r_body);
        const event = getDefaultEvent(body);
        const result: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result.statusCode).toEqual(200);
        expect(result.body).toEqual(
            JSON.stringify({
                visitCount: 1,
            }),
        );

        const result1: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result1.statusCode).toEqual(429);
        expect(result1.body).toEqual('{}');
    });
});
