"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Server_1 = __importDefault(require("../../src/rest/Server"));
const chai_1 = require("chai");
const supertest_1 = __importDefault(require("supertest"));
const TestUtil_1 = require("../TestUtil");
describe("Facade D3", function () {
    let facade;
    let server;
    let content;
    let testQuery = {
        WHERE: {
            IS: {
                thing_instructor: "pai, kit"
            }
        },
        OPTIONS: {
            COLUMNS: [
                "thing_audit"
            ],
            ORDER: "thing_audit"
        }
    };
    before(async function () {
        content = await (0, TestUtil_1.getContentFromArchives)("test1.zip");
        server = new Server_1.default(4321);
        await (0, TestUtil_1.clearDisk)();
        await server.start();
    });
    after(async function () {
        await server.stop();
    });
    beforeEach(function () {
    });
    afterEach(function () {
    });
    it("succeded when given a put request with valid parameters", function () {
        return (0, supertest_1.default)("http://localhost:4321")
            .put("/dataset/thing/sections")
            .send(content)
            .set("Content-Type", "application/x-zip-compressed")
            .then(function (res) {
            (0, chai_1.expect)(res.status).to.be.equal(200);
            (0, chai_1.expect)(res.body.result).to.have.length(1);
            (0, chai_1.expect)(res.body.result).to.have.members(["thing"]);
        })
            .catch(function (err) {
            chai_1.expect.fail();
        });
    });
    it("succeeded for a good query", function () {
        return (0, supertest_1.default)("http://localhost:4321")
            .post("/query")
            .send(testQuery)
            .set("Content-Type", "application/json")
            .then(function (res) {
            (0, chai_1.expect)(res.status).to.be.equal(200);
            (0, chai_1.expect)(res.body.result).to.have.length(1);
            (0, chai_1.expect)(res.body.result[0]).to.include({ thing_audit: 1 });
        })
            .catch(function (err) {
            chai_1.expect.fail();
        });
    });
    it("fails for a bad query", function () {
        return (0, supertest_1.default)("http://localhost:4321")
            .post("/query")
            .send({})
            .set("Content-Type", "application/json")
            .then(function (res) {
            (0, chai_1.expect)(res.status).to.be.equal(400);
        })
            .catch(function (err) {
            chai_1.expect.fail();
        });
    });
    it("fails when given a put request with invalid parameters", function () {
        return (0, supertest_1.default)("http://localhost:4321")
            .put("/dataset/thing/doors")
            .send(content)
            .set("Content-Type", "application/x-zip-compressed")
            .then(function (res) {
            (0, chai_1.expect)(res.status).to.be.equal(400);
            (0, chai_1.expect)(res.body.error).to.be.equal("Bad Kind");
        })
            .catch(function (err) {
            chai_1.expect.fail();
        });
    });
    it("it provides the correct list of databases for a get request", function () {
        return (0, supertest_1.default)("http://localhost:4321")
            .get("/datasets")
            .set("Content-Type", "application/x-zip-compressed")
            .then(function (res) {
            (0, chai_1.expect)(res.status).to.be.equal(200);
            (0, chai_1.expect)(res.body.result).to.have.length(1);
            (0, chai_1.expect)(res.body.result[0]).to.include({ id: "thing", kind: "sections", numRows: 38 });
        })
            .catch(function (err) {
            chai_1.expect.fail();
        });
    });
    it("it fails for removal if the database isn't present", function () {
        return (0, supertest_1.default)("http://localhost:4321")
            .delete("/dataset/hashtali")
            .set("Content-Type", "application/x-zip-compressed")
            .then(function (res) {
            (0, chai_1.expect)(res.status).to.be.equal(404);
        })
            .catch(function (err) {
            chai_1.expect.fail();
        });
    });
    it("it succeeds for deleting if given correct parameters", function () {
        return (0, supertest_1.default)("http://localhost:4321")
            .delete("/dataset/thing")
            .set("Content-Type", "application/x-zip-compressed")
            .then(function (res) {
            (0, chai_1.expect)(res.status).to.be.equal(200);
            (0, chai_1.expect)(res.body.result).to.be.equal("thing");
        })
            .catch(function (err) {
            chai_1.expect.fail();
        });
    });
});
//# sourceMappingURL=Server.spec.js.map