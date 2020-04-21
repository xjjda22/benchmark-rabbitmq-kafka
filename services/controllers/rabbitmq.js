// rabbitmq controller
const winston = require('winston');
const amqp = require('amqplib');
const url = require('url');

const util = require('../../helpers/util');

const connectionString = process.env.COMPOSE_RABBITMQ_URL;

if (connectionString === undefined) {
	winston.info('Please set the COMPOSE_RABBITMQ_URL environment variable');
	process.exit(1);
}

const parsedurl = url.parse(connectionString);

const routingKey = 'route';
const exchangeName = 'exchange';
const qName = `queue${util.randomIntInc(11, 20)}`;

const open = amqp.connect(connectionString, { servername: parsedurl.hostname });

open
	.then(conn => {
		return conn.createChannel();
	})
	.then(ch => {
		// Bind a queue to the exchange to listen for messages
		// When we publish a message, it will be sent to this queue, via the exchange
		winston.info(`[exchange]:${exchangeName}, [queue]:${qName}`);
		return ch
			.assertExchange(exchangeName, 'direct', { durable: true })
			.then(() => {
				return ch.assertQueue(qName, { exclusive: false });
			})
			.then(q => {
				return ch.bindQueue(q.queue, exchangeName, routingKey);
			});
	})
	.catch(err => {
		winston.info(err);
		// process.exit(1);
	});

// Publish a message to the exchange
// RabbitMQ will move it to the queue
const publish = ({ params }, res) => {
	const { message } = params;
	open
		.then(conn => {
			return conn.createChannel();
		})
		.then(ch => {
			ch.publish(exchangeName, routingKey, Buffer.from(message));
			const msgTxt = `${message} : Message sent at ${util.dateNow()}`;
			winston.info(`[Producer]: ${msgTxt}`);

			res.send(message);
		})
		.catch(err => {
			winston.info(err);
			res.send(err);
		});
};

// Get single message from the queue
const subscribe = (req, res) => {
	open
		.then(conn => {
			return conn.createChannel();
		})
		.then(ch => {
			return ch.get(qName, {}).then(msgOrFalse => {
				let result = `No messages in [queue]:${qName}`;
				if (msgOrFalse !== false) {
					result = `[queue]:${qName}, [route]:${routingKey}, [Producer]: ${msgOrFalse.content.toString()}, [Consumer]: Message received at ${util.dateNow()}`;
					ch.ack(msgOrFalse);
				}
				winston.info(`[Consumer]: ${result}`);
				res.send(result);
			});
		})
		.catch(err => {
			winston.info(err);
			res.send(err);
		});
};

const roundTripPubSub = ({ params }, res) => {
	const { message } = params;
	open
		.then(conn => {
			return conn.createChannel();
		})
		.then(ch => {
			ch.publish(exchangeName, routingKey, Buffer.from(message));
			const msgTxt = `[queue]:${qName}, [route]:${routingKey}, [Producer]: ${message}`;
			winston.info(`${msgTxt}`);
			return ch;
		})
		.then(ch => {
			return ch.get(qName, {}).then(msgOrFalse => {
				let result = `No messages in [queue]:${qName}`;
				if (msgOrFalse !== false) {
					result = `[queue]:${qName}, [route]:${routingKey}, [Producer]: ${msgOrFalse.content.toString()}, [Consumer]: Message received at ${util.dateNow()}`;
					ch.ack(msgOrFalse);
				}
				winston.info(`[Consumer]: ${result}`);
				res.send(result);
			});
		})
		.catch(err => {
			winston.info(err);
			res.send(err);
		});
};

module.exports = {
	publish,
	subscribe,
	roundTripPubSub
};
