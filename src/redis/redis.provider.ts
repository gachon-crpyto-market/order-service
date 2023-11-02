import { createClient } from 'redis';

export const redisProvider = [
  {
    provide: 'BID_REDIS_CLIENT',
    useFactory: async () => {
      const redisClient = createClient({
        url: 'redis://localhost:6381',
      });
      await redisClient.connect();
      return redisClient;
    },
  },
  {
    provide: 'ASK_REDIS_CLIENT',
    useFactory: async () => {
      const redisClient = createClient({
        url: 'redis://localhost:6382',
      });
      await redisClient.connect();
      return redisClient;
    },
  },
];
