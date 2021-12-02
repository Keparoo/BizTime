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
			'SELECT id, amt, paid, add_date, paid_date, code, name, description FROM invoices JOIN companies ON invoices.comp_code=companies.code WHERE id = $1',
			[ req.params.id ]
		);

		if (invoiceQuery.rows.length === 0) {
			let notFoundError = new Error(
				`There is no invoice with id '${req.params.id}`
			);
			notFoundError.status = 404;
			throw notFoundError;
		}
		console.log(invoiceQuery.rows);
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

module.exports = router;
