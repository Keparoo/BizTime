// connect to right DB --- set before loading db.js
process.env.NODE_ENV = 'test';

// npm packages
const request = require('supertest');

// app imports
const app = require('../app');
const db = require('../db');

let testCompany;

beforeEach(async function() {
	let result = await db.query(`
    INSERT INTO
      companies (code, name, description) VALUES ('testco', 'Test Company', 'Test Descripton of TestCompany)
      RETURNING code, name, description`);
	testCompany = result.rows[0];
});

afterEach(async function() {
	// delete any data created by test
	await db.query('DELETE FROM companies');
});

afterAll(async function() {
	// close db connection
	await db.end();
});
