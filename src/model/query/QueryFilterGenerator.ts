import Section from "../Section";
import {QueryValidator} from "./QueryValidator";
import {InsightDataset} from "../../controller/IInsightFacade";
import Room from "../Room";

interface DataObj {[field: string]: string | number}

export class QueryFilterGenerator {
	public queryValidator: QueryValidator;
	public queryFilter: (entry: Section | Room) => boolean = (entry: Section | Room) => {
		return true;
	};

	constructor(query: any, queryValidator: QueryValidator) {
		this.queryValidator = queryValidator;
		this.queryFilter = this.parseFilters(query["WHERE"]);

	}

	private parseFilters(filter: any): (entry: Section | Room) => boolean {
		if (Object.keys(filter).length === 0) {
			return (entry: Section | Room) => {
				return true;
			};
		}
		let compKey = Object.keys(filter)[0];
		switch (compKey) {
			case "IS": {
				return this.handleSComp(filter["IS"] as {[key: string]: string});
				break;
			}
			case"GT": {
				return this.handleMComp(filter[compKey], compKey);
				break;
			}
			case"LT": {
				return this.handleMComp(filter[compKey], compKey);
				break;
			}
			case"EQ": {
				return this.handleMComp(filter[compKey], compKey);
				break;
			}
			case "AND": {
				return this.handleLComp(filter[compKey], compKey);
				break;
			}
			case "OR": {
				return this.handleLComp(filter[compKey], compKey);
				break;
			}
			default: {
				return this.handleNComp(filter);
			}

		}
	}

	private handleNComp(filterO: any): (section: Section | Room) => boolean {
		let child = this.parseFilters(filterO["NOT"]);
		return (entry: Section | Room) => {
			return !child(entry);
		};
	}

	private handleLComp(filterOElement: any, compKey: string): (section: Section | Room) => boolean {
		let children: Array<(entry: Section | Room) => boolean> = filterOElement.map((filter: object) => {
			return this.parseFilters(filter);
		});
		if (compKey === "AND") {
			return (entry: Section | Room) => {
				let result = true;
				children.forEach((filter) => {
					result = result && filter(entry);
				});
				return result;
			};
		} else {
			return (entry: Section | Room) => {
				let result = false;
				children.forEach((filter) => {
					result = result || filter(entry);
				});
				return result;
			};
		}
	}

	private handleSComp(sComp: any): (entry: Section | Room) => boolean {
		let sKey = Object.keys(sComp)[0];
		let sField = sKey.split("_")[1];
		let inputString = sComp[sKey];
		let inputStringSplit = inputString.split("*");
		switch (inputStringSplit.length) {
			case 3:
				return (entry: Section | Room) => {
					let sectionObject = (entry as unknown as DataObj);
					return (sectionObject[sField] as string).includes(inputStringSplit[1]);
				};
				break;
			case 2:
				if (inputStringSplit[0] === "") {
					return (entry: Section | Room) => {
						let sectionObject = (entry as unknown as DataObj);
						return (sectionObject[sField] as string).endsWith(inputStringSplit[1]);
					};
				}
				return (entry: Section | Room) => {
					let sectionObject = (entry as unknown as DataObj);
					return (sectionObject[sField] as string).startsWith(inputStringSplit[0]);
				};
				break;
			default:
				return (entry: Section | Room) => {
					let sectionObject = (entry as unknown as DataObj);
					return sectionObject[sField] === inputString;
				};
		}
	}

	private handleMComp(mComp: any, compKey: string): (entry: Section | Room) => boolean {
		let mKey = Object.keys(mComp)[0];
		let compNum = mComp[mKey];
		let mField = mKey.split("_")[1];
		switch (compKey) {
			case "GT":
				return (entry: Section | Room) => {
					let sectionObject = (entry as unknown as DataObj);
					return (sectionObject[mField] as number) > compNum;
				};
				break;
			case "LT":
				return (entry: Section | Room) => {
					let sectionObject = (entry as unknown as DataObj);
					return (sectionObject[mField] as number) < compNum;
				};
				break;
			default:
				return (entry: Section | Room) => {
					let sectionObject = (entry as unknown as DataObj);
					return (sectionObject[mField] as number) === compNum;
				};
		}
	}
}
