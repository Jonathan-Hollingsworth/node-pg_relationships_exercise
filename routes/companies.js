const express = require("express");
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
        const cResults = await db.query(`SELECT code, name, description FROM companies WHERE code=$1`, [code]);
        const iResults = await db.query(`SELECT id FROM invoices WHERE comp_code=$1`, [code]);
        if(cResults.rows.length === 0){
            throw new ExpressError('Company could not be found', 404)
        }
        cResults.rows[0].invoices = iResults.rows
        return res.json({company: cResults.rows[0]})
    } catch (error) {
        return next(error)
    }
})

router.post('/', async function(req, res, next) {
    try {
        const {code, name, description} = req.body
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