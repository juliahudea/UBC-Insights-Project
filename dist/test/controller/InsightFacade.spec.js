"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const IInsightFacade_1 = require("../../src/controller/IInsightFacade");
const InsightFacade_1 = __importDefault(require("../../src/controller/InsightFacade"));
const chai_1 = require("chai");
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const TestUtil_1 = require("../TestUtil");
(0, chai_1.use)(chai_as_promised_1.default);
describe("InsightFacade", function () {
    describe("addDataset", function () {
        let content;
        before(async function () {
            try {
                content = await (0, TestUtil_1.getContentFromArchives)("test1.zip");
            }
            catch (e) {
                chai_1.expect.fail("not supposed to fail when fetching file from archive");
            }
        });
        it("should fail when given an empty id", async function () {
            const facade = new InsightFacade_1.default();
            let result;
            try {
                result = await facade.addDataset("", content, IInsightFacade_1.InsightDatasetKind.Sections);
                chai_1.expect.fail("supposed to fail");
            }
            catch (err) {
                result = err;
            }
            finally {
                (0, chai_1.expect)(result).to.be.instanceof(IInsightFacade_1.InsightError);
            }
        });
        it("should fail when given an id with an underscore", async function () {
            const facade = new InsightFacade_1.default();
            let result;
            try {
                result = await facade.addDataset("ahbar_ali", content, IInsightFacade_1.InsightDatasetKind.Sections);
                chai_1.expect.fail("supposed to reject");
            }
            catch (err) {
                result = err;
            }
            finally {
                (0, chai_1.expect)(result).to.be.instanceof(IInsightFacade_1.InsightError);
            }
        });
        it("should fail if id has already been added", async function () {
            const facade = new InsightFacade_1.default();
            let result;
            try {
                result = await facade.addDataset("hashem", content, IInsightFacade_1.InsightDatasetKind.Sections);
                result = await facade.addDataset("hashem", content, IInsightFacade_1.InsightDatasetKind.Sections);
                chai_1.expect.fail("supposed to reject");
            }
            catch (err) {
                result = err;
            }
            finally {
                (0, chai_1.expect)(result).to.be.instanceof(IInsightFacade_1.InsightError);
            }
        });
        it("should fail if the database is empty", async function () {
            const facade = new InsightFacade_1.default();
            let result;
            try {
                const contentEmpty = await (0, TestUtil_1.getContentFromArchives)("empty_database.zip");
                result = await facade.addDataset("hashem", contentEmpty, IInsightFacade_1.InsightDatasetKind.Sections);
                chai_1.expect.fail("supposed to reject");
            }
            catch (err) {
                result = err;
            }
            finally {
                (0, chai_1.expect)(result).to.be.instanceof(IInsightFacade_1.InsightError);
            }
        });
        it("should fail if the database only has an invalid section", async function () {
            const facade = new InsightFacade_1.default();
            let result;
            try {
                const contentInvalid = await (0, TestUtil_1.getContentFromArchives)("invalid_section.zip");
                result = await facade.addDataset("hashem", contentInvalid, IInsightFacade_1.InsightDatasetKind.Sections);
                chai_1.expect.fail("supposed to reject");
            }
            catch (err) {
                result = err;
            }
            finally {
                (0, chai_1.expect)(result).to.be.instanceof(IInsightFacade_1.InsightError);
            }
        });
        it("should fail, has an invalid course", async function () {
            const facade = new InsightFacade_1.default();
            let result;
            try {
                const contentInvalid = await (0, TestUtil_1.getContentFromArchives)("invalid_course.zip");
                result = await facade.addDataset("hashem", contentInvalid, IInsightFacade_1.InsightDatasetKind.Sections);
                chai_1.expect.fail("supposed to reject");
            }
            catch (err) {
                result = err;
            }
            finally {
                (0, chai_1.expect)(result).to.be.instanceof(IInsightFacade_1.InsightError);
            }
        });
        it("should fail, has bad structure", async function () {
            const facade = new InsightFacade_1.default();
            let result;
            try {
                const contentBad = await (0, TestUtil_1.getContentFromArchives)("bad_structure.zip");
                result = await facade.addDataset("hashem", contentBad, IInsightFacade_1.InsightDatasetKind.Sections);
                chai_1.expect.fail("supposed to reject");
            }
            catch (err) {
                result = err;
            }
            finally {
                (0, chai_1.expect)(result).to.be.instanceof(IInsightFacade_1.InsightError);
            }
        });
        it("should fail if the content is not correct", async function () {
            const facade = new InsightFacade_1.default();
            let result;
            try {
                result = await facade.addDataset("hashem", "ahmadali", IInsightFacade_1.InsightDatasetKind.Sections);
                chai_1.expect.fail("supposed to reject");
            }
            catch (err) {
                result = err;
            }
            finally {
                (0, chai_1.expect)(result).to.be.instanceof(IInsightFacade_1.InsightError);
            }
        });
        it("should succeed with an array of ids if the params are good", async function () {
            const facade = new InsightFacade_1.default();
            let result;
            let result2;
            try {
                result = await facade.addDataset("hashem", content, IInsightFacade_1.InsightDatasetKind.Sections);
                result2 = await facade.addDataset("heshmat", content, IInsightFacade_1.InsightDatasetKind.Sections);
            }
            catch (err) {
                chai_1.expect.fail("should not reject or throw exceptions");
                result = err;
            }
            finally {
                (0, chai_1.expect)(result).to.have.lengthOf(1);
                (0, chai_1.expect)(result2).to.have.lengthOf(2);
                (0, chai_1.expect)(result).to.include("hashem");
                (0, chai_1.expect)(result2).to.have.members(["hashem", "heshmat"]);
            }
        });
        it("should retain information once a new instance is created", async function () {
            const facade = new InsightFacade_1.default();
            let facade2;
            let result;
            let result2;
            let result3;
            try {
                result = await facade.addDataset("hashem", content, IInsightFacade_1.InsightDatasetKind.Sections);
                result2 = await facade.addDataset("heshmat", content, IInsightFacade_1.InsightDatasetKind.Sections);
                facade2 = new InsightFacade_1.default();
                result3 = await facade2.listDatasets();
            }
            catch (err) {
                chai_1.expect.fail("should not reject or throw exceptions");
                result = err;
            }
            finally {
                (0, chai_1.expect)(result3).to.have.lengthOf(2);
            }
        });
        it("should succeed with Sections kind", async function () {
            const facade = new InsightFacade_1.default();
            let result;
            try {
                result = await facade.addDataset("hashem", content, IInsightFacade_1.InsightDatasetKind.Sections);
            }
            catch (err) {
                chai_1.expect.fail("should not reject or throw exceptions");
                result = err;
            }
            finally {
                (0, chai_1.expect)(result).to.have.lengthOf(1);
                (0, chai_1.expect)(result).to.include("hashem");
            }
        });
        it("should fail with Rooms kind", async function () {
            const facade = new InsightFacade_1.default();
            let result;
            try {
                result = await facade.addDataset("hashem", content, IInsightFacade_1.InsightDatasetKind.Rooms);
                chai_1.expect.fail("supposed to reject");
            }
            catch (err) {
                result = err;
            }
            finally {
                (0, chai_1.expect)(result).to.be.instanceof(IInsightFacade_1.InsightError);
            }
        });
        afterEach("clearDisk", async function () {
            await (0, TestUtil_1.clearDisk)();
        });
    });
    describe("addDataset, section content test", function () {
        let sections;
        let facade;
        beforeEach(async function () {
            facade = new InsightFacade_1.default();
        });
        afterEach(async function () {
            await (0, TestUtil_1.clearDisk)();
        });
        it("should reject dataset with no content", async function () {
            const result = facade.addDataset("courses", "", IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject section with missing avg field", async function () {
            sections = await (0, TestUtil_1.getContentFromArchives)("missingavgfield.zip");
            const result = facade.addDataset("courses", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject section with missing audit field", async function () {
            sections = await (0, TestUtil_1.getContentFromArchives)("missingauditfield.zip");
            const result = facade.addDataset("courses", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject section with missing dept field", async function () {
            sections = await (0, TestUtil_1.getContentFromArchives)("missingdeptfield.zip");
            const result = facade.addDataset("courses", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject section with missing fail field", async function () {
            sections = await (0, TestUtil_1.getContentFromArchives)("missingfailfield.zip");
            const result = facade.addDataset("courses", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject section with missing id field", async function () {
            sections = await (0, TestUtil_1.getContentFromArchives)("missingidfield.zip");
            const result = facade.addDataset("courses", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject section with missing instructor field", async function () {
            sections = await (0, TestUtil_1.getContentFromArchives)("missinginstructorfield.zip");
            const result = facade.addDataset("courses", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject section with missing pass field", async function () {
            sections = await (0, TestUtil_1.getContentFromArchives)("missingpassfield.zip");
            const result = facade.addDataset("courses", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject section with missing title field", async function () {
            sections = await (0, TestUtil_1.getContentFromArchives)("missingtitlefield.zip");
            const result = facade.addDataset("courses", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject section with missing uuid field", async function () {
            sections = await (0, TestUtil_1.getContentFromArchives)("missinguuidfield.zip");
            const result = facade.addDataset("courses", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject section with missing year field", async function () {
            sections = await (0, TestUtil_1.getContentFromArchives)("missingyearfield.zip");
            const result = facade.addDataset("courses", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject dataset with missing courses folder", async function () {
            sections = await (0, TestUtil_1.getContentFromArchives)("missingcoursesfolder.zip");
            const result = facade.addDataset("courses", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject dataset with missing results field", async function () {
            sections = await (0, TestUtil_1.getContentFromArchives)("missingresultsfield.zip");
            const result = facade.addDataset("courses", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject dataset with zero sections", async function () {
            sections = await (0, TestUtil_1.getContentFromArchives)("zerosections.zip");
            const result = facade.addDataset("courses", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should successfully add single section", async function () {
            sections = await (0, TestUtil_1.getContentFromArchives)("singlesection.zip");
            const result = facade.addDataset("courses", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.have.members(["courses"]);
        });
        it("should reject dataset with invalid JSON", async function () {
            sections = await (0, TestUtil_1.getContentFromArchives)("invalidjson.zip");
            const result = facade.addDataset("courses", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should successfully add dataset with some invalid sections", async function () {
            sections = await (0, TestUtil_1.getContentFromArchives)("someinvalidsections.zip");
            const result = facade.addDataset("courses", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.have.members(["courses"]);
        });
    });
    describe("addDataset, room content test", function () {
        let rooms;
        let facade;
        beforeEach(async function () {
            facade = new InsightFacade_1.default();
        });
        afterEach(async function () {
            await (0, TestUtil_1.clearDisk)();
        });
        it("should reject dataset with no content", async function () {
            const result = facade.addDataset("courses", "", IInsightFacade_1.InsightDatasetKind.Rooms);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should fail when adding dataset with only sections", async function () {
            let sections = await (0, TestUtil_1.getContentFromArchives)("singlesection.zip");
            const result = facade.addDataset("rooms", sections, IInsightFacade_1.InsightDatasetKind.Rooms);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should fail when there is no index file", async function () {
            rooms = await (0, TestUtil_1.getContentFromArchives)("noindex.zip");
            const result = facade.addDataset("rooms", rooms, IInsightFacade_1.InsightDatasetKind.Rooms);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should fail when index has no valid table", async function () {
            rooms = await (0, TestUtil_1.getContentFromArchives)("indexwithnotable.zip");
            const result = facade.addDataset("rooms", rooms, IInsightFacade_1.InsightDatasetKind.Rooms);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should fail when there is only an index file", async function () {
            rooms = await (0, TestUtil_1.getContentFromArchives)("onlyindex.zip");
            const result = facade.addDataset("rooms", rooms, IInsightFacade_1.InsightDatasetKind.Rooms);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should fail when the table has no links", async function () {
            rooms = await (0, TestUtil_1.getContentFromArchives)("tablewithnolinks.zip");
            const result = facade.addDataset("rooms", rooms, IInsightFacade_1.InsightDatasetKind.Rooms);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should fail when there are no rooms (even though there are tables)", async function () {
            rooms = await (0, TestUtil_1.getContentFromArchives)("norooms.zip");
            const result = facade.addDataset("rooms", rooms, IInsightFacade_1.InsightDatasetKind.Rooms);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should fail when all rooms are invalid", async function () {
            rooms = await (0, TestUtil_1.getContentFromArchives)("invalidrooms.zip");
            const result = facade.addDataset("rooms", rooms, IInsightFacade_1.InsightDatasetKind.Rooms);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should fail when the geolocation fails but everything else is valid", async function () {
            rooms = await (0, TestUtil_1.getContentFromArchives)("invalidgeolocation.zip");
            const result = facade.addDataset("rooms", rooms, IInsightFacade_1.InsightDatasetKind.Rooms);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should add a valid rooms dataset with only one building", async function () {
            rooms = await (0, TestUtil_1.getContentFromArchives)("singlebuilding.zip");
            const result = facade.addDataset("rooms", rooms, IInsightFacade_1.InsightDatasetKind.Rooms);
            return (0, chai_1.expect)(result).to.eventually.have.members(["rooms"]);
        });
        it("should add a valid rooms dataset with two buildings", async function () {
            rooms = await (0, TestUtil_1.getContentFromArchives)("twobuildings.zip");
            const result = facade.addDataset("rooms", rooms, IInsightFacade_1.InsightDatasetKind.Rooms);
            return (0, chai_1.expect)(result).to.eventually.have.members(["rooms"]);
        });
        it("should add a valid rooms dataset with three buildings", async function () {
            rooms = await (0, TestUtil_1.getContentFromArchives)("threebuildings.zip");
            const result = facade.addDataset("rooms", rooms, IInsightFacade_1.InsightDatasetKind.Rooms);
            return (0, chai_1.expect)(result).to.eventually.have.members(["rooms"]);
        });
    });
    describe("listDatasets", function () {
        let content;
        before(async function () {
            try {
                content = await (0, TestUtil_1.getContentFromArchives)("test1.zip");
            }
            catch (e) {
                chai_1.expect.fail("not supposed to fail when fetching file from archive");
            }
        });
        it("should return an empty list when there are no datasets", async function () {
            const facade = new InsightFacade_1.default();
            let result;
            try {
                result = await facade.listDatasets();
                console.log(result);
            }
            catch (err) {
                chai_1.expect.fail("should not reject");
            }
            finally {
                (0, chai_1.expect)(result).to.be.empty;
            }
        });
        it("should return a list of correct datasets", async function () {
            const facade = new InsightFacade_1.default();
            let result;
            try {
                let add = await facade.addDataset("karim", content, IInsightFacade_1.InsightDatasetKind.Sections);
                result = await facade.listDatasets();
            }
            catch (err) {
                chai_1.expect.fail("should not reject");
            }
            finally {
                (0, chai_1.expect)(result).to.have.lengthOf(1);
                (0, chai_1.expect)(result?.at(0)?.id).to.equal("karim");
            }
        });
        afterEach("clearDisk", async function () {
            await (0, TestUtil_1.clearDisk)();
        });
    });
    describe("removeDataset", function () {
        let content;
        before(async function () {
            try {
                content = await (0, TestUtil_1.getContentFromArchives)("test1.zip");
            }
            catch (e) {
                chai_1.expect.fail("not supposed to fail when fetching file from archive");
            }
        });
        it("should fail if there are no datasets or it does not match", async function () {
            const facade = new InsightFacade_1.default();
            let result;
            try {
                result = await facade.removeDataset("ahbar");
                chai_1.expect.fail("it should reject when there are no datasets");
            }
            catch (err) {
                result = err;
            }
            finally {
                (0, chai_1.expect)(result).to.be.instanceof(IInsightFacade_1.NotFoundError);
            }
            let add;
            try {
                add = await facade.addDataset("jafar", content, IInsightFacade_1.InsightDatasetKind.Sections);
                result = await facade.removeDataset("ahbar");
                chai_1.expect.fail("it should reject when id does not match");
            }
            catch (err) {
                result = err;
            }
            finally {
                (0, chai_1.expect)(result).to.be.instanceof(IInsightFacade_1.NotFoundError);
            }
        });
        it("should fail if the id is invalid", async function () {
            const facade = new InsightFacade_1.default();
            let result;
            let add;
            try {
                add = await facade.addDataset("jafar", content, IInsightFacade_1.InsightDatasetKind.Sections);
                result = await facade.removeDataset("jaf_ar");
                chai_1.expect.fail("it should reject when id has underscore");
            }
            catch (err) {
                result = err;
            }
            finally {
                (0, chai_1.expect)(result).to.be.instanceof(IInsightFacade_1.InsightError);
            }
            try {
                result = await facade.removeDataset("");
                chai_1.expect.fail("it should reject when id is empty");
            }
            catch (err) {
                result = err;
            }
            finally {
                (0, chai_1.expect)(result).to.be.instanceof(IInsightFacade_1.InsightError);
            }
        });
        it("should succeed if id already exists", async function () {
            const facade = new InsightFacade_1.default();
            let result;
            let rmresult;
            try {
                result = await facade.addDataset("jafar", content, IInsightFacade_1.InsightDatasetKind.Sections);
                console.log(result);
                result = await facade.addDataset("gheisar", content, IInsightFacade_1.InsightDatasetKind.Sections);
                console.log(result);
                result = await facade.removeDataset("jafar");
                rmresult = result;
                result = await facade.listDatasets();
            }
            catch (err) {
                chai_1.expect.fail("it should not reject");
            }
            finally {
                (0, chai_1.expect)(rmresult).to.equal("jafar");
                (0, chai_1.expect)(result).to.have.lengthOf(1);
            }
        });
        afterEach("clearDisk", async function () {
            await (0, TestUtil_1.clearDisk)();
        });
    });
    describe("performQuery", function () {
        let facade = new InsightFacade_1.default();
        before(async function () {
            try {
                let content = await (0, TestUtil_1.getContentFromArchives)("too_large.zip");
                let section = await (0, TestUtil_1.getContentFromArchives)("section.zip");
                let addedTooLarge = await facade.addDataset("toolarge", content, IInsightFacade_1.InsightDatasetKind.Sections);
                let addedSection = await facade.addDataset("section", section, IInsightFacade_1.InsightDatasetKind.Sections);
                facade = new InsightFacade_1.default();
            }
            catch (err) {
                chai_1.expect.fail(`not supposed to fail when reading the data ${err}`);
            }
        });
        describe("invalid tests", function () {
            let invalidQueries;
            try {
                invalidQueries = (0, TestUtil_1.readFileQueries)("invalid");
            }
            catch (e) {
                chai_1.expect.fail(`Failed to read one or more test queries. ${e}`);
            }
            invalidQueries.forEach((test) => {
                it(`${test.title}`, async function () {
                    let result;
                    try {
                        result = await facade.performQuery(test.input);
                        chai_1.expect.fail("These tests should fail");
                    }
                    catch (err) {
                        result = err;
                    }
                    finally {
                        if (test.expected === "InsightError") {
                            (0, chai_1.expect)(result).to.be.instanceof(IInsightFacade_1.InsightError);
                        }
                        else if (test.expected === "ResultTooLargeError") {
                            (0, chai_1.expect)(result).to.be.instanceof(IInsightFacade_1.ResultTooLargeError);
                        }
                        else {
                            chai_1.expect.fail("no other error should be thrown with these tests");
                        }
                    }
                });
            });
        });
        describe("valid tests", function () {
            let validQueries;
            try {
                validQueries = (0, TestUtil_1.readFileQueries)("valid");
            }
            catch (e) {
                chai_1.expect.fail(`Failed to read one or more test queries. ${e}`);
            }
            validQueries.forEach((test) => {
                it(`${test.title}`, async function () {
                    let result;
                    let order = ("ORDER" in test.input.OPTIONS);
                    try {
                        result = await facade.performQuery(test.input);
                        if (order) {
                            (0, chai_1.expect)(result).to.have.deep.members(test.expected);
                        }
                        else {
                            (0, chai_1.expect)(JSON.stringify(result)).to.equal(JSON.stringify(test.expected));
                        }
                    }
                    catch (err) {
                        chai_1.expect.fail(`Failed ${err.stack}`);
                    }
                });
            });
        });
        after("clearDisk", async function () {
            await (0, TestUtil_1.clearDisk)();
        });
    });
});
//# sourceMappingURL=InsightFacade.spec.js.map