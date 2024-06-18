import {
	IInsightFacade, InsightDataset, InsightDatasetKind,
	InsightError, InsightResult, NotFoundError, ResultTooLargeError
} from "./IInsightFacade";
import Section from "../model/Section";
import {loadMetaData, writeMetadata,
	addData, getData, removeData} from "./LoadHelperFunctions";
import {addSectionDataset} from "./SectionHelperFunctions";
import {addRoomDataset} from "./RoomHelperFunctions";
import {QueryFilterGenerator} from "../model/query/QueryFilterGenerator";
import Room from "../model/Room";
import {QueryValidator} from "../model/query/QueryValidator";
import {QueryEngine} from "../model/query/QueryEngine";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	public metadata: {[id: string]: InsightDataset};
	public dbData: {[id: string]: Section[] | Room[]};

	constructor() {
		this.metadata = {};
		this.dbData = {};
		console.log("InsightFacadeImpl::init()");
	}

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {

		// if loaded datasets are empty, we load metadata from disk
		if (Object.keys(this.metadata).length === 0) {
			try {
				this.metadata = await loadMetaData();
			} catch (e) {
				this.metadata = {};
			}
		}

		// check if id is valid
		if (
			id === undefined ||
			id === null ||
			id === "" ||
			id.includes("_") ||
			id.trim().length === 0 ||
			Object.keys(this.metadata).includes(id)
		) {
			return Promise.reject(new InsightError("Invalid id"));
		}

		let datasetContent: Section[] | Room[];
		// check if kind is valid - sections or rooms allowed
		if (kind === InsightDatasetKind.Sections) {
			datasetContent = await addSectionDataset(content);
		} else if (kind === InsightDatasetKind.Rooms) {
			datasetContent = await addRoomDataset(content);
		} else {
			return Promise.reject(new InsightError("Invalid kind"));
		}

		let dataset: InsightDataset = {
			id: id,
			kind: kind,
			numRows: datasetContent.length,
		};

		this.metadata[id] = dataset;
		this.dbData[id] = datasetContent;
		const datasetIds: string[] = Object.keys(this.metadata);
		let result;
		try {
			result = await writeMetadata(this.metadata);
			result = await addData(id, datasetContent);
		} catch (e) {
			return Promise.reject(new InsightError("Could not write to disk"));
		}

		return Promise.resolve(datasetIds);
	}

	public async listDatasets(): Promise<InsightDataset[]> {
		let datasetList: InsightDataset[] = [];

		if(Object.keys(this.metadata).length === 0) {
			try {
				this.metadata = await loadMetaData();
			} catch (e) {
				return Promise.resolve([]);
			}
		}

		for (const dataset in this.metadata) {
			datasetList.push(this.metadata[dataset]);
		}
		return Promise.resolve(datasetList);
	}

	public async removeDataset(id: string): Promise<string> {
		if (id === undefined || id === null || id === "" || id.includes("_") || id.trim().length === 0) {
			return Promise.reject(new InsightError("Invalid id"));
		}

		if(Object.keys(this.metadata).length === 0) {
			try {
				this.metadata = await loadMetaData();
			} catch (e) {
				return Promise.reject(new NotFoundError("Could not load datasets"));
			}
		}

		if (!Object.keys(this.metadata).includes(id)) {
			return Promise.reject(new NotFoundError("Dataset not found"));
		}

		delete this.metadata[id];

		try {
			await removeData(id);
			await writeMetadata(this.metadata);
		} catch (e) {
			return Promise.reject(new InsightError("Could not write to disk"));
		}
		return Promise.resolve(id);
	}

	public async performQuery(query: unknown): Promise<InsightResult[]> {
		if(Object.keys(this.metadata).length === 0) {
			try {
				this.metadata = await loadMetaData();
			} catch (e) {
				return Promise.reject(new InsightError("No Datasets Present"));
			}
		}
		if (typeof query !== "object") {
			return Promise.reject(new InsightError("query not object"));
		}
		let validator: QueryValidator;
		try {
			validator = new QueryValidator(query as object, this.metadata);
		} catch (e) {
			return Promise.reject(new InsightError((e as Error).toString()));
		}
		let dataId = validator.queryDataset;
		if (this.dbData[dataId] === undefined) {
			let data = await getData(dataId);
			this.dbData[dataId] = data;
		}
		let data = this.dbData[dataId];
		let queryEngine: QueryEngine;
		try {
			queryEngine = new QueryEngine(query, validator, data);
		} catch (e) {
			if (e instanceof ResultTooLargeError) {
				return Promise.reject(e);
			} else {
				return Promise.reject(new InsightError((e as Error).message));
			}
		}
		return Promise.resolve(queryEngine.finalResult);
	}
/*
	public async performQuery(query: unknown): Promise<InsightResult[]> {
		if (typeof query !== "object") {
			return Promise.reject(new InsightError());
		}
		let queryObj: Query;
		try {
			queryObj = new Query(query as object, Object.keys(this.metadata));
		} catch (e) {
			return Promise.reject(new InsightError("Invalid query"));
		}

		let sectionId = queryObj.queryDataset;
		let sections: Section[];
		if (this.dbData[sectionId] === undefined) {
			sections = await getSectionData(sectionId);
			this.dbData[sectionId] = sections;
		} else {
			sections = this.dbData[sectionId];
		}
		let queryPred = queryObj.queryFilter;
		let queryColumns = queryObj.queryColumns;
		let queryOrder = queryObj.queryOrder;
		let filteredSections: Section[] = [];
		let counter = 0;
		try {
			this.performPred(queryPred, sections, counter, filteredSections);
		} catch (e) {
			return Promise.reject(new ResultTooLargeError(""));
		}
		let result: InsightResult[] = [];
		this.makeResult(filteredSections, queryColumns, sectionId, result);
		if (queryOrder === "") {
			return Promise.resolve(result);
		}
		return Promise.resolve(result.sort((curr: InsightResult, other: InsightResult) => {
			if (curr[`${sectionId}_${queryOrder}`] === other[`${sectionId}_${queryOrder}`]) {
				return 0;
			}
			if (curr[`${sectionId}_${queryOrder}`] > other[`${sectionId}_${queryOrder}`]) {
				return 1;
			}
			return -1;
		}));
	}

	private performPred(queryPred: (section: Section) => boolean,
		sections: Section[], counter: number, filteredSections: Section[]) {
		sections.forEach((section: Section) => {
			if (queryPred(section)) {
				if (counter > 5000) {
					throw new Error();
				}
				filteredSections.push(section);
				counter++;
			}
		});
	}

	private makeResult(filteredSections: Section[], queryColumns: string[],
		sectionId: string, result: InsightResult[]) {
		filteredSections.map((section: Section) => {
			let curr: {[key: string]: string | number} = {};
			queryColumns.forEach((column: string) => {
				if (mFields.includes(column)) {
					curr[`${sectionId}_${column}`]
						= (section as unknown as {[key: string]: string | number})[column];
				} else {
					curr[`${sectionId}_${column}`]
						= (section as unknown as {[key: string]: string | number})[column];
				}
			});
			result.push(curr);
		});
	}
*/
}

