// const winston = require('winston');

const util = require('../../helpers/util');

const status = async (req, res) => {
	try {
		res.status(200).send({
			uptime: Math.round(process.uptime()),
			message: 'OK',
			timestamp: util.dateNow()
		});
	} catch (e) {
		res.status(503).end();
	}
};

module.exports = {
	status
};
