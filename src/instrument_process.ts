import * as logger from 'winston';

logger.configure({
  format: logger.format.combine(
    logger.format.timestamp(),
    logger.format.json()
  ),
  transports: [new logger.transports.Console()]
});

function reportAndExit(message: string, error: Error): void {
  logger.error({ message, error });
  process.exit(1);
}

export function instrumentProcess(): void {
  process.once('SIGINT', () => process.exit(0));
  process.once('SIGTERM', () => process.exit(0));
  process.once('unhandledRejection', (error: Error) => {
    reportAndExit('unhandledRejection bubbled up to the process', error);
  });

  process.once('uncaughtException', (error: Error) => {
    reportAndExit('uncaughtException bubbled up to the process', error);
  });
}
