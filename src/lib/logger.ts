// import pino from 'pino';
// import { config } from '../config/env.js';

// export const logger = pino({
//   level: config.NODE_ENV === 'production' ? 'info' : 'debug',
//   // Human-readable output in development, JSON in production.
//   ...(config.NODE_ENV !== 'production'
//     ? {
//         transport: {
//           target: 'pino-pretty',
//           options: {
//             colorize: true,
//             translateTime: 'SYS:standard',
//             ignore: 'pid,hostname',
//           },
//         },
//       }
//     : {}),
// });




import pino from 'pino';

import { config } from '../config/env.js';

const isProduction = config.NODE_ENV === 'production';

export const logger = pino({
  level: isProduction ? 'info' : 'debug',

  // Equivalent to Winston's defaultMeta
  base: {
    service: 'docuchat',
  },

  // Equivalent to Winston's timestamp()
  timestamp: pino.stdTimeFunctions.isoTime,

  // Development: human-readable
  // Production: structured JSON
  ...(isProduction
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      }),
});
