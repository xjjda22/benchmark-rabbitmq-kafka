const request = require('supertest');
const app = require('../app');

describe('Server', () => {
	beforeAll(async () => {});

	test('Sample Api', async () => {
		await request(app)
			.get('/')
			.expect(200)
			.expect('Content-Type', /json/);
	});
});
