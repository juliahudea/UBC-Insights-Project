import {filterKeys, FilterT, ObjA} from "../Constants";
import {QueryValidator} from "./QueryValidator";

export class QueryFilterValidator {
	public queryValidator: QueryValidator;

	constructor(queryValidator: QueryValidator) {
		this.queryValidator = queryValidator;
	}

	public validateFilters(filter: object) {
		if (Object.keys(filter).length === 0) {
			return;
		}
		if (!this.checkFilter(filter)) {
			throw new Error("Bad Filter Key");
		}
		let filterO = filter as FilterT;
		let compKey = Object.keys(filterO)[0];
		switch (compKey) {
			case "IS": {
				if (!this.checkSComp(filterO["IS"])) {
					throw new Error("Bad SComp");
				}
				break;
			}
			case"GT": {
				this.validateMComp(filterO, compKey);
				break;
			}
			case"LT": {
				this.validateMComp(filterO, compKey);
				break;
			}
			case"EQ": {
				this.validateMComp(filterO, compKey);
				break;
			}
			case "AND": {
				this.validateLComp(filterO, compKey);
				break;
			}
			case "OR": {
				this.validateLComp(filterO, compKey);
				break;
			}
			default: {
				this.validateNComp(filterO, compKey);
			}

		}
	}

	private validateLComp(filterO: FilterT, compKey: string) {
		if (!this.checkLComp(filterO[compKey])) {
			throw new Error("Bad LComp");
		}
		(filterO[compKey] as any).forEach((filter: FilterT) => {
			this.validateFilters(filter);
		});
	}

	private validateNComp(filterO: FilterT, compKey: string) {
		if (!this.checkNeg(filterO["NOT"])) {
			throw new Error("Bad NComp");
		}
		this.validateFilters(filterO["NOT"]);
	}

	private validateMComp(filterO: FilterT, compKey: string) {
		if (!this.checkMComp(filterO[compKey])) {
			throw new Error("BadMComp");
		}
	}

	private checkFilter(filter: object) {
		if (Object.keys(filter).length !== 1) {
			return false;
		}
		let key = Object.keys(filter)[0];
		return typeof key === "string" &&
			(typeof (filter as ObjA)[key] === "object" || Array.isArray((filter as ObjA)[key] )) &&
			filterKeys.includes(Object.keys(filter)[0]);
	}

	private checkSComp(sComp: object | any[]): boolean {
		if (sComp === undefined || Array.isArray(sComp) ||
			Object.keys(sComp as object).length !== 1 ||
			typeof Object.keys(sComp as object)[0] !== "string" ||
			typeof (sComp as ObjA)[Object.keys(sComp as object)[0]] !== "string") {
			return false;
		}
		let sCompO = sComp as {[key: string]: string};
		let sKey = Object.keys(sCompO)[0];
		let inputString = sCompO[sKey];
		let inputStringSplit = inputString.split("*");
		return this.checkInputString(inputStringSplit) && this.checkSKey(sKey);
	}

	private checkLComp(lComp: object | any[]): boolean {
		return typeof Array.isArray(lComp) &&
			(lComp as any[]).length >= 1 &&
			(lComp as any[]).reduce((acc, curr) => {
				return acc && (typeof curr === "object");
			});
	}

	private checkNeg(neg: object | any[]): boolean {
		return !(Array.isArray(neg) || Object.keys(neg as object).length !== 1 ||
			typeof Object.keys(neg as object)[0] !== "string");
	}

	private checkMComp(mComp: object | any[]): boolean {
		if (mComp === undefined || Array.isArray(mComp) || Object.keys(mComp as object).length !== 1 ||
			typeof Object.keys(mComp as object)[0] !== "string" ||
			typeof (mComp as ObjA)[Object.keys(mComp as object)[0]] !== "number") {
			return false;
		}
		let mCompO = mComp as {[key: string]: number};
		let mKey = Object.keys(mCompO)[0];
		let inputNum = mCompO[mKey];
		return this.checkMKey(mKey);
	}

	private checkInputString(inputStringSplit: string[]) {
		return (inputStringSplit.length === 3 && inputStringSplit[0] === ""
				&& inputStringSplit[2] === "" && inputStringSplit[1] !== "") ||
			(inputStringSplit.length === 2 && inputStringSplit.includes("")) ||
			(inputStringSplit.length === 1);
	}

	private checkSKey(sKey: string) {
		let sKeySplit = sKey.split("_");
		if (sKeySplit.length !== 2) {
			return false;
		}
		return this.queryValidator.allowedSFields.includes(sKeySplit[1]) &&
			this.queryValidator.queryDataset === sKeySplit[0];
	}

	private checkMKey(mKey: string) {
		let mKeySplit = mKey.split("_");
		if (mKeySplit.length !== 2) {
			return false;
		}
		return this.queryValidator.allowedMFields.includes(mKeySplit[1]) &&
			this.queryValidator.queryDataset === mKeySplit[0];
	}
}
