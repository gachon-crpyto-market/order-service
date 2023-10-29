import { createClient } from 'redis';

export const redisProvider = [
  {
    provide: 'BID_REDIS_CLIENT',
    useFactory: async () => {
      const redisClient = createClient({
        url: 'redis://localhost:6379',
      });
      await redisClient.connect();
      return redisClient;
    },
  },
  {
    provide: 'ASK_REDIS_CLIENT',
    useFactory: async () => {
      const redisClient = createClient({
        url: 'redis://localhost:6380',
      });
      await redisClient.connect();
      return redisClient;
    },
  },
];
