// /companies routes

const express = require('express');
const router = new express.Router();
const db = require('../db');
const ExpressError = require('../expressError');

// GET / returns '{companies: [company, ...]}'
router.get('/', async function(req, res, next) {
	try {
		const companyQuery = await db.query(
			'SELECT code, name, description FROM companies'
		);
		return res.json({ companies: companyQuery.rows });
	} catch (err) {
		return next(err);
	}
});

module.exports = router;
