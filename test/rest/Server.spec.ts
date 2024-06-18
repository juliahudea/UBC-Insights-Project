import Server from "../../src/rest/Server";
import InsightFacade from "../../src/controller/InsightFacade";

import {expect} from "chai";
import request, {Response} from "supertest";
import {clearDisk, getRawContentFromArchives} from "../TestUtil";

describe("Facade D3", function () {

	let facade: InsightFacade;
	let server: Server;
	let content: any;
	let testQuery = {
		WHERE: {
			IS: {
				thing_instructor: "pai, kit"
			}
		},
		OPTIONS: {
			COLUMNS : [
				"thing_audit"
			],
			ORDER: "thing_audit"
		}
	};

	before(async function () {
		content = await getRawContentFromArchives("test1.zip");
		server = new Server(4321);
		await clearDisk();
		await server.start();
	});

	after(async function () {
		await server.stop();
	});

	beforeEach(function () {
		// might want to add some process logging here to keep track of what is going on
	});

	afterEach(function () {
		// might want to add some process logging here to keep track of what is going on
	});

	// Sample on how to format PUT requests
	it("succeded when given a put request with valid parameters", function () {
		return request("http://localhost:4321")
			.put("/dataset/thing/sections")
			.send(content)
			.set("Content-Type", "application/x-zip-compressed")
			.then(function (res: Response) {
				// some logging here please!
				expect(res.status).to.be.equal(200);
				expect(res.body.result).to.have.length(1);
				expect(res.body.result).to.have.members(["thing"]);
			})
			.catch(function (err: any) {
				// some logging here please!
				expect.fail();
			});
	});

	it("succeeded for a good query", function () {
		return request("http://localhost:4321")
			.post("/query")
			.send(testQuery)
			.set("Content-Type", "application/json")
			.then(function (res: Response) {
				// some logging here please!
				expect(res.status).to.be.equal(200);
				expect(res.body.result).to.have.length(1);
				expect(res.body.result[0]).to.include({thing_audit: 1});
			})
			.catch(function (err: any) {
				// some logging here please!
				expect.fail();
			});
	});

	it("fails for a bad query", function () {
		return request("http://localhost:4321")
			.post("/query")
			.send({})
			.set("Content-Type", "application/json")
			.then(function (res: Response) {
				// some logging here please!
				expect(res.status).to.be.equal(400);
			})
			.catch(function (err: any) {
				// some logging here please!
				expect.fail();
			});
	});

	it("fails when given a put request with invalid parameters", function () {
		return request("http://localhost:4321")
			.put("/dataset/thing/doors")
			.send(content)
			.set("Content-Type", "application/x-zip-compressed")
			.then(function (res: Response) {
				// some logging here please!\\

				expect(res.status).to.be.equal(400);
				expect(res.body.error).to.be.equal("Bad Kind");
			})
			.catch(function (err: any) {
				// some logging here please!
				expect.fail();
			});
	});

	it("it provides the correct list of databases for a get request", function () {
		return request("http://localhost:4321")
			.get("/datasets")
			.set("Content-Type", "application/x-zip-compressed")
			.then(function (res: Response) {
				// some logging here please
				expect(res.status).to.be.equal(200);
				expect(res.body.result).to.have.length(1);
				expect(res.body.result[0]).to.include({id: "thing", kind: "sections", numRows: 38});
			})
			.catch(function (err: any) {
				// some logging here please!
				expect.fail();
			});
	});

	it("it fails for removal if the database isn't present", function () {
		return request("http://localhost:4321")
			.delete("/dataset/hashtali")
			.set("Content-Type", "application/x-zip-compressed")
			.then(function (res: Response) {
				expect(res.status).to.be.equal(404);
			})
			.catch(function (err: any) {
				expect.fail();
			});
	});

	it("it succeeds for deleting if given correct parameters", function () {
		return request("http://localhost:4321")
			.delete("/dataset/thing")
			.set("Content-Type", "application/x-zip-compressed")
			.then(function (res: Response) {
				expect(res.status).to.be.equal(200);
				expect(res.body.result).to.be.equal("thing");
			})
			.catch(function (err: any) {
				expect.fail();
			});
	});


	// The other endpoints work similarly. You should be able to find all instructions at the supertest documentation
});
