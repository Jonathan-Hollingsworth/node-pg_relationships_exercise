const express = require("express");
const slugify = require("slugify")
const router = new express.Router();
const ExpressError = require("../expressError")
const db = require("../db")

router.get('/', async function(req, res, next) {
    try {
        const results = await db.query(`SELECT code, name FROM companies`);
        return res.json({companies: results.rows})
    } catch (error) {
        return next(error)
    }
})

router.get('/:code', async function(req, res, next) {
    try {
        const code = req.params.code
        let cQuery = db.query(`SELECT c.code, c.name, c.description, i.industry FROM companies AS c
                                 LEFT JOIN companies_industries AS ci
                                   ON ci.comp_code = c.code
                                 LEFT JOIN industries AS i ON i.code = ci.ind_code 
                               WHERE c.code=$1`, [code]);
        let iQuery = db.query(`SELECT id FROM invoices WHERE comp_code=$1`, [code]);
        const results = await Promise.all([cQuery, iQuery])
        const cResults = results[0] //results of cQuery
        const iResults = results[1] //results of iQuery
        if(cResults.rows.length === 0){
            throw new ExpressError('Company could not be found', 404)
        }
        const {name, description} = cResults.rows[0]
        const industries = cResults.rows.map(r => r.industry)
        const invoices = iResults.rows
        return res.json({company: {code, name, description, invoices, industries}})
    } catch (error) {
        return next(error)
    }
})

router.post('/', async function(req, res, next) {
    try {
        const {name, description} = req.body
        const code = slugify(name, {remove: /[!"#$%&'()*+,.\/:;<=>?@[\]^_·`{|}~]/g, lower: true})
        const results = await db.query(`INSERT INTO companies (code, name, description)
        VALUES ($1, $2, $3) RETURNING code, name, description`, [code, name, description]);
        return res.json({companies: results.rows[0]})
    } catch (error) {
        return next(error)
    }
})

router.put('/:code', async function(req, res, next) {
    try {
        const code = req.params.code
        const {name, description} = req.body
        const results = await db.query(`UPDATE companies SET name=$1, description=$2 WHERE code=$3
        RETURNING code, name, description`, [name, description, code]);
        if(results.rows.length === 0){
            throw new ExpressError('Company could not be found', 404)
        }
        return res.json({company: results.rows[0]})
    } catch (error) {
        return next(error)
    }
})

router.delete('/:code', async function(req, res, next) {
    try {
        const code = req.params.code
        const results = await db.query(`DELETE FROM companies WHERE code=$1 RETURNING code, name, description`, [code]);
        if(results.rows.length === 0){
            throw new ExpressError('Company could not be found', 404)
        }
        return res.json({message: "deleted"})
    } catch (error) {
        return next(error)
    }
})

module.exports = router;