const express = require("express");
const slugify = require("slugify");
const router = new express.Router();
const ExpressError = require("../expressError")
const db = require("../db")

router.get('/', async function(req, res, next) {
    try {
        const results = await db.query(`SELECT code, industry FROM industries`);
        return res.json({industries: results.rows});
    } catch (error) {
        return next(error);
    };
});

router.post('/', async function(req, res, next) {
    try {
        const {industry} = req.body
        let code
        if(!(req.body.code)){
            code = slugify(industry, {remove: /[!"#$%&'()*+,.\/:;<=>?@[\]^_·`{|}~]/g, lower: true})
        } else {
            code = req.body.code
        }
        const results = await db.query(`INSERT INTO industries VALUES ($1, $2)
                                        RETURNING code, industry`, [code, industry]);
        return res.status(201).json({industry: results.rows[0]});
    } catch (error) {
        return next(error);
    };
});

router.post('/company', async function(req, res, next) {
    try {
        const {comp_code, ind_code} = req.body
        const results = await db.query(`INSERT INTO companies_industries VALUES ($1, $2)
                                        RETURNING comp_code, ind_code`, [comp_code, ind_code]);
        if(results.rows.length === 0){
            throw new ExpressError('Company could not be found', 404)
        }
        return res.status(201).json({connection: results.rows[0]});
    } catch (error) {
        return next(error);
    };
});

router.put('/:code', async function(req, res, next) {
    try {
        const industry = req.body.industry
        const code = req.params.code
        const results = await db.query(`UPDATE industries SET industry=$1 WHERE code=$2
                                        RETURNING code, industry`, [industry, code]);
        if(results.rows.length === 0){
            throw new ExpressError('Company could not be found', 404)
        }
        return res.json({industry: results.rows[0]});
    } catch (error) {
        return next(error);
    };
});

router.delete('/:code', async function(req, res, next) {
    try {
        const code = req.params.code
        const results = await db.query(`DELETE FROM industries WHERE code=$1 RETURNING industry`, [code]);
        if(results.rows.length === 0){
            throw new ExpressError('Company could not be found', 404)
        }
        return res.json({message: "deleted"});
    } catch (error) {
        return next(error);
    };
});

module.exports = router;