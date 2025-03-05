import Redis from 'ioredis';

const getRedisUrl = (): string => {
    return process.env.REDIS_URL || 'http://localhost:3001';
};

export const client = new Redis(getRedisUrl());
