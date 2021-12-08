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

beforeEach(async function() {
	await db.query('ALTER TABLE companies DROP CONSTRAINT fk_name');
	await db.query('DROP TABLE IF EXISTS companies');
	await db.query('DROP TABLE IF EXISTS invoices');
	await db.query('DROP TABLE IF EXISTS industries');
	await db.query('DROP TABLE IF EXISTS companies_industries');
	await db.query(`CREATE TABLE companies (
        code text PRIMARY KEY,
        name text NOT NULL UNIQUE,
        description text
    )`);
	await db.query(`CREATE TABLE invoices (
	    id serial PRIMARY KEY,
	    comp_code text NOT NULL REFERENCES companies ON DELETE CASCADE,
	    amt float NOT NULL,
	    paid boolean DEFAULT false NOT NULL,
	    add_date date DEFAULT CURRENT_DATE NOT NULL,
	    paid_date date,
	    CONSTRAINT invoices_amt_check CHECK ((amt > (0)::double precision))
	)`);
	await db.query(`CREATE TABLE industries (
	    code TEXT PRIMARY KEY,
	    industry TEXT UNIQUE NOT NULL
	)`);
	await db.query(`CREATE TABLE companies_industries (
	    comp_code TEXT NOT NULL REFERENCES companies,
	    ind_code TEXT NOT NULL REFERENCES industries,
	    PRIMARY KEY (comp_code, ind_code)
	)`);

	let result = await db.query(`
    INSERT INTO
      companies (code, name, description) VALUES ('testco', 'Test Company', 'Test Descripton of TestCompany')
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
		const response = await request(app).get(`/companies/${testCompany.code}`);
		expect(response.statusCode).toEqual(200);
		expect(response.body).toEqual({ company: testCompany });
	});

	test("Responds with 404 if can't find company", async function() {
		const response = await request(app).get(`/companies/0`);
		expect(response.statusCode).toEqual(404);
	});
});

/** POST /companies - create company from data; return `{company: company}` */

describe('POST /companies', function() {
	test('Creates a new company', async function() {
		const response = await request(app).post(`/companies`).send({
			code: testCompany2.code,
			name: testCompany2.name,
			description: testCompany2.description
		});
		expect(response.statusCode).toEqual(201);
		expect(response.body).toEqual({
			company: {
				code: testCompany2.code,
				name: testCompany2.name,
				description: testCompany2.description
			}
		});
	});
});

/** PUT /companies/[id] - update company; return `{company: company}` */

describe('PUT /companies/:code', function() {
	test('Updates a single company', async function() {
		const response = await request(app)
			.put(`/companies/${testCompany.code}`)
			.send({
				code: testCompany2.code,
				name: testCompany2.name,
				description: testCompany2.description
			});
		expect(response.statusCode).toEqual(200);
		expect(response.body).toEqual({
			company: {
				code: testCompany2.code,
				name: testCompany2.name,
				description: testCompany2.description
			}
		});
	});

	test("Responds with 404 if can't find company", async function() {
		const response = await request(app).put(`/companies/bogus`);
		expect(response.statusCode).toEqual(404);
	});
});

/** DELETE /companies/[id] - delete company, return `{status: 'Company deleted'}` */

describe('DELETE /companies/:code', function() {
	test('Deletes a single company', async function() {
		const response = await request(app).delete(
			`/companies/${testCompany.code}`
		);
		expect(response.statusCode).toEqual(200);
		expect(response.body).toEqual({ status: 'Company deleted' });
	});
});

/********************************************************** */

afterEach(async function() {
	// delete any data created by test
	await db.query('DELETE FROM companies');
	await db.query('DROP TABLE IF EXISTS companies');
});

afterAll(async function() {
	// close db connection
	await db.end();
});
