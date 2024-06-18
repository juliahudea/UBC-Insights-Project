"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseSections = exports.addSectionDataset = void 0;
const IInsightFacade_1 = require("./IInsightFacade");
const Section_1 = require("../model/Section");
const LoadHelperFunctions_1 = require("./LoadHelperFunctions");
async function addSectionDataset(content) {
    const file = await (0, LoadHelperFunctions_1.unzipFile)(content);
    let sectionContent = [];
    try {
        sectionContent = await parseSections(file);
    }
    catch (e) {
        return Promise.reject(new IInsightFacade_1.InsightError(`Invalid content: ${e}`));
    }
    return Promise.resolve(sectionContent);
}
exports.addSectionDataset = addSectionDataset;
async function parseSections(jszip) {
    let sections = [];
    if (!(0, LoadHelperFunctions_1.checkDirName)(jszip)) {
        return Promise.reject(new IInsightFacade_1.InsightError("Incorrect Directory structure"));
    }
    const courses = jszip.file(/courses/);
    if (courses.length === 0) {
        return Promise.reject(new IInsightFacade_1.InsightError("No course folder"));
    }
    let validJson = false;
    const promises = courses.map(async (course) => {
        const fileContent = await course.async("string");
        try {
            const jsonData = await JSON.parse(fileContent);
            validJson = true;
            return await (0, Section_1.getValidSections)(jsonData);
        }
        catch (e) {
            return [];
        }
    });
    sections.push(...(await Promise.all(promises)).flat());
    if (!validJson) {
        return Promise.reject(new IInsightFacade_1.InsightError("No valid JSON files found"));
    }
    if (sections.length === 0) {
        return Promise.reject(new IInsightFacade_1.InsightError("No valid sections found"));
    }
    return Promise.resolve(sections);
}
exports.parseSections = parseSections;
//# sourceMappingURL=SectionHelperFunctions.js.map