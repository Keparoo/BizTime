// connect to right DB --- set before loading db.js
process.env.NODE_ENV = 'test';

// npm packages
const request = require('supertest');

// app imports
const app = require('../app');
const db = require('../db');
const ExpressError = require('../expressError');

let testCompany;
let testInvoice1;
let testInvoice2;
let testInvoice3;

beforeEach(async function() {
	let company = await db.query(`
	INSERT INTO
	  companies (code, name, description) VALUES ('testco', 'Test Company', 'Test Descripton of TestCompany')
	  RETURNING code, name, description`);
	testCompany = company.rows[0];

	let invoice1 = await db.query(`
    INSERT INTO
      invoices (comp_code, amt) VALUES ('${testCompany.code}', 100)
      RETURNING id, comp_code, amt, paid, add_date, paid_date`);
	testInvoice1 = invoice1.rows[0];

	let invoice2 = await db.query(`
    INSERT INTO
      invoices (comp_code, amt) VALUES ('${testCompany.code}', 200)
      RETURNING id, comp_code, amt, paid, add_date, paid_date`);
	testInvoice2 = invoice2.rows[0];

	testInvoice3 = {
		comp_code: 'testco',
		amt: 500,
		paid: false,
		paid_date: null
	};
});

/** GET /invoices - returns `{invoices: [{id, comp_code}, ...]}` */

describe('GET /invoices', function() {
	test('Gets a list of 2 invoices', async function() {
		const response = await request(app).get(`/invoices`);
		expect(response.statusCode).toEqual(200);
		expect(response.body).toEqual({
			invoices: [
				{ id: expect.any(Number), comp_code: testInvoice1.comp_code },
				{ id: expect.any(Number), comp_code: testInvoice2.comp_code }
			]
		});
	});
});

/** GET /invoices/[id] - return data about one invoice: '
 * {invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}}}' */

describe('GET /invoices/:id', function() {
	test('Gets a single invoice', async function() {
		const response = await request(app).get(`/invoices/${testInvoice1.id}`);
		expect(response.statusCode).toEqual(200);
		expect(response.body).toEqual({
			invoice: {
				id: testInvoice1.id,
				amt: testInvoice1.amt,
				paid: testInvoice1.paid,
				add_date: new Date(testInvoice1.add_date).toJSON(),
				paid_date: testInvoice1.paid_date,
				company: testCompany
			}
		});
	});

	test("Responds with 404 if can't find invoice", async function() {
		const response = await request(app).get(`/invoices/0`);
		expect(response.statusCode).toEqual(404);
	});
});

/** POST /invoices - create an invoice from data; return `{invoice: {id, comp_code, amt, paid, add_date, paid_date}}` */

describe('POST /invoices', function() {
	test('Creates a new invoice', async function() {
		const response = await request(app).post(`/invoices`).send({
			comp_code: testInvoice3.comp_code,
			amt: testInvoice3.amt
		});
		expect(response.statusCode).toEqual(201);
		expect(response.body).toEqual({
			invoice: {
				id: expect.any(Number),
				comp_code: testInvoice3.comp_code,
				amt: testInvoice3.amt,
				paid: testInvoice3.paid,
				add_date: expect.any(String),
				paid_date: testInvoice3.paid_date
			}
		});
	});
});

/** PUT /invoices/[id] - update invoice; return `{invoice: {id, comp_code, amt, paid, add_date, paid_date}}` */

describe('PUT /invoices/:id', function() {
	test('Updates a single invoice', async function() {
		const response = await request(app)
			.put(`/invoices/${testInvoice1.id}`)
			.send({
				amt: testInvoice3.amt
			});
		expect(response.statusCode).toEqual(200);
		expect(response.body).toEqual({
			invoice: {
				id: testInvoice1.id,
				comp_code: testInvoice1.comp_code,
				amt: testInvoice3.amt,
				paid: testInvoice1.paid,
				add_date: new Date(testInvoice1.add_date).toJSON(),
				paid_date: testInvoice1.paid_date
			}
		});
	});

	test("Responds with 404 if can't find invoice", async function() {
		const response = await request(app).put(`/invoices/0`);
		expect(response.statusCode).toEqual(404);
	});
});

/** DELETE /invoices/[id] - delete invoice, return `{status: "deleted"}` */

describe('DELETE /invoices/:id', function() {
	test('Deletes a single invoice', async function() {
		const response = await request(app).delete(`/invoices/${testInvoice1.id}`);
		expect(response.statusCode).toEqual(200);
		expect(response.body).toEqual({ status: 'deleted' });
	});
});

describe('GET /invoices/companies/:code', function() {
	test('Returns obj of company', async function() {
		const response = await request(app).get(
			`/invoices/companies/${testCompany.code}`
		);
		expect(response.statusCode).toEqual(200);
		expect(response.body).toEqual({
			company: {
				code: testCompany.code,
				name: testCompany.name,
				description: testCompany.description,
				invoices: [ testInvoice1.id, testInvoice2.id ]
			}
		});
	});
});

/********************************************************** */

afterEach(async function() {
	// delete any data created by test
	await db.query('DELETE FROM companies');
	await db.query('DELETE FROM invoices');
});

afterAll(async function() {
	// close db connection
	await db.end();
});
