import Redis from 'ioredis';

const getRedisUrl = (): string => {
    return process.env.REDIS_HOST || '';
};

const client = new Redis(getRedisUrl());

client.on('connect', () => {
    console.info('Redis connected');
});

client.on('error', (err: Error) => {
    console.error(`Redis error: ${err}`);
})

export { client };
