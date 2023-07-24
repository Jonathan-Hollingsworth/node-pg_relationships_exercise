const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError")
const db = require("../db")

router.get('/', async function(req, res, next) {
    try {
        const results = await db.query(`SELECT id, comp_code FROM invoices`)
        return res.json({invoices: results.rows})
    } catch (error) {
        return next(error)
    }
})

router.get('/:id', async function(req, res, next) {
    try {
        const iResults = await db.query(`SELECT id, amt, paid, add_date, paid_date FROM invoices
        WHERE id=$1`, [req.params.id])
        const iCompCodes = await db.query(`SELECT comp_code FROM invoices WHERE id=$1`, [req.params.id])
        if(iResults.rows.length === 0){
            throw new ExpressError('Invoice could not be found', 404)
        }
        const cResults = await db.query(`SELECT code, name, description FROM companies WHERE code=$1`, [iCompCodes.rows[0].comp_code])
        iResults.rows[0].company = cResults.rows[0]
        return res.json({invoice: iResults.rows[0]})
    } catch (error) {
        return next(error)
    }
})

router.post('/', async function(req, res, next) {
    try {
        const {comp_code, amt} = req.body
        const results = await db.query(`INSERT INTO invoices (comp_code, amt) VALUES ($1, $2)
        RETURNING id, comp_code, amt, paid, add_date, paid_date`, [comp_code, amt])
        if(results.rows.length === 0){
            throw new ExpressError('Invoice could not be found', 404)
        }
        return res.json({invoice: results.rows[0]})
    } catch (error) {
        return next(error)
    }
})

router.put('/:id', async function(req, res, next) {
    try {
        const results = await db.query(`UPDATE invoices SET amt=$1 WHERE id=$2
        RETURNING id, comp_code, amt, paid, add_date, paid_date`, [req.body.amt, req.params.id])
        return res.json({invoice: results.rows[0]})
    } catch (error) {
        return next(error)
    }
})

router.delete('/:id', async function(req, res, next) {
    try {
        const results = await db.query(`DELETE FROM invoices WHERE id=$1 RETURNING id`, [req.params.id]);
        if(results.rows.length === 0){
            throw new ExpressError('Invoice could not be found', 404)
        }
        return res.json({message: "deleted"})
    } catch (error) {
        return next(error)
    }
})

module.exports = router;