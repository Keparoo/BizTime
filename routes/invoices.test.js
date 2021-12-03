// connect to right DB --- set before loading db.js
process.env.NODE_ENV = 'test';

// npm packages
const request = require('supertest');

// app imports
const app = require('../app');
const db = require('../db');

let testCompany;
let testInvoice1;
let testInvoice2;

beforeEach(async function() {
	let company = await db.query(`
    INSERT INTO
      companies (code, name, description) VALUES ('testco', 'Test Company', 'Test Descripton of TestCompany)
      RETURNING code, name, description`);
	testCompany = company.rows[0];

	let invoice1 = await db.query(`
    INSERT INTO
      companies (comp_code, amt) VALUES (${testCompany.code}, 100)
      RETURNING id, comp_code, amt, paid, add_date, paid_date`);
	testInvoice1 = invoice1.rows[0];

	let invoice2 = await db.query(`
    INSERT INTO
      companies (comp_code, amt) VALUES (${testCompany.code}, 200)
      RETURNING id, comp_code, amt, paid, add_date, paid_date`);
	testInvoice2 = invoice2.rows[0];
});

afterEach(async function() {
	// delete any data created by test
	await db.query('DELETE FROM companies');
	await db.query('DELETE FROM invoices');
});

afterAll(async function() {
	// close db connection
	await db.end();
});
