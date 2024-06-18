import {InsightDataset, InsightError} from "./IInsightFacade";
import Section from "../model/Section";
import * as fs from "fs-extra";
import * as path from "path";
import JSZip from "jszip";
import Room from "../model/Room";

async function loadMetaData(): Promise<{[id: string]: InsightDataset}> {
	// console.log("Loading datasets");
	try {
		if (!await fs.pathExists(path.join(__dirname, "../../data/data.json"))) {
			return Promise.reject(new InsightError("No datasets to load"));
		}
	} catch (e) {
		return Promise.reject(e);
	}

	let loadedDatasets: any = await fs.readFile(path.join(__dirname, "../../data/data.json"), "utf8").catch((err) => {
		return Promise.reject(new InsightError("Failed to read dataset from file"));
	});
	// console.log(JSON.parse(loadedDatasets));
	return Promise.resolve(JSON.parse(loadedDatasets));
}

async function unzipFile(content: string): Promise<JSZip> {
	const jszip = new JSZip();
	let unzippedFile = await jszip.loadAsync(content, {base64: true}).catch((error) => {
		return Promise.reject(new InsightError("Not a zip file"));
	});

	return Promise.resolve(unzippedFile);
}

function checkDirName(file: JSZip): boolean {
	let counter = 0;
	file.forEach((filePath, filter): void => {
		if(filePath.split("/",1)[0] === "courses" || filePath.split("/",1)[0] === "campus"){
			counter++;
		}
	});
	return (counter > 0);
}

async function writeMetadata(datasets: {[id: string]: InsightDataset}): Promise<void> {
	let result;
	let dataResult = [];
	try {
		const storageDir = path.join(__dirname, "../../data");
		const storagePath = path.join(__dirname, "../../data/data.json");
		const dataToWrite = JSON.stringify(datasets);
		try {
			result = await fs.pathExists(storageDir);
			if (!result) {
				result = await fs.mkdir(storageDir);
			}
		} catch (e) {
			return Promise.reject(e);
		}
		result = await fs.writeFile(storagePath, dataToWrite, "utf8");
	} catch (error) {
		return Promise.reject(new InsightError("Failed to write dataset to file"));
	}
}

async function addData(id: string, data: Section[] | Room[]): Promise<boolean> {
	const storageDir = path.join(__dirname, "../../data/data");
	const storagePath = path.join(__dirname, `../../data/data/${stringToHashString(id)}.json`);
	try {
		if (!await fs.pathExists(storageDir)) {
			await fs.mkdir(storageDir);
		}
	} catch (e) {
		return Promise.reject(e);
	}
	await fs.outputJSON(storagePath, {data: data});
	return Promise.resolve(true);
}

async function getData(id: string): Promise<Section[]> {
	const storageDir = path.join(__dirname, "../../data/data");
	const storedPath = path.join(__dirname, `../../data/data/${stringToHashString(id)}.json`);
	try {
		if (!await fs.pathExists(storageDir)) {
			await fs.mkdir(storageDir);
		}
	} catch (e) {
		return Promise.reject(e);
	}
	let data: Section[] = [];
	try {
		data = await fs.readJson(storedPath);
	} catch (e) {
		return Promise.reject(e);
	}
	return Promise.resolve((data as any)["data"]);
}

async function removeData(id: string): Promise<boolean> {
	const storageDir = path.join(__dirname, "../../data/data");
	const storedPath = path.join(__dirname, `../../data/data/${stringToHashString(id)}.json`);
	try {
		if (!await fs.pathExists(storageDir)) {
			await fs.mkdir(storageDir);
		}
	} catch (e) {
		return Promise.reject(e);
	}
	await fs.remove(storedPath);
	return Promise.resolve(true);
}

function stringToHashString(name: string): string {
	let hash = "";
	if (!name.length) {
		return hash;
	}
	for (const char of name) {
		hash = hash.concat(char.charCodeAt(0).toString(16)).concat("_");
	}
	return hash;
}

export {
	loadMetaData,
	unzipFile,
	writeMetadata,
	addData,
	getData,
	removeData,
	checkDirName,
	stringToHashString
};
