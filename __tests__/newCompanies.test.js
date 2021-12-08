// connect to right DB --- set before loading db.js
process.env.NODE_ENV = 'test';

// npm packages
const request = require('supertest');

// app imports
const app = require('../app');
const db = require('../db');
const ExpressError = require('../expressError');

let testCompany;
let testCompany2;
let i_result;
let ci_result;

i_result = db.query(`
INSERT INTO industries (code, industry)
  VALUES ('industryCode', 'test Industry Name')
  RETURNING code, industry`);

ci_result = db.query(`
  INSERT INTO companies_industries (comp_code, ind_code)
    VALUES ('testco', 'industryCode')
    RETURNING comp_code, ind_code`);

beforeEach(async function() {
	let result = await db.query(`
    INSERT INTO companies (code, name, description)
      VALUES ('testco', 'Test Company', 'Test Descripton of TestCompany')
      RETURNING code, name, description`);

	testCompany = result.rows[0];
	testCompany2 = {
		code: 'goog',
		name: 'Google',
		description: 'Mountainview startup'
	};
});

/** GET /companies - returns `{companies: [company, ...]}` */

describe('GET /companies', function() {
	test('Gets a list of 1 company', async function() {
		const response = await request(app).get(`/companies`);
		expect(response.statusCode).toEqual(200);
		expect(response.body).toEqual({
			companies: [ testCompany ]
		});
	});
});

/** GET /companies/[id] - return data about one company: `{company: company}` */

describe('GET /companies/:code', function() {
	test('Gets a single company', async function() {
		const response = await request(app).get(`/companies/testco`);
		expect(response.statusCode).toEqual(200);
		expect(response.body).toEqual({ company: testCompany });
	});

	test("Responds with 404 if can't find company", async function() {
		const response = await request(app).get(`/companies/0`);
		expect(response.statusCode).toEqual(404);
	});
});

/********************************************************** */

afterEach(async function() {
	// delete any data created by test
	await db.query('DELETE FROM companies');
	// await db.query('DROP TABLE IF EXISTS companies');
});

afterAll(async function() {
	// close db connection
	await db.end();
});
