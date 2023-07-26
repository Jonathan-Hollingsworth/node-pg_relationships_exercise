process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../app");
const db = require("../db");

let testComp;
let testInv;
let testInd;
let testCompInd;

beforeEach(async function() {
  let compQuery = db.query(`
    INSERT INTO companies VALUES ('test-c', 'Test Company', 'Testing')
      RETURNING code, name, description`);
  let indQuery = db.query(`
  INSERT INTO industries VALUES ('test-i', 'Test Industry')
    RETURNING code, industry`);
  const result1 = await Promise.all([compQuery, indQuery]) //ensuring that these two queries are processed
  let invQuery = db.query(`
  INSERT INTO invoices (comp_Code, amt, paid, paid_date) VALUES ('test-c', 100, false, null)
    RETURNING id, comp_code, amt, paid, add_date, paid_date`);
  let compIndQuery = db.query(`
  INSERT INTO companies_industries VALUES ('test-c', 'test-i')
    RETURNING comp_code, ind_code`);
    const result2 = await Promise.all([invQuery, compIndQuery])
  testComp = result1[0].rows[0];
  testInd = result1[1].rows[0];
  testInv = result2[0].rows[0]
  testCompInd = result2[1].rows[0];
});

afterEach(async function() {
  // delete any data created by test
  await db.query("DELETE FROM companies_industries");
  await db.query("DELETE FROM invoices");
  await db.query("DELETE FROM companies");
  await db.query("DELETE FROM industries");
});

afterAll(async function() {
  // close db connection
  await db.end();
});

describe('/companies', function() {

  describe("GET /companies", function() {
    
    test("Gets a list of 1 company", async function() {
      const response = await request(app).get(`/companies`);
      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({companies: [{code: testComp.code, name:testComp.name}]});
    });
  });
  
  describe("GET /companies/:code", function() {

    test("Gets a single company", async function() {
      const response = await request(app).get(`/companies/${testComp.code}`);
      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({company: {
        code: testComp.code, 
        name: testComp.name, 
        description: testComp.description,
        invoices: [{id: testInv.id}],
        industries: [testInd.industry]
      }});
    });
  
    test("Responds with 404 if can't find company", async function() {
      const response = await request(app).get(`/companies/fake`);
      expect(response.statusCode).toEqual(404);
    });
  });
  
  describe("POST /companies", function() {

    test("Creates a new company", async function() {
      const response = await request(app).post(`/companies`).send({name: "Demo", description: "Demonstration"});
      expect(response.statusCode).toEqual(201);
      expect(response.body).toEqual({company: {code: "demo", name: "Demo", description: "Demonstration"}});
    });
  });
  
  describe("PUT /companies/:code", function() {

    test("Updates a single company", async function() {
      const response = await request(app).put(`/companies/${testComp.code}`).send({name: "Demo", description: "Demonstration"});
      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({company: {code: testComp.code, name: "Demo", description: "Demonstration"}});
    });
  
    test("Responds with 404 if can't find company", async function() {
      const response = await request(app).put(`/companies/fake`).send({name: "Demo", description: "Demonstration"});
      expect(response.statusCode).toEqual(404);
    });
  });
  
  describe("DELETE /companies/:code", function() {

    test("Deletes a single company", async function() {
      const response = await request(app).delete(`/companies/${testComp.code}`);
      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({ message: "deleted" });
    });

    test("Responds with 404 if can't find company", async function() {
      const response = await request(app).delete(`/companies/fake`);
      expect(response.statusCode).toEqual(404);
    });
  });
});

describe("/invoices", function() {

  describe("GET /invoices", function() {

    test("Gets a list of 1 invoice", async function() {
      const response = await request(app).get(`/invoices`);
      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({invoices: [{id: testInv.id, comp_code: testComp.code}]});
    });
  });
  
  describe("GET /invoices/:id", function() {

    test("Gets a single invoice", async function() {
      const response = await request(app).get(`/invoices/${testInv.id}`);
      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({invoice: {
        id: testInv.id, 
        amt: testInv.amt, 
        paid: testInv.paid,
        add_date: expect.any(String),
        paid_date: null,
        company: testComp
      }});
    });
  
    test("Responds with 404 if can't find invoice", async function() {
      const response = await request(app).get(`/invoices/0`);
      expect(response.statusCode).toEqual(404);
    });
  });
  
  describe("POST /invoices", function() {

    test("Creates a new invoice", async function() {
      const response = await request(app).post(`/invoices`).send({comp_code: testComp.code, amt: 600});
      expect(response.statusCode).toEqual(201);
      expect(response.body).toEqual({invoice: {
        id: expect.any(Number),
        comp_code: testComp.code, 
        amt: 600, 
        paid: false,
        add_date: expect.any(String),
        paid_date: null
      }});
    });
  });
  
  describe("PUT /invoices/:id", function() {

    test("Pays a single invoice", async function() {
      const response = await request(app).put(`/invoices/${testInv.id}`).send({amt: 100, paid: true});
      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({invoice: {
        id: expect.any(Number),
        comp_code: testComp.code, 
        amt: 100, 
        paid: true,
        add_date: expect.any(String),
        paid_date: expect.any(String)
      }});
    });

    test("Un-pays a single invoice", async function() {
      await request(app).put(`/invoices/${testInv.id}`).send({amt: 100, paid: true}); //Pay it so it can then be unpaid
      const response = await request(app).put(`/invoices/${testInv.id}`).send({amt: 100, paid: false});
      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({invoice: {
        id: expect.any(Number),
        comp_code: testComp.code, 
        amt: 100, 
        paid: false,
        add_date: expect.any(String),
        paid_date: null
      }});
    });

    test("Changes the amount a single invoice", async function() {
      const response = await request(app).put(`/invoices/${testInv.id}`).send({amt: 400, paid: false}); //all invoices start unpaid
      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({invoice: {
        id: expect.any(Number),
        comp_code: testComp.code, 
        amt: 400, 
        paid: false,
        add_date: expect.any(String),
        paid_date: null
      }});
    });
  
    test("Responds with 404 if can't find invoice", async function() {
      const response = await request(app).put(`/invoices/0`).send({amt: 400, paid: false});
      expect(response.statusCode).toEqual(404);
    });
  });
  
  describe("DELETE /invoices/:id", function() {
    test("Deletes a single invoice", async function() {
      const response = await request(app).delete(`/invoices/${testInv.id}`);
      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({ message: "deleted" });
    });

    test("Responds with 404 if can't find invoice", async function() {
      const response = await request(app).delete(`/invoices/0`);
      expect(response.statusCode).toEqual(404);
    });
  });
});

describe("/industries", function() {

  describe("GET /industries", function() {

    test("Gets a list of 1 industry", async function() {
      const response = await request(app).get(`/industries`);
      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({industries: [testInd]});
    });
  });
  
  describe("POST /industries", function() {

    test("Creates a new industry", async function() {
      const response = await request(app).post(`/industries`).send({code: "demo", industry: "Demo"});
      expect(response.statusCode).toEqual(201);
      expect(response.body).toEqual({industry: {code: "demo", industry: "Demo"}});
    });

    test("Slugifies name if no code given", async function() {
      const response = await request(app).post(`/industries`).send({industry: "SLUG"});
      expect(response.statusCode).toEqual(201);
      expect(response.body).toEqual({industry: {code: "slug", industry: "SLUG"}});
    });
  });

  describe("POST /industries/company", function() {

    test("Connects an industry to a company", async function() {
      await request(app).post(`/industries`).send({code: "demo", industry: "Demo"});
      const response = await request(app).post(`/industries/company`).send({comp_code: testComp.code, ind_code: "demo"});
      expect(response.statusCode).toEqual(201);
      expect(response.body).toEqual({connection: {comp_code: testComp.code, ind_code: "demo"}});
    });

    test("Responds with error if can't find industry or company", async function() {
      let iQuery = request(app).post(`/industries/company`).send({comp_code: testComp.code, ind_code: "demo"});
      let cQuery = request(app).post(`/industries/company`).send({comp_code: "fake", ind_code: testInd.code});
      const responses = await Promise.all([iQuery, cQuery])
      const iResponse = responses[0]
      const cResponse = responses[1]
      expect(iResponse.statusCode).toEqual(500);
      expect(cResponse.statusCode).toEqual(500);
    });
  });
  
  describe("PUT /industries/:code", function() {

    test("Updates a single industry", async function() {
      const response = await request(app).put(`/industries/${testInd.code}`).send({industry: "Demo"});
      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({industry: {code: testInd.code, industry: "Demo"}});
    });
  
    test("Responds with 404 if can't find industry", async function() {
      const response = await request(app).put(`/industries/fake`).send({industry: "Demo"});
      expect(response.statusCode).toEqual(404);
    });
  });
  
  describe("DELETE /industries/:code", function() {
    test("Deletes a single industry", async function() {
      const response = await request(app).delete(`/industries/${testInd.code}`);
      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({ message: "deleted" });
    });

    test("Responds with 404 if can't find industry", async function() {
      const response = await request(app).delete(`/industries/fake`);
      expect(response.statusCode).toEqual(404);
    });
  });
});