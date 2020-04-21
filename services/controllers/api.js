// const winston = require('winston');

const HTTPCode = require('../../helpers/HTTPResponseCode');
// const util = require('../../helpers/util');

const sampleApi = async (req, res, next) => {
	res.status(HTTPCode.success.code).send({
		httpCode: HTTPCode.success.code,
		message: HTTPCode.success.message
	});
};

module.exports = {
	sampleApi
};
