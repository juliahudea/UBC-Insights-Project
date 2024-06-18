"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getValidSections = void 0;
const IInsightFacade_1 = require("../controller/IInsightFacade");
class Section {
    uuid;
    id;
    title;
    instructor;
    dept;
    year;
    avg;
    pass;
    fail;
    audit;
    constructor(id, Course, Subject, Professor, Department, Year, Avg, Pass, Fail, Audit) {
        this.uuid = id;
        this.id = Course;
        this.title = Subject;
        this.instructor = Professor;
        this.dept = Department;
        this.year = Year;
        this.avg = Avg;
        this.pass = Pass;
        this.fail = Fail;
        this.audit = Audit;
    }
}
exports.default = Section;
async function getValidSections(jsonData) {
    const sections = [];
    for (const item of jsonData.result) {
        if (item.id === undefined ||
            item.Course === undefined ||
            item.Title === undefined ||
            item.Subject === undefined ||
            item.Professor === undefined ||
            item.Year === undefined ||
            item.Avg === undefined ||
            item.Pass === undefined ||
            item.Fail === undefined ||
            item.Audit === undefined) {
            continue;
        }
        else {
            let [year, uuid] = correctFields(item);
            let section = new Section(uuid, item.Course, item.Title, item.Professor, item.Subject, year, item.Avg, item.Pass, item.Fail, item.Audit);
            sections.push(section);
        }
    }
    if (sections.length === 0) {
        return Promise.reject(new IInsightFacade_1.InsightError("No valid sections"));
    }
    return Promise.resolve(sections);
}
exports.getValidSections = getValidSections;
function correctFields(item) {
    let year = item.Year;
    let uuid = item.id;
    if (typeof item.Year === "string") {
        year = parseInt(item.Year, 10);
    }
    if (typeof item.id === "number") {
        uuid = item.id.toString();
    }
    if (item.Section === "overall") {
        year = 1900;
    }
    return [year, uuid];
}
//# sourceMappingURL=Section.js.map