import amqp, { Channel } from 'amqplib';
import { RABBITMQ_EXCHANGE, RABBITMQ_URL } from '../config/variables';
import { State } from '../types/state';

export const delay = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

/** Creates a TCP connection to send data to RabbitMQ.
 *  Queues are declared in case they do not exist yet. */
export const initializeAmqp = async ({
  queueNames
}: {
  queueNames: string[];
}) => {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    channel.assertExchange(RABBITMQ_EXCHANGE, 'direct', { durable: true });

    for (const name of queueNames) {
      await channel.assertQueue(name, { durable: false });
      await channel.bindQueue(name, RABBITMQ_EXCHANGE, name);
    }
    return channel;
  } catch (err) {
    console.log(`Encountered an error during amqp initialization: ${err}`);
    console.log(err);
  }
};

/** Sends an message to a RabbitMQ topic. */
export const sendMessage = ({
  msg,
  channel,
  routingKey
}: {
  msg: string;
  channel: Channel | undefined;
  routingKey: string;
}) => {
  if (!channel) return;
  channel.publish(RABBITMQ_EXCHANGE, routingKey, Buffer.from(msg, 'utf-8'), {
    persistent: false
  });
};

export const isValueInStateEnum = () => {
  const enumValues = Object.values(State) as string[];
  return (value: string): value is State => enumValues.includes(value);
};
