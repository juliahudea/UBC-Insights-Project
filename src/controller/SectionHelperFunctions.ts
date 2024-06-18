import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError, InsightResult} from "./IInsightFacade";
import Section, {getValidSections} from "../model/Section";
import * as fs from "fs-extra";
import * as path from "path";
import JSZip from "jszip";
import Room from "../model/Room";
import {parse} from "parse5";
import {unzipFile, checkDirName, stringToHashString,} from "./LoadHelperFunctions";

async function addSectionDataset(content: string): Promise<Section[]> {
	const file = await unzipFile(content);
	let sectionContent: Section[] = [];

	try {
		sectionContent = await parseSections(file);
	} catch (e) {
		return Promise.reject(new InsightError(`Invalid content: ${e}`));
	}

	return Promise.resolve(sectionContent);
}

async function parseSections(jszip: JSZip): Promise<Section[]> {
	let sections: Section[] = [];

	if (!checkDirName(jszip)) {
		return Promise.reject(new InsightError("Incorrect Directory structure"));
	}

	const courses = jszip.file(/courses/);
	// console.log(courses);

	// check that the folder exists
	if (courses.length === 0) {
		return Promise.reject(new InsightError("No course folder"));
	}
	let validJson = false;

	const promises = courses.map(async (course) => {
		const fileContent = await course.async("string");
		try {
			// parse file content, if its not a valid json, catch error and continue to next file
			const jsonData = await JSON.parse(fileContent);

			// indicate that a valid json was found
			validJson = true;

			// get valid sections from the json data
			return await getValidSections(jsonData);
		} catch (e) {
			// Return an empty array if there was an error parsing the file
			return [];
		}
	});

	sections.push(...(await Promise.all(promises)).flat());

	if (!validJson) {
		return Promise.reject(new InsightError("No valid JSON files found"));
	}

	if (sections.length === 0) {
		return Promise.reject(new InsightError("No valid sections found"));
	}

	return Promise.resolve(sections);
}


export{addSectionDataset, parseSections};
