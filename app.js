const http = require('http');
const app = require('express')();
const bodyParser = require('body-parser');
const winston = require('winston');

const logger = require('./services/middlewares/logger');
const routes = require('./services/routes');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('case sensitive routing', false);
app.disable('x-powered-by');

const { PORT } = process.env;

// Enable KeepAlive to speed up HTTP requests to another microservices
http.globalAgent.keepAlive = true;

app.use('/', routes);
app.use(logger);

app.listen(PORT, () => {
	winston.info(`Server listening on http://localhost:${PORT}`);
});

module.exports = app;
