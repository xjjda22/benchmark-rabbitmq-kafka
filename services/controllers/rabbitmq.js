// rabbitmq controller
const winston = require('winston');
const amqp = require('amqplib');
const url = require('url');

const HTTPCode = require('../../helpers/HTTPResponseCode');
const util = require('../../helpers/util');

const RABBITMQ_URL = process.env.COMPOSE_RABBITMQ_URL;

if (RABBITMQ_URL === undefined) {
	winston.info('Please set the COMPOSE_RABBITMQ_URL environment variable');
	process.exit(1);
}

const parsedurl = url.parse(RABBITMQ_URL);

const min = 11;
const max = 12;
const routingPubSub = `amqp.pubsub.route.no.${util.randomIntInc(min, max)}`;
const exchangePubSub = `amqp.pubsub.exchange.no.${util.randomIntInc(min, max)}`;
const queuePubSub = `amqp.pubsub.queue.no.${util.randomIntInc(min, max)}`;

const routingRPC = `amqp.rpc.route.no.${util.randomIntInc(min, max)}`;
const exchangeRPC = `amqp.rpc.exchange.no.${util.randomIntInc(min, max)}`;
const queueRPC = `amqp.rpc.queue.no.${util.randomIntInc(min, max)}`;
const routingReplyRPC = `amqp.rpc.route.reply.no.${util.randomIntInc(
	min,
	max
)}`;
const replyRPC = `amqp.rpc.reply.no.${util.randomIntInc(min, max)}`;

const commonPubSubMsg = `[exchange]:${exchangePubSub}, [queue]:${queuePubSub}, [route]:${routingPubSub}`;
const commonRPCMsg = `[exchange]:${exchangeRPC}, [queue]:${queueRPC}, [route]:${routingRPC}, [reply]:${queueRPC}, [replyroute]:${routingReplyRPC}`;

const open = amqp.connect(RABBITMQ_URL, { servername: parsedurl.hostname });

const processError = e => {
	try {
		const { response } = e;
		if (!response) throw new Error(e.name);

		// const { url, statusCode: httpCode, headers, body } = response;
		const { statusCode: httpCode } = response;

		throw new Error(httpCode);
	} catch (error) {
		return { error };
	}
};

// Publish a message to the exchange
// RabbitMQ will move it to the queue
const publish = ({ params }, res, next) => {
	const { message } = params;
	open
		.then(conn => {
			return conn.createChannel();
		})
		.then(ch => {
			// Bind a queue to the exchange to listen for messages
			// When we publish a message, it will be sent to this queue, via the exchange
			winston.info(commonPubSubMsg);

			ch.assertExchange(exchangePubSub, 'direct', { durable: true })
				.then(q => {
					return ch.assertQueue(queuePubSub, { exclusive: false });
				})
				.then(() => {
					return ch.bindQueue(queuePubSub, exchangePubSub, routingPubSub);
				});
			return ch;
		})
		.then(ch => {
			const msgTxt = `[publish]: ${message} Message sent at ${util.dateNow()}`;
			winston.info(`[publish]: ${msgTxt}`);

			ch.publish(exchangePubSub, routingPubSub, Buffer.from(message));

			res.status(HTTPCode.success.code).send({
				httpCode: HTTPCode.success.code,
				msgTxt
			});
		})
		.catch(e => {
			const { e: err } = processError(e);
			next(err);
		});
};

// Get single message from the queue
const subscribe = (req, res, next) => {
	open
		.then(conn => {
			return conn.createChannel();
		})
		.then(ch => {
			// Bind a queue to the exchange to listen for messages
			// When we publish a message, it will be sent to this queue, via the exchange
			winston.info(commonPubSubMsg);

			ch.assertExchange(exchangePubSub, 'direct', { durable: true })
				.then(() => {
					ch.prefetch(5);
					return ch.assertQueue(queuePubSub, { exclusive: false });
				})
				.then(q => {
					return ch.bindQueue(queuePubSub, exchangePubSub, routingPubSub);
				});
			return ch;
		})
		.then(ch => {
			return ch.get(queuePubSub, {}).then(msgOrFalse => {
				let msgTxt = `No messages in [queue]:${queuePubSub}`;
				if (!util.isEmpty(msgOrFalse.content) !== false) {
					msgTxt = `[publish]: ${msgOrFalse.content.toString()}, [subscribe]: Message received at ${util.dateNow()}`;
					ch.ack(msgOrFalse);
				}
				winston.info(`[subscribe]: ${msgTxt}`);

				res.status(HTTPCode.success.code).send({
					httpCode: HTTPCode.success.code,
					msgTxt
				});
			});
		})
		.catch(e => {
			const { e: err } = processError(e);
			next(err);
		});
};

const client = ({ params }, res, next) => {
	const { message } = params;
	open
		.then(conn => {
			return conn.createChannel();
		})
		.then(ch => {
			// Bind a queue to the exchange to listen for messages
			// When we publish a message, it will be sent to this queue, via the exchange
			winston.info(commonRPCMsg);

			ch.assertQueue(queueRPC, { durable: false });
			const q = ch.assertQueue('', { exclusive: true });
			return { ch, q };
		})
		.then(({ ch, q }) => {
			ch.sendToQueue(queueRPC, Buffer.from(message), {
				correlationId: util.uuid(),
				replyTo: replyRPC
			});
			const logTxt = `[client]: ${message} Message sent at ${util.dateNow()}`;
			winston.info(`[client]: ${logTxt}`);

			ch.consume(q.queue).then(msgOrFalse => {
				let msgTxt = `No messages in [queue]:${q.queue}`;
				if (!util.isEmpty(msgOrFalse.content) !== false) {
					msgTxt = `[client]: ${msgOrFalse.content.toString()}, [server]: Message received at ${util.dateNow()}`;
				}
				winston.info(`[client]: ${msgTxt}`);

				return res.status(HTTPCode.success.code).send({
					httpCode: HTTPCode.success.code,
					msgTxt
				});
			});
		})
		.catch(e => {
			winston.info('err->', e);
			const { e: err } = processError(e);
			next(err);
		});
};

const server = (req, res, next) => {
	open
		.then(conn => {
			return conn.createChannel();
		})
		.then(ch => {
			// Bind a queue to the exchange to listen for messages
			// When we publish a message, it will be sent to this queue, via the exchange
			winston.info(commonRPCMsg);

			ch.prefetch(5);
			ch.assertQueue(queueRPC, { durable: false });
			return ch;
		})
		.then(ch => {
			ch.consume(queueRPC).then(msgOrFalse => {
				let msgTxt = `No messages in [queue]:${queueRPC}`;
				if (!util.isEmpty(msgOrFalse.content) !== false) {
					msgTxt = `[client]: ${msgOrFalse.content.toString()}, [server]: Message received at ${util.dateNow()}`;

					winston.info(`[replyRPC]: ${msgOrFalse.properties.replyTo}`);
					ch.ack(msgOrFalse);
					ch.sendToQueue(
						msgOrFalse.properties.replyTo,
						Buffer.from(msgTxt.toString()),
						{
							correlationId: msgOrFalse.properties.correlationId
						}
					);
				}
				winston.info(`[server]: ${msgTxt}`);

				return res.status(HTTPCode.success.code).send({
					httpCode: HTTPCode.success.code,
					msgTxt
				});
			});
		})
		.catch(e => {
			const { e: err } = processError(e);
			next(err);
		});
};

module.exports = {
	publish,
	subscribe,
	client,
	server
};
