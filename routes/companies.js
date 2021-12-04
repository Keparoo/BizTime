// /companies routes

const express = require('express');
const slugify = require('slugify');

const router = new express.Router();
const db = require('../db');
const ExpressError = require('../expressError');

// GET / returns all companies: '{companies: [company, ...]}'
router.get('/', async function(req, res, next) {
	try {
		const companyQuery = await db.query(
			`SELECT code, name, description
             FROM companies`
		);
		return res.json({ companies: companyQuery.rows });
	} catch (err) {
		return next(err);
	}
});

//GET /:code returns data about one company: '{company: company}'
router.get('/:code', async function(req, res, next) {
	try {
		const results = await db.query(
			`SELECT i.code, i.industry, c.code, c.name, c.description
             FROM industries AS i
             JOIN companies_industries AS ci
             ON i.code = ci.ind_code
             JOIN companies AS c
             ON ci.comp_code = c.code
             WHERE c.code = $1`,
			[ req.params.code ]
		);

		const { code, name, description } = results.rows[0];
		industryList = results.rows.map((i) => i.industry);

		if (results.rows.length === 0) {
			let notFoundError = new Error(
				`There is no company with code '${req.params.code}`
			);
			notFoundError.status = 404;
			throw notFoundError;
		}

		return res.json({
			company: { code, name, description, industries: industryList }
		});
	} catch (err) {
		return next(err);
	}
});

// POST / create company from data; return '{company: company}'
router.post('/', async function(req, res, next) {
	try {
		const result = await db.query(
			`INSERT INTO companies (code, name, description) 
             VALUES ($1, $2, $3) 
             RETURNING code, name, description`,
			[
				slugify(req.body.code, { lower: true, strict: true }),
				req.body.name,
				req.body.description
			]
		);

		return res.status(201).json({ company: result.rows[0] }); // 201 CREATED
	} catch (err) {
		return next(err);
	}
});

// PUT /:id update all fields in a company; return '{company: company}
router.put('/:code', async function(req, res, next) {
	try {
		if (!'code' in req.body) {
			throw new ExpressError('Not allowed', 400);
		}

		const result = await db.query(
			`UPDATE companies 
             SET code=$1, name=$2, description=$3
             WHERE code = $4
             RETURNING code, name, description`,
			[ req.body.code, req.body.name, req.body.description, req.params.code ]
		);

		if (result.rows.length === 0) {
			let notFoundError = new Error(
				`There is no company with code of '${req.params.code}`
			);
			notFoundError.status = 404;
			throw notFoundError;
		}

		return res.json({ company: result.rows[0] });
	} catch (err) {
		return next(err);
	}
});

// DELETE /:id delete company, return: '{status: "Company deleted"}
router.delete('/:code', async function(req, res, next) {
	try {
		const result = await db.query(
			'DELETE FROM companies WHERE code = $1 RETURNING code',
			[ req.params.code ]
		);

		if (result.rows.length === 0) {
			throw new ExpressError(
				`There is no company with code of '${req.params.company}`,
				404
			);
		}
		return res.json({ status: 'Company deleted' });
	} catch (err) {
		return next(err);
	}
});

module.exports = router;
