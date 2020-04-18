// define error code and default message to return in response throughout the API
module.exports = {
	success: {
		code: 200,
		message: 'The request has succeeded.'
	},
	badRequest: {
		code: 400,
		message: 'All required information not provided.'
	},
	unauthorized: {
		code: 401,
		message: 'The request requires user authentication.'
	},
	paymentRequired: {
		code: 402,
		message: 'This code is reserved for future use.'
	},
	forbidden: {
		code: 403,
		message: 'The server understood the request, but is refusing to fulfill it.'
	},
	notFound: {
		code: 404,
		message: 'The server has not found anything matching the Request-URI.'
	},
	methodNotAllowed: {
		code: 405,
		message:
			'The method received in the request-line is known by the origin server but not supported by the target resource.'
	},
	requestTimeout: {
		code: 408,
		message:
			'The client did not produce a request within the time that the server was prepared to wait.'
	},
	conflict: {
		code: 409,
		message:
			'The request could not be completed due to a conflict with the current state of the resource.'
	},
	lengthRequired: {
		code: 411,
		message:
			'The server refuses to accept the request without a defined Content-Length.'
	},
	unsupportedMediaType: {
		code: 415,
		message:
			'The server is refusing to service the request because the entity of the request is in a format not supported by the requested resource for the requested method.'
	},
	internalServerError: {
		code: 500,
		message:
			'The server encountered an unexpected condition which prevented it from fulfilling the request.'
	},
	notImplemented: {
		code: 501,
		message:
			'The server does not support the functionality required to fulfill the request.'
	},
	badGateway: {
		code: 502,
		message:
			'The server, while acting as a gateway or proxy, received an invalid response from the upstream server it accessed in attempting to fulfill the request.'
	},
	serviceUnavailable: {
		code: 503,
		message:
			'The server is currently unable to handle the request due to a temporary overloading or maintenance of the server.'
	},
	gatewayTimeout: {
		code: 504,
		message:
			'The server, while acting as a gateway or proxy, did not receive a timely response from the upstream server specified by the URI or some other auxiliary server.'
	},
	HTTPVersionNotSupported: {
		code: 505,
		message:
			'The server does not support, or refuses to support, the HTTP protocol version that was used in the request message.'
	}
};
