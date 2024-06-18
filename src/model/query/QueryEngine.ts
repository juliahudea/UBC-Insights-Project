import {QueryValidator} from "./QueryValidator";
import Section from "../Section";
import Room from "../Room";
import {QueryFilterGenerator} from "./QueryFilterGenerator";
import {QuerySortGenerator} from "./QuerySortGenerator";
import {QueryApplyGenerator} from "./QueryApplyGenerator";
import {InsightError, InsightResult, ResultTooLargeError} from "../../controller/IInsightFacade";
import {Group} from "../Constants";

export class QueryEngine {
	public query;
	public data: Section[] | Room[];
	public filteredData: Array<Section | Room>;
	public finalResult: InsightResult[];
	public queryValidator: QueryValidator;
	public queryFilterGenerator: QueryFilterGenerator;
	public querySortGenerator: QuerySortGenerator;
	public queryApplyGenerator: QueryApplyGenerator;

	constructor(query: any, queryValidator: QueryValidator, data: Section[] | Room[]) {
		this.query = query;
		this.data = data;
		this.queryValidator = queryValidator;
		this.queryFilterGenerator = new QueryFilterGenerator(query, queryValidator);
		this.queryApplyGenerator = new QueryApplyGenerator(queryValidator);
		this.querySortGenerator = new QuerySortGenerator(queryValidator);
		this.filteredData = this.applyFilter();
		this.finalResult = this.handleColumns();
		this.handleSort();
	}

	private applyFilter() {
		let queryFilter = this.queryFilterGenerator.queryFilter;
		let filteredData = [];
		let counter = 0;
		for (let entry of this.data) {
			if (queryFilter(entry)) {
				if (counter >= 5000 && !this.queryValidator.transformation) {
					throw new ResultTooLargeError("Result Too large");
				}
				filteredData.push(entry);
				counter++;
			}
		}
		return filteredData;
	}

	private handleColumns() {
		let transformation = this.queryValidator.transformation;
		if (transformation) {
			return this.handleColumnsWithTrans();
		}
		return this.handleColumnsDef();
	}

	private handleColumnsWithTrans(): InsightResult[] {
		let groupKeys = this.queryValidator.queryGroups;
		let groups = this.produceGroups(groupKeys);
		this.applyTransforms(groups);
		return this.extractColumns(groups);
	}

	private handleColumnsDef(): InsightResult[] {
		let columns = this.queryValidator.queryColumns;
		let datasetId = this.queryValidator.queryDataset;
		let unsortedResult: InsightResult[] = [];
		for (let entry of this.filteredData) {
			let currResult: InsightResult = {};
			for (let column of columns) {
				currResult[`${datasetId}_${column}`] = (entry as any)[column];
			}
			unsortedResult.push(currResult);
		}
		return unsortedResult;
	}

	private handleSort() {
		let orderComp = this.querySortGenerator.querySortComp;
		this.finalResult.sort(orderComp);
	}

	private produceGroups(groupKeys: string[]): Group[] {
		let counter = 0;
		let id = this.queryValidator.queryDataset;
		let groupValues = groupKeys.map((key): any => {
			return [];
		});
		let groups: any = {};
		for (let entry of this.filteredData) {
			groupKeys.forEach((key, index) => {
				let value = (entry as any)[key];
				if (!groupValues[index].includes(value)) {
					groupValues[index].push(value);
				}
			});
		}
		for (let entry of this.filteredData) {
			let groupStr = "";
			let currResult: InsightResult = {};
			groupKeys.forEach((key, index) => {
				let value = (entry as any)[key];
				let valIndex = groupValues[index].indexOf(value);
				groupStr = groupStr.concat(valIndex.toString()).concat("_");
				currResult[`${id}_${key}`] = value;
			});
			if (groups[groupStr] === undefined) {
				if (counter >= 5000) {
					throw new ResultTooLargeError("Result Too Large");
				}
				groups[groupStr] = {result: currResult, entries: []};
				groups[groupStr]["entries"].push(entry);
				counter++;
			} else {
				groups[groupStr]["entries"].push(entry);
			}
		}
		return Object.values(groups);
	}

	private applyTransforms(groups: Group[]) {
		let transforms = this.queryApplyGenerator.queryApplyFnList;
		for (let transform of transforms) {
			for (let group of groups) {
				let transformFn: (list: Array<Room | Section>) => number  = Object.values(transform)[0] as any;
				let transformKey = Object.keys(transform)[0];
				let groupEntries = group["entries"];
				let result: number = transformFn(groupEntries);
				group["result"][transformKey] = result;
			}
		}
	}

	private extractColumns(groups: Group[]) {
		let columns = this.query["OPTIONS"]["COLUMNS"];
		let results = [];
		for (let group of groups) {
			let groupResult = group["result"];
			let result: any = {};
			for (let column of columns) {
				result[column] = groupResult[column];
			}
			results.push(result);
		}
		return results;
	}
}
