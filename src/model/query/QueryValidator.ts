import {InsightDataset, InsightDatasetKind} from "../../controller/IInsightFacade";
import {applyTokens, filterKeys, FilterT, Obj, ObjA, roomMFields, roomSFields, sectionSFields,
	sectionMFields, numbericApplyTokens} from "../Constants";
import {QueryFilterValidator} from "./QueryFilterValidator";

export class QueryValidator {
	public datasets: {[id: string]: InsightDataset};
	public transformation: boolean = true;
	public allowedSFields: string[] = sectionSFields;
	public allowedMFields: string[] = sectionMFields;
	public queryKind: InsightDatasetKind = InsightDatasetKind.Sections;
	public queryDataset: string = "";
	public queryOrder: string | object = "";
	public queryGroups: string[] = [];
	public queryApplyKeys: string[] = [];
	public queryApplyRules: object[] = [];
	public queryColumns: string[] = [];

	constructor(query: object, datasets: {[id: string]: InsightDataset}) {
		this.datasets = datasets;
		this.parseTransformation(query);
		this.parseOptions(query);
		this.parseWhere(query);
	}

	private parseTransformation(query: object) {
		if (!("TRANSFORMATIONS" in query)) {
			this.transformation = false;
			return;
		}
		this.checkTransKey(query);
		let transformObj: ObjA = (query as ObjA)["TRANSFORMATIONS"];
		this.checkGroup(transformObj["GROUP"]);
		this.checkApply(transformObj["APPLY"]);
	}

	private checkTransKey(query: object) {
		let correctKeys = JSON.stringify(["APPLY", "GROUP"]);
		if (typeof (query as ObjA)["TRANSFORMATIONS"] !== "object" ||
			JSON.stringify(Object.keys((query as ObjA)["TRANSFORMATIONS"]).sort()) !== correctKeys) {
			throw new Error("Bad Transformations Object");
		}
	}

	private checkGroup(groupList: any) {
		if (!(Array.isArray(groupList)) || groupList.length === 0 ||
			typeof groupList[0] !== "string" || groupList[0] === "") {
			throw new Error("Empty Group List");
		}
		let queryId = groupList[0].split("_")[0];
		this.checkDatasetId(queryId);
		this.queryDataset = queryId;
		for (let key of groupList) {
			if (typeof key !== "string" || key.split("_").length !== 2) {
				throw new Error("Bad Group Item");
			}
			let keySplit = key.split("_");
			if (keySplit[0] !== this.queryDataset ||
				!(this.allowedMFields.includes(keySplit[1]) || this.allowedSFields.includes(keySplit[1]))){
				throw new Error("Bad Group List");
			}
			this.queryGroups.push(keySplit[1]);
		}
	}

	private checkApply(applyObj: any) {
		if (!Array.isArray(applyObj)) {
			throw new Error("Bad ApplyRuleList");
		}
		for (let applyRule of applyObj) {
			if (typeof applyRule !== "object" || Object.keys(applyRule).length !== 1  ||
				typeof Object.keys(applyRule)[0] !== "string" || Object.keys(applyRule)[0].includes("_") ||
				Object.keys(applyRule)[0] === ""){
				throw new Error("Bad ApplyRule Key");
			}
			let applyKey = Object.keys(applyRule)[0];
			if (this.queryApplyKeys.includes(applyKey)) {
				throw new Error("Duplicate ApplyKey");
			}
			let applyRuleValue = applyRule[applyKey];
			if (!this.checkApplyKeyValue(applyRuleValue)) {
				throw new Error("Bad ApplyRule Value");
			}
			this.queryApplyKeys.push(applyKey);
			this.queryApplyRules.push(applyRule);
		}
	}

	private checkApplyKeyValue(applyRuleValue: any): boolean {
		if (typeof applyRuleValue !== "object" ||
			Object.keys(applyRuleValue).length !== 1 ||
			typeof Object.keys(applyRuleValue)[0] !== "string" ||
			typeof Object.values(applyRuleValue)[0] !== "string") {
			return false;
		}
		let applyToken = Object.keys(applyRuleValue)[0];
		let key: any = Object.values(applyRuleValue)[0];
		let keySplit = key.split("_");
		return applyTokens.includes(applyToken) && keySplit.length === 2 && keySplit[0] === this.queryDataset &&
			(this.allowedMFields.includes(keySplit[1]) || this.allowedSFields.includes(keySplit[1])) &&
			(!numbericApplyTokens.includes(applyToken) || this.allowedMFields.includes(keySplit[1]));
	}

	private parseWhere(query: object): void{
		if (!(JSON.stringify(Object.keys(query).sort()) === JSON.stringify(["OPTIONS", "WHERE"]) ||
				JSON.stringify(Object.keys(query).sort()) ===
				JSON.stringify(["OPTIONS", "TRANSFORMATIONS", "WHERE"])) ||
			typeof (query as ObjA)["WHERE"] !== "object") {
			throw new Error("Bad Where Object");
		}
		let queryO = query as Obj;
		new QueryFilterValidator(this).validateFilters(queryO["WHERE"] as object);
	}

	private parseOptions(query: object): void {
		if (!this.checkOptionsKeys(query)) {
			throw new Error("Issue With Options");
		}
		let queryO = query as Obj;
		let optionValues = JSON.stringify(Object.keys(queryO["OPTIONS"]).sort());
		if (optionValues === JSON.stringify(["COLUMNS"])) {
			this.queryColumns = this.parseColumn((queryO["OPTIONS"] as ObjA)["COLUMNS"]);
		} else {
			this.queryColumns = this.parseColumn((queryO["OPTIONS"] as ObjA)["COLUMNS"]);
			this.queryOrder = this.parseOrder(((queryO["OPTIONS"] as ObjA)["ORDER"]));
		}
	}

	private parseColumn(columns: object) {
		if (!Array.isArray(columns) || columns.length === 0 || typeof columns[0] !== "string") {
			throw new Error("Bad Columns ");
		}
		let columnsArr = columns as string[];
		if (!this.transformation) {
			let queryId = columnsArr[0].split("_")[0];
			this.checkDatasetId(queryId);
			this.queryDataset = queryId;
		}
		return columnsArr.map((column: string) => {
			let columnSplit = column.split("_");
			if (columnSplit.length === 1) {
				if (this.queryApplyKeys.includes(column)) {
					return column;
				} else {
					throw new Error("Bad Column Key - ApplyKey");
				}
			}
			if (columnSplit[0] !== this.queryDataset ||
				!(this.allowedMFields.includes(columnSplit[1]) || this.allowedSFields.includes(columnSplit[1])) ||
				!(!this.transformation || this.queryGroups.includes(columnSplit[1]))) {
				throw new Error("Bad Column Key - Key");
			}
			return columnSplit[1];
		});
	}

	private checkDatasetId(queryId: string) {
		if (!Object.keys(this.datasets).includes(queryId)) {
			throw new Error("Dataset Not Added");
		}
		if (this.datasets[queryId].kind === InsightDatasetKind.Rooms) {
			this.allowedMFields = roomMFields;
			this.allowedSFields = roomSFields;
			this.queryKind = InsightDatasetKind.Rooms;
		}
	}

	private parseOrder(order: object): string | object {
		if (typeof order !== "string" && typeof order !== "object") {
			throw new Error("Bad Order Object");
		}
		if (typeof order === "string") {
			return this.parseSingleOrder(order as string);
		}
		return this.parseMultiOrder(order as any);
	}

	private parseMultiOrder(order: any): object {
		let correctKeys = JSON.stringify(["dir", "keys"]);
		if (JSON.stringify(Object.keys(order).sort()) !== correctKeys ||
			!(order["dir"] === "UP" || order["dir"] === "DOWN") ||
			!Array.isArray(order["keys"]) || order["keys"].length === 0) {
			throw new Error("Bad Sort Object");
		}
		for (let key of order["keys"]) {
			this.parseSingleOrder(key);
		}
		return order as object;
	}

	private parseSingleOrder(order: string): string {
		let orderSplit = order.split("_");
		if (orderSplit.length === 1) {
			if (!this.queryColumns.includes(order)) {
				throw new Error("Bad Sort Key - ApplyKey");
			}
			return order;
		}
		if (orderSplit.length !== 2 ||
			this.queryDataset !== orderSplit[0] ||
			!this.queryColumns.includes(orderSplit[1])) {
			throw new Error("Bad Sort Key - Key");
		}
		return order;
	}


	private checkOptionsKeys(query: object): boolean {
		if (!("OPTIONS" in query) || typeof (query as ObjA)["OPTIONS"] !== "object") {
			return false;
		}
		let optionValues = JSON.stringify(Object.keys((query as Obj)["OPTIONS"]).sort());
		let columnsExists = optionValues === JSON.stringify(["COLUMNS"]);
		let bothExists = optionValues === JSON.stringify(["COLUMNS", "ORDER"]);
		return columnsExists || bothExists;
	}


}


