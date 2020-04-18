const app = require('express')();
const bodyParser = require('body-parser');
const winston = require('winston');
const amqp = require('amqplib');
const url = require('url');

const HTTPCode = require('./HTTPResponseCode');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('case sensitive routing', false);
app.disable('x-powered-by');

const { PORT } = process.env;
const connectionString = process.env.COMPOSE_RABBITMQ_URL;

if (connectionString === undefined) {
	winston.info('Please set the COMPOSE_RABBITMQ_URL environment variable');
	process.exit(1);
}

const parsedurl = url.parse(connectionString);

const routingKey = 'route';
const exchangeName = 'exchange';
const qName = 'queue';

const open = amqp.connect(connectionString, { servername: parsedurl.hostname });

open
	.then(conn => {
		return conn.createChannel();
	})
	.then(ch => {
		// Bind a queue to the exchange to listen for messages
		// When we publish a message, it will be sent to this queue, via the exchange
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
		process.exit(1);
	});

// Publish a message to the exchange
// RabbitMQ will move it to the queue
const addMessage = message => {
	return open
		.then(conn => {
			return conn.createChannel();
		})
		.then(ch => {
			ch.publish(exchangeName, routingKey, Buffer.from(message));
			const msgTxt = `${message} : Message sent at ${new Date()}`;
			winston.info(' [+] %s', msgTxt);
			return new Promise(resolve => {
				resolve(message);
			});
		});
};

// Get a message from the queue
const getMessage = () => {
	return open
		.then(conn => {
			return conn.createChannel();
		})
		.then(ch => {
			return ch.get(qName, {}).then(msgOrFalse => {
				return new Promise(resolve => {
					let result = 'No messages in queue';
					if (msgOrFalse !== false) {
						result = `${msgOrFalse.content.toString()}: Message received at ${new Date()}`;
						ch.ack(msgOrFalse);
					}
					winston.info(' [-] %s', result);
					resolve(result);
				});
			});
		});
};

const processRequest = async (req, res, next) => {
	res.status(HTTPCode.success.code).send({
		httpCode: HTTPCode.success.code,
		message: HTTPCode.success.message
	});
};

const logger = (err, req, res, next) => {
	// console.log('logger err->', err.message);

	if (err && err.name === 'UnauthorizedError') {
		// log unauthorized requests
		res.status(HTTPCode.unauthorized.code).end({
			httpCode: HTTPCode.unauthorized.code,
			message: HTTPCode.unauthorized.message
		});
	} else if (err) {
		res.status(HTTPCode.internalServerError.code).send({
			httpCode: HTTPCode.internalServerError.code,
			message: HTTPCode.internalServerError.message
		});
	} else {
		res.status(HTTPCode.methodNotAllowed.code).end({
			httpCode: HTTPCode.methodNotAllowed.code,
			message: HTTPCode.methodNotAllowed.message
		});
	}
};

app.get('/', processRequest);

app.post('/message', (req, res) => {
	addMessage(req.body.message)
		.then(resp => {
			res.send(resp);
		})
		.catch(err => {
			winston.info('error:', err);
			res.status(500).send(err);
		});
});

// Read from the database when the page is loaded or after a word is successfully added
// Use the getWords function to get a list of words and definitions from the database
app.get('/message', (req, res) => {
	getMessage()
		.then(words => {
			res.send(words);
		})
		.catch(err => {
			winston.info(err);
			res.status(500).send(err);
		});
});

app.use(logger);

app.listen(PORT, () => {
	winston.info(`Server listening on http://localhost:${PORT}`);
});

module.exports = app;
