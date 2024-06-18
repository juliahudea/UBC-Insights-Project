import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	NotFoundError,
	InsightResult,
} from "../controller/IInsightFacade";

export default class Section {
	public uuid: string;
	public id: string;
	public title: string;
	public instructor: string;
	public dept: string;
	public year: number;
	public avg: number;
	public pass: number;
	public fail: number;
	public audit: number;

	constructor(
		id: string,
		Course: string,
		Subject: string,
		Professor: string,
		Department: string,
		Year: number,
		Avg: number,
		Pass: number,
		Fail: number,
		Audit: number
	) {
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


// Get valid sections from the JSON data
async function getValidSections(jsonData: any): Promise<Section[]> {
	const sections: Section[] = [];
	for (const item of jsonData.result) {
		// Check if the section has all the required fields
		if (
			item.id === undefined ||
			item.Course === undefined ||
			item.Title === undefined ||
			item.Subject === undefined ||
			item.Professor === undefined ||
			item.Year === undefined ||
			item.Avg === undefined ||
			item.Pass === undefined ||
			item.Fail === undefined ||
			item.Audit === undefined
		) {
			continue; // skip this section
		} else {
			// section is valid, create a new section object
			let [year, uuid] = correctFields(item);
			let section = new Section(
				uuid,
				item.Course,
				item.Title,
				item.Professor,
				item.Subject,
				year,
				item.Avg,
				item.Pass,
				item.Fail,
				item.Audit
			);
			// add valid section to the list
			sections.push(section);
		}
	}

	if (sections.length === 0) {
		return Promise.reject(new InsightError("No valid sections"));
	}
	return Promise.resolve(sections);
}
function correctFields(item: any): [number, string]{
	let year: number = item.Year;
	let uuid: string = item.id;
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

export {getValidSections};
