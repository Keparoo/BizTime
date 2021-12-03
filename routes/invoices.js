// /invoices routes

const express = require('express');
const router = new express.Router();
const db = require('../db');
const ExpressError = require('../expressError');

// GET / returns all invoices: '{invoices: [{id, comp_code}, ...]}'
router.get('/', async function(req, res, next) {
	try {
		const invoiceQuery = await db.query('SELECT id, comp_code FROM invoices');
		return res.json({ invoices: invoiceQuery.rows });
	} catch (err) {
		return next(err);
	}
});

//GET /:id returns data about one invoice: '{company: {id, amt, paid, add_date, paid_date, company: {code, name, description}}}'
router.get('/:id', async function(req, res, next) {
	try {
		const invoiceQuery = await db.query(
			`SELECT id, amt, paid, add_date, paid_date, code, name, description
             FROM invoices
             JOIN companies
             ON invoices.comp_code=companies.code
             WHERE id = $1`,
			[ req.params.id ]
		);

		// if (invoiceQuery.rows.length === 0) {
		// 	throw new ExpressError(
		// 		`There is no invoice with id '${req.params.id}`,
		// 		404
		// 	);
		// }

		if (invoiceQuery.rows.length === 0) {
			let notFoundError = new Error(
				`There is no invoice with id '${req.params.id}`
			);
			notFoundError.status = 404;
			throw notFoundError;
		}

		const {
			id,
			amt,
			paid,
			add_date,
			paid_date,
			code,
			name,
			description
		} = invoiceQuery.rows[0];
		return res.json({
			invoice: {
				id,
				amt,
				paid,
				add_date,
				paid_date,
				company: { code, name, description }
			}
		});
	} catch (err) {
		return next(err);
	}
});

// POST / create invoice from data; return '{invoice: {id, comp_code, amt, paid, add_date, paid_date}}'
router.post('/', async function(req, res, next) {
	try {
		const result = await db.query(
			`INSERT INTO invoices (comp_code, amt) 
             VALUES ($1, $2) 
             RETURNING id, comp_code, amt, paid, add_date, paid_date`,
			[ req.body.comp_code, req.body.amt ]
		);

		return res.status(201).json({ invoice: result.rows[0] }); // 201 CREATED
	} catch (err) {
		return next(err);
	}
});

// PUT /:amt invoice amount; return '{invoice: {id, comp_code, amt, paid, add_date, paid_date}}'
router.put('/:id', async function(req, res, next) {
	try {
		if (!'id' in req.body) {
			throw new ExpressError('Not allowed', 400);
		}

		const result = await db.query(
			`UPDATE invoices 
             SET amt=$1
             WHERE id = $2
             RETURNING id, comp_code, amt, paid, add_date, paid_date`,
			[ req.body.amt, req.params.id ]
		);

		if (result.rows.length === 0) {
			let notFoundError = new Error(
				`There is no invoice with id '${req.params.id}`
			);
			notFoundError.status = 404;
			throw notFoundError;
		}

		const { id, comp_code, amt, paid, add_date, paid_date } = result.rows[0];

		return res.json({
			invoice: { id, comp_code, amt, paid, add_date, paid_date }
		});
	} catch (err) {
		return next(err);
	}
});

// DELETE /:id delete invoice, return: '{status: "deleted"}'
router.delete('/:id', async function(req, res, next) {
	try {
		const result = await db.query(
			'DELETE FROM invoices WHERE id = $1 RETURNING id',
			[ req.params.id ]
		);

		if (result.rows.length === 0) {
			throw new ExpressError(
				`There is no invoice with id of '${req.params.id}`,
				404
			);
		}
		return res.json({ status: 'deleted' });
	} catch (err) {
		return next(err);
	}
});

//GET /:code returns data about one company: '{company: {code, name, description, invoices: [id, ...]}}'
router.get('/companies/:code', async function(req, res, next) {
	try {
		const invoiceQuery = await db.query(
			`SELECT id, code, name, description
             FROM invoices
             JOIN companies
             ON invoices.comp_code=companies.code
             AND code = $1;`,
			[ req.params.code ]
		);

		if (invoiceQuery.rows.length === 0) {
			throw (notFoundError = new Error(
				`There is no invoice with id '${req.params.code}`,
				404
			));
		}

		// if (invoiceQuery.rows.length === 0) {
		// 	throw new ExpressError(
		// 		`There is no invoice with id '${req.params.code}`,
		// 		404
		// 	);
		// }

		const invoiceIdList = invoiceQuery.rows.map((i) => i.id);
		const company = invoiceQuery.rows[0];
		return res.json({
			company: {
				code: company.code,
				name: company.name,
				description: company.description,
				invoices: invoiceIdList
			}
		});
	} catch (err) {
		return next(err);
	}
});

module.exports = router;
