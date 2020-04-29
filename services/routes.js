const express = require('express');

// const authorization = require('./middlewares/authorization');
const healthCheck = require('./controllers/healthCheck');
const api = require('./controllers/api');
const rabbitmq = require('./controllers/rabbitmq');
const kafka = require('./controllers/kafka');

const router = express.Router();

// router.use(authorization);

router.get('/healthCheck', healthCheck.status);
router.get('/api', api.sampleApi);

// rabbitmq
router.get('/publish/:message', rabbitmq.publish);
router.get('/subscribe', rabbitmq.subscribe);

router.get('/client/:message', rabbitmq.client);
router.get('/server', rabbitmq.server);

// kafka
router.get('/producer/:message', kafka.producer);
router.get('/consumer', kafka.consumer);

module.exports = router;
