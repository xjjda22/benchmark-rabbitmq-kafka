const express = require('express');

// const authorization = require('./middlewares/authorization');
const healthCheck = require('./controllers/healthCheck');
const api = require('./controllers/api');
const rabbitmq = require('./controllers/rabbitmq');

const router = express.Router();

// router.use(authorization);

router.get('/healthCheck', healthCheck.status);
router.get('/api', api.sampleApi);

router.get('/publish/:message', rabbitmq.publish);
router.get('/subscribe', rabbitmq.subscribe);
router.get('/roundTripPubSub/:message', rabbitmq.roundTripPubSub);

module.exports = router;
