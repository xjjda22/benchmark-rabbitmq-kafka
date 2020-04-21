const winston = require('winston');

const HTTPCode = require('../../helpers/HTTPResponseCode');

const { LOG_LEVEL } = process.env;

winston.configure({
	transports: [
		new winston.transports.Console({
			// Show only errors on test
			level: LOG_LEVEL,
			handleExceptions: true,
			format: winston.format.combine(
				winston.format.colorize(),
				winston.format.simple()
			)
		})
	]
});

const logger = (err, req, res, next) => {
	if (err && err.name === 'UnauthorizedError') {
		// log unauthorized requests
		res.status(HTTPCode.unauthorized.code).end({
			httpCode: HTTPCode.unauthorized.code,
			message: HTTPCode.unauthorized.message
		});
	} else if (err) {
		winston.error(err.stack);
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

module.exports = logger;
