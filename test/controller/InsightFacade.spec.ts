import {
	InsightDatasetKind,
	InsightError,
	NotFoundError,
	ResultTooLargeError
} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";

import {expect, use} from "chai";
import chaiAsPromised from "chai-as-promised";
import {clearDisk, getContentFromArchives, readFileQueries} from "../TestUtil";

use(chaiAsPromised);

export interface ITestQuery {
	title: string;
	input: unknown;
	errorExpected: boolean;
	expected: any;
}

describe("InsightFacade", function () {
	describe("addDataset", function () {
		let content: string;
		before(async function() {
			try {
				content = await getContentFromArchives("test1.zip");

			} catch (e) {
				expect.fail("not supposed to fail when fetching file from archive");
			}
		});

		it("should fail when given an empty id", async function () {
			const facade = new InsightFacade();

			let result;
			try {
				result = await facade.addDataset("", content, InsightDatasetKind.Sections);
				expect.fail("supposed to fail");
			} catch(err) {
				result = err;
			} finally {
				expect(result).to.be.instanceof(InsightError);
			}
		});

		it("should fail when given an id with an underscore", async function () {
			const facade = new InsightFacade();

			let result;
			try {
				result = await facade.addDataset("ahbar_ali", content, InsightDatasetKind.Sections);
				expect.fail("supposed to reject");
			} catch(err) {
				result = err;
			} finally {
				expect(result).to.be.instanceof(InsightError);
			}
		});

		it("should fail if id has already been added", async function () {
			const facade = new InsightFacade();


			let result;
			try {
				result = await facade.addDataset("hashem", content, InsightDatasetKind.Sections);
				result = await facade.addDataset("hashem", content, InsightDatasetKind.Sections);
				expect.fail("supposed to reject");
			} catch(err) {
				result = err;
			} finally {
				expect(result).to.be.instanceof(InsightError);
			}
		});


		it("should fail if the database is empty", async function () {
			const facade = new InsightFacade();


			let result;
			try {
				const contentEmpty = await getContentFromArchives("empty_database.zip");
				result = await facade.addDataset("hashem", contentEmpty, InsightDatasetKind.Sections);
				expect.fail("supposed to reject");
			} catch(err) {
				result = err;
			} finally {
				expect(result).to.be.instanceof(InsightError);
			}
		});

		it("should fail if the database only has an invalid section", async function () {
			const facade = new InsightFacade();


			let result;
			try {
				const contentInvalid = await getContentFromArchives("invalid_section.zip");
				result = await facade.addDataset("hashem", contentInvalid, InsightDatasetKind.Sections);
				expect.fail("supposed to reject");
			} catch(err) {
				result = err;
			} finally {
				expect(result).to.be.instanceof(InsightError);
			}
		});

		it("should fail, has an invalid course", async function () {
			const facade = new InsightFacade();


			let result;
			try {
				const contentInvalid = await getContentFromArchives("invalid_course.zip");
				result = await facade.addDataset("hashem", contentInvalid, InsightDatasetKind.Sections);
				expect.fail("supposed to reject");
			} catch(err) {
				result = err;
			} finally {
				expect(result).to.be.instanceof(InsightError);
			}
		});

		it("should fail, has bad structure", async function () {
			const facade = new InsightFacade();


			let result;
			try {
				const contentBad = await getContentFromArchives("bad_structure.zip");
				result = await facade.addDataset("hashem", contentBad, InsightDatasetKind.Sections);
				expect.fail("supposed to reject");
			} catch(err) {
				result = err;
			} finally {
				expect(result).to.be.instanceof(InsightError);
			}
		});

		it("should fail if the content is not correct", async function () {
			const facade = new InsightFacade();


			let result;
			try {
				result = await facade.addDataset("hashem", "ahmadali", InsightDatasetKind.Sections);
				expect.fail("supposed to reject");
			} catch(err) {
				result = err;
			} finally {
				expect(result).to.be.instanceof(InsightError);
			}
		});

		it("should succeed with an array of ids if the params are good", async function () {
			const facade = new InsightFacade();

			let result;
			let result2;
			try {
				result = await facade.addDataset("hashem", content, InsightDatasetKind.Sections);
				result2 = await facade.addDataset("heshmat", content,InsightDatasetKind.Sections);
			} catch(err) {
				expect.fail("should not reject or throw exceptions");
				result = err;
			} finally {
				expect(result).to.have.lengthOf(1);
				expect(result2).to.have.lengthOf(2);
				expect(result).to.include("hashem");
				expect(result2).to.have.members(["hashem", "heshmat"]);
			}
		});

		it("should retain information once a new instance is created", async function () {
			const facade = new InsightFacade();
			let facade2: InsightFacade;


			let result;
			let result2;
			let result3;
			try {
				result = await facade.addDataset("hashem", content, InsightDatasetKind.Sections);
				result2 = await facade.addDataset("heshmat", content,InsightDatasetKind.Sections);
				facade2 = new InsightFacade();
				result3 = await facade2.listDatasets();
			} catch(err) {
				expect.fail("should not reject or throw exceptions");
				result = err;
			} finally {
				expect(result3).to.have.lengthOf(2);

			}
		});

		it("should succeed with Sections kind", async function () {
			const facade = new InsightFacade();

			let result;
			try {
				result = await facade.addDataset("hashem", content, InsightDatasetKind.Sections);
			} catch(err) {
				expect.fail("should not reject or throw exceptions");
				result = err;
			} finally {
				expect(result).to.have.lengthOf(1);
				expect(result).to.include("hashem");
			}
		});

		it("should fail with Rooms kind", async function () {
			const facade = new InsightFacade();

			let result;
			try {
				result = await facade.addDataset("hashem", content, InsightDatasetKind.Rooms);
				expect.fail("supposed to reject");
			} catch(err) {
				result = err;
			} finally {
				expect(result).to.be.instanceof(InsightError);
			}
		});

		afterEach("clearDisk", async function () {
			await clearDisk();
		});
	});

	describe("addDataset, section content test", function() {
		let sections: string;
		let facade: InsightFacade;

		beforeEach(async function() {
			facade = new InsightFacade();
		});

		afterEach(async function() {
			await clearDisk();
		});

		it ("should reject dataset with no content", async function() {
			const result = facade.addDataset("courses", "", InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("should reject section with missing avg field", async function() {
			sections = await getContentFromArchives("missingavgfield.zip");

			const result = facade.addDataset("courses", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("should reject section with missing audit field", async function() {
			sections = await getContentFromArchives("missingauditfield.zip");

			const result = facade.addDataset("courses", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("should reject section with missing dept field", async function() {
			sections = await getContentFromArchives("missingdeptfield.zip");

			const result = facade.addDataset("courses", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("should reject section with missing fail field", async function() {
			sections = await getContentFromArchives("missingfailfield.zip");

			const result = facade.addDataset("courses", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("should reject section with missing id field", async function() {
			sections = await getContentFromArchives("missingidfield.zip");

			const result = facade.addDataset("courses", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("should reject section with missing instructor field", async function() {
			sections = await getContentFromArchives("missinginstructorfield.zip");

			const result = facade.addDataset("courses", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("should reject section with missing pass field", async function() {
			sections = await getContentFromArchives("missingpassfield.zip");

			const result = facade.addDataset("courses", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("should reject section with missing title field", async function() {
			sections = await getContentFromArchives("missingtitlefield.zip");

			const result = facade.addDataset("courses", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("should reject section with missing uuid field", async function() {
			sections = await getContentFromArchives("missinguuidfield.zip");

			const result = facade.addDataset("courses", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("should reject section with missing year field", async function() {
			sections = await getContentFromArchives("missingyearfield.zip");

			const result = facade.addDataset("courses", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("should reject dataset with missing courses folder", async function() {
			sections = await getContentFromArchives("missingcoursesfolder.zip");

			const result = facade.addDataset("courses", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("should reject dataset with missing results field", async function() {
			sections = await getContentFromArchives("missingresultsfield.zip");

			const result = facade.addDataset("courses", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("should reject dataset with zero sections", async function() {
			sections = await getContentFromArchives("zerosections.zip");

			const result = facade.addDataset("courses", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("should successfully add single section", async function() {
			sections = await getContentFromArchives("singlesection.zip");

			const result = facade.addDataset("courses", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.have.members(["courses"]);
		});

		it ("should reject dataset with invalid JSON", async function() {
			sections = await getContentFromArchives("invalidjson.zip");

			const result = facade.addDataset("courses", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("should successfully add dataset with some invalid sections", async function() {
			sections = await getContentFromArchives("someinvalidsections.zip");

			const result = facade.addDataset("courses", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.have.members(["courses"]);
		});
	});

	describe("addDataset, room content test", function() {
		let rooms: string;
		let facade: InsightFacade;

		beforeEach(async function() {
			facade = new InsightFacade();
		});

		afterEach(async function() {
			await clearDisk();
		});

		it ("should reject dataset with no content", async function() {
			const result = facade.addDataset("courses", "", InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("should fail when adding dataset with only sections", async function() {
			let sections = await getContentFromArchives("singlesection.zip");

			const result = facade.addDataset("rooms", sections, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("should fail when there is no index file", async function() {
			rooms = await getContentFromArchives("noindex.zip");

			const result = facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("should fail when index has no valid table", async function() {
			rooms = await getContentFromArchives("indexwithnotable.zip");

			const result = facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("should fail when there is only an index file", async function() {
			rooms = await getContentFromArchives("onlyindex.zip");

			const result = facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("should fail when the table has no links", async function() {
			rooms = await getContentFromArchives("tablewithnolinks.zip");

			const result = facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("should fail when there are no rooms (even though there are tables)", async function() {
			rooms = await getContentFromArchives("norooms.zip");

			const result = facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("should fail when all rooms are invalid", async function() {
			rooms = await getContentFromArchives("invalidrooms.zip");

			const result = facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("should fail when the geolocation fails but everything else is valid", async function() {
			rooms = await getContentFromArchives("invalidgeolocation.zip");

			const result = facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("should add a valid rooms dataset with only one building", async function() {
			rooms = await getContentFromArchives("singlebuilding.zip");

			const result = facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.have.members(["rooms"]);
		});

		it ("should add a valid rooms dataset with two buildings", async function() {
			rooms = await getContentFromArchives("twobuildings.zip");

			const result = facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.have.members(["rooms"]);
		});

		it ("should add a valid rooms dataset with three buildings", async function() {
			rooms = await getContentFromArchives("threebuildings.zip");

			const result = facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.have.members(["rooms"]);
		});

	});

	describe("listDatasets", function () {
		let content: string;
		before(async function() {
			try {
				content = await getContentFromArchives("test1.zip");
			} catch (e) {
				expect.fail("not supposed to fail when fetching file from archive");
			}
		});

		it("should return an empty list when there are no datasets", async function () {
			const facade = new InsightFacade();

			let result;
			try {
				result = await facade.listDatasets();
				console.log(result);
			} catch (err) {
				expect.fail("should not reject");
			} finally {
				expect(result).to.be.empty;
			}
		});

		it("should return a list of correct datasets", async function () {
			const facade = new InsightFacade();


			let result;
			try {
				let add = await facade.addDataset("karim", content, InsightDatasetKind.Sections);
				result = await facade.listDatasets();
			} catch (err) {
				expect.fail("should not reject");
			} finally {
				expect(result).to.have.lengthOf(1);
				expect(result?.at(0)?.id).to.equal("karim");
			}
		});

		afterEach("clearDisk", async function () {
			await clearDisk();
		});
	});

	describe("removeDataset", function () {
		let content: string;
		before(async function() {
			try {
				content = await getContentFromArchives("test1.zip");
			} catch (e) {
				expect.fail("not supposed to fail when fetching file from archive");
			}
		});

		it("should fail if there are no datasets or it does not match", async function () {
			const facade = new InsightFacade();

			let result;
			try {
				result = await facade.removeDataset("ahbar");
				expect.fail("it should reject when there are no datasets");
			} catch (err) {
				result = err;
			} finally {
				expect(result).to.be.instanceof(NotFoundError);
			}

			let add;
			try {
				add = await facade.addDataset("jafar", content, InsightDatasetKind.Sections);
				result = await facade.removeDataset("ahbar");
				expect.fail("it should reject when id does not match");
			} catch (err) {
				result = err;
			} finally {
				expect(result).to.be.instanceof(NotFoundError);
			}
		});

		it("should fail if the id is invalid", async function () {
			const facade = new InsightFacade();

			let result;
			let add;
			try {
				add = await facade.addDataset("jafar", content, InsightDatasetKind.Sections);
				result = await facade.removeDataset("jaf_ar");
				expect.fail("it should reject when id has underscore");
			} catch (err) {
				result = err;
			} finally {
				expect(result).to.be.instanceof(InsightError);
			}

			try {
				result = await facade.removeDataset("");
				expect.fail("it should reject when id is empty");
			} catch (err) {
				result = err;
			} finally {
				expect(result).to.be.instanceof(InsightError);
			}
		});

		it("should succeed if id already exists", async function () {
			const facade = new InsightFacade();

			let result;
			let rmresult;
			try {
				result = await facade.addDataset("jafar", content, InsightDatasetKind.Sections);
				console.log(result);
				result = await facade.addDataset("gheisar", content, InsightDatasetKind.Sections);
				console.log(result);
				result = await facade.removeDataset("jafar");
				rmresult = result;
				result = await facade.listDatasets();
			} catch (err) {
				expect.fail("it should not reject");
			} finally {
				expect(rmresult).to.equal("jafar");
				expect(result).to.have.lengthOf(1);
			}
		});


		afterEach("clearDisk", async function () {
			await clearDisk();
		});
	});

	describe("performQuery",    function () {
		let facade = new InsightFacade();
		before(async function () {
			try {
				let content = await getContentFromArchives("too_large.zip");
				let section = await getContentFromArchives("section.zip");
				let addedTooLarge = await facade.addDataset("toolarge", content, InsightDatasetKind.Sections);
				let addedSection = await facade.addDataset("section", section, InsightDatasetKind.Sections);
				facade = new InsightFacade();
			} catch (err) {
				expect.fail(`not supposed to fail when reading the data ${err}`);
			}
		});

		describe("invalid tests", function () {

			let invalidQueries: ITestQuery[];

			try {
				invalidQueries = readFileQueries("invalid");
			} catch (e: unknown) {
				expect.fail(`Failed to read one or more test queries. ${e}`);
			}

			invalidQueries.forEach((test: any) => {
				it(`${test.title}`, async function () {
					let result;
					try {
						result = await facade.performQuery(test.input);
						expect.fail("These tests should fail");
					} catch (err) {
						result = err;
					} finally {
						if (test.expected === "InsightError") {
							expect(result).to.be.instanceof(InsightError);
						} else if (test.expected === "ResultTooLargeError") {
							expect(result).to.be.instanceof(ResultTooLargeError);
						} else {
							expect.fail("no other error should be thrown with these tests");
						}
					}
				});
			});

		});
		describe("valid tests", function () {
			let validQueries: ITestQuery[];

			try {
				validQueries = readFileQueries("valid");
			} catch (e: unknown) {
				expect.fail(`Failed to read one or more test queries. ${e}`);
			}
			validQueries.forEach((test: any) => {
				it(`${test.title}`, async function () {
					let result: any;
					let order = ("ORDER" in test.input.OPTIONS);
					try {
						result = await facade.performQuery(test.input);
						if (order) {
							expect(result).to.have.deep.members(test.expected);
						} else {
							expect(JSON.stringify(result)).to.equal(JSON.stringify(test.expected));
						}
					} catch (err) {
						expect.fail(`Failed ${(err as Error).stack}`);
					}
				});
			});
		});
		after("clearDisk", async function () {
			await clearDisk();
		});
	});
});

	/*
	 * This test suite dynamically generates tests from the JSON files in test/resources/queries.
	 * You can and should still make tests the normal way, this is just a convenient tool for a majority of queries.
	//  */
	// describe("PerformQuery", function () {
	// 	before(async function () {
	// 		facade = new InsightFacade();
	//
	// 		// Add the datasets to InsightFacade once.
	// 		// Will *fail* if there is a problem reading ANY dataset.
	// 		const loadDatasetPromises = [
	// 			facade.addDataset("sections", sections, InsightDatasetKind.Sections),
	// 		];
	//
	// 		try {
	// 			await Promise.all(loadDatasetPromises);
	// 		} catch(err) {
	// 			throw new Error(`In PerformQuery Before hook, dataset(s) failed to be added. \n${err}`);
	// 		}
	// 	});
	//
	// 	after(async function () {
	// 		await clearDisk();
	// 	});
	//
	// 	describe("valid queries", function() {
	// 		let validQueries: ITestQuery[];
	// 		try {
	// 			validQueries = readFileQueries("valid");
	// 		} catch (e: unknown) {
	// 			expect.fail(`Failed to read one or more test queries. ${e}`);
	// 		}
	//
	// 		validQueries.forEach(function(test: any) {
	// 			it(`${test.title}`, function () {
	// 				return facade.performQuery(test.input).then((result) => {
	// 					assert.fail("Write your assertions here!");
	// 				}).catch((err: any) => {
	// 					assert.fail(`performQuery threw unexpected error: ${err}`);
	// 				});
	// 			});
	// 		});
	// 	});
	//
	// 	describe("invalid queries", function() {
	// 		let invalidQueries: ITestQuery[];
	//
	// 		try {
	// 			invalidQueries = readFileQueries("invalid");
	// 		} catch (e: unknown) {
	// 			expect.fail(`Failed to read one or more test queries. ${e}`);
	// 		}
	//
	// 		invalidQueries.forEach(function(test: any) {
	// 			it(`${test.title}`, function () {
	// 				return facade.performQuery(test.input).then((result) => {
	// 					assert.fail(`performQuery resolved when it should have rejected with ${test.expected}`);
	// 				}).catch((err: any) => {
	// 					if (test.expected === "InsightError") {
	// 						expect(err).to.be.instanceOf(InsightError);
	// 					} else {
	// 						assert.fail("Query threw unexpected error");
	// 					}
	// 				});
	// 			});
	// 		});
	// 	});
	// });
