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
    const response = await request(app).patch(`/companies/fake`);
    expect(response.statusCode).toEqual(404);
  });
});

describe("DELETE /companies/:code", function() {
  test("Deletes a single company", async function() {
    const response = await request(app).delete(`/companies/${testComp.code}`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ message: "deleted" });
  });
});