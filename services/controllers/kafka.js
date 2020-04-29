// kafka controller
const winston = require('winston');
const { Kafka } = require('kafkajs');

const HTTPCode = require('../../helpers/HTTPResponseCode');
const util = require('../../helpers/util');

const min = 11;
const max = 15;
const config = {
	TOPIC: 'topicno10',
	BROKERS: ['localhost:9092'],
	GROUPID: 'kafka-consumer-group',
	CLIENTID: 'sample-kafka-client'
};
const commonProdConsMsg = `[brokers]:${config.BROKERS}, [topic]:${config.TOPIC}, [client]:${config.CLIENTID}, [groupId]:${config.GROUPID}`;

// const client = new Kafka({
// 	brokers: config.BROKERS,
// 	clientId: config.CLIENTID
// });

const topic = config.TOPIC;

// const producerClient = client.producer();
// const consumerClient = client.consumer({
// 	groupId: config.GROUPID
// });

const client = () => {
	try {
		return new Kafka({
			brokers: config.BROKERS,
			clientId: config.CLIENTID
		});
	} catch (error) {
		return { error };
	}
};
const producerClient = async () => {
	try {
		const c = await client();
		return await c.producer();
	} catch (error) {
		return { error };
	}
};
const consumerClient = async () => {
	try {
		const c = await client();
		return await c.consumer({
			groupId: config.GROUPID
		});
	} catch (error) {
		return { error };
	}
};

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
const producer = async ({ params }, res, next) => {
	const { message } = params;
	try {
		winston.info(commonProdConsMsg);

		const p = await producerClient();
		await p.connect();

		const msgTxt = `[producer]: ${message} Message sent at ${util.dateNow()}`;
		winston.info(`[producer]: ${msgTxt}`);

		p.send({
			topic,
			messages: [{ key: `key-${util.randomIntInc(min, max)}`, value: message }]
		});

		res.status(HTTPCode.success.code).send({
			httpCode: HTTPCode.success.code,
			msgTxt
		});
	} catch (e) {
		const { e: err } = processError(e);
		next(err);
	}
};

// Get single message from the queue
const consumer = async (req, res, next) => {
	try {
		winston.info(commonProdConsMsg);

		const c = await consumerClient();
		await c.connect();
		await c.subscribe({ topic, fromBeginning: true });

		let msgTxt = `No messages in [topic]:${config.TOPIC}`;

		await c.run({
			eachMessage: async ({ partition, message }) => {
				msgTxt = `[producer]: ${message.value.toString()}, [consumer]: Message received at ${util.dateNow()}`;
				winston.info(`[consumer]: ${msgTxt}`);

				res.status(HTTPCode.success.code).send({
					httpCode: HTTPCode.success.code,
					msgTxt
				});
			}
		});
		setTimeout(c.disconnect, 2000);

		// res.status(HTTPCode.success.code).send({
		// 	httpCode: HTTPCode.success.code,
		// 	msgTxt
		// });
	} catch (e) {
		// console.log('err->', e);
		const { e: err } = processError(e);
		next(err);
	}
};

module.exports = {
	producer,
	consumer
};
