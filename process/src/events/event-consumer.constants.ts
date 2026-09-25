export const RABBITMQ_EXCHANGE = 'event-pulse.events';
export const RABBITMQ_QUEUE = 'event-pulse.process';
export const RABBITMQ_ROUTING_KEY = 'event';

export const RABBITMQ_RETRY_EXCHANGE = 'event-pulse.retry';
export const RABBITMQ_RETRY_QUEUE = 'event-pulse.process.retry';
export const RABBITMQ_RETRY_ROUTING_KEY = 'event.retry';

export const RABBITMQ_RETRY_DELAY_MS = 5000;
