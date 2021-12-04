// /industries routes

const express = require('express');
const slugify = require('slugify');

const router = new express.Router();
const db = require('../db');
const ExpressError = require('../expressError');

// GET / returns all industries: '{industries: [industry, ...]}'
router.get('/', async function(req, res, next) {
	try {
		const industryQuery = await db.query(
			`SELECT code, industry
             FROM industries`
		);
		return res.json({ industries: industryQuery.rows });
	} catch (err) {
		return next(err);
	}
});

// POST / create an industry from data; return '{industry: industry}'
router.post('/', async function(req, res, next) {
	try {
		const result = await db.query(
			`INSERT INTO industries (code, industry) 
             VALUES ($1, $2) 
             RETURNING code, industry`,
			[
				slugify(req.body.code, { lower: true, strict: true }),
				req.body.industry
			]
		);

		return res.status(201).json({ industry: result.rows[0] }); // 201 CREATED
	} catch (err) {
		return next(err);
	}
});

module.exports = router;
