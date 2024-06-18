import {QueryValidator} from "./QueryValidator";
import {InsightResult} from "../../controller/IInsightFacade";
import {downComp, upComp} from "../Constants";

export class QuerySortGenerator {
	public queryValidator: QueryValidator;
	public querySortComp: (curr: InsightResult, other: InsightResult) => number =
		(curr: InsightResult, other: InsightResult) => {
			return 1;
		};


	constructor(queryValidator: QueryValidator) {
		this.queryValidator = queryValidator;
		this.querySortComp = this.produceSortComp();
	}

	private produceSortComp() {
		if (typeof this.queryValidator.queryOrder === "string") {
			return this.produceSingleSort(this.queryValidator.queryOrder);
		}
		return this.handleMultiSort(this.queryValidator.queryOrder);
	}

	private produceSingleSort(orderKey: string): (curr: InsightResult, other: InsightResult) => number {
		return (curr: InsightResult, other: InsightResult) => {
			if (curr[orderKey] === other[orderKey]) {
				return 0;
			}
			if (curr[orderKey] > other[orderKey]) {
				return 1;
			}
			return -1;
		};
	}

	private handleMultiSort(orderObj: any): (curr: InsightResult, other: InsightResult) => number {
		let dir = orderObj["dir"];
		let keyList = orderObj["keys"];
		let comp = upComp;
		if (dir === "DOWN") {
			comp = downComp;
		}
		return this.produceMultiSort(keyList, comp);
	}

	private produceMultiSort(keyList: any, comp: (a: any, b: any) => boolean):
		(curr: InsightResult, other: InsightResult) => number {
		let orderKey = keyList[0];
		if (keyList.length === 1) {
			return (curr: InsightResult, other: InsightResult) => {
				if (curr[orderKey] === other[orderKey]) {
					return 0;
				}
				if (comp(curr[orderKey], other[orderKey])) {
					return 1;
				}
				return -1;
			};
		}
		let rest = this.produceMultiSort(keyList.slice(1), comp);
		return (curr: InsightResult, other: InsightResult) => {
			if (curr[orderKey] === other[orderKey]) {
				return rest(curr, other);
			}
			if (comp(curr[orderKey], other[orderKey])) {
				return 1;
			}
			return -1;
		};
	}
}
