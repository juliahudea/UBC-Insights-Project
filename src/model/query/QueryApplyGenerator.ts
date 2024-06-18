import {QueryValidator} from "./QueryValidator";
import Room from "../Room";
import Section from "../Section";
import Decimal from "decimal.js";

export class QueryApplyGenerator {
	public queryValidator: QueryValidator;
	public queryApplyFnList: any[] = [];

	constructor(queryValidator: QueryValidator) {
		this.queryValidator = queryValidator;
		this.queryApplyFnList = this.produceApplyFnList();
	}

	private produceApplyFnList(): any[] {
		let applyList = this.queryValidator.queryApplyRules;
		let applyFnList: any[] = [];
		for (let applyRule of applyList){
			let applyFnObj: any = {};
			let applyKey = Object.keys(applyRule)[0];
			let applyFn = this.produceApplyFn(Object.values(applyRule)[0]);
			applyFnObj[applyKey] = applyFn;
			applyFnList.push(applyFnObj);
		}
		return applyFnList;
	}

	private produceApplyFn(applyRule: any): any{
		let applyToken = Object.keys(applyRule)[0];
		let key  = (Object.values(applyRule)[0] as string);
		let field = key.split("_")[1];
		switch (applyToken) {
			case "MAX": {
				return this.produceMaxFn(field);
				break;
			} case "MIN": {
				return this.produceMinFn(field);
				break;
			} case "AVG": {
				return this.produceAvgFn(field);
				break;
			} case "SUM": {
				return this.produceSumFn(field);
				break;
			} default: {
				return this.productCountFn(field);
			}

		}
	}

	private productCountFn(field: string) {
		return (list: Array<Room | Section>): number => {
			let occurrences: any[] = [];
			return list.reduce((acc: number, entry: Room | Section): number => {
				let isNew = 0;
				if (!occurrences.includes((entry as any)[field])) {
					occurrences.push ((entry as any)[field]);
					isNew = 1;
				}
				return acc + isNew;
			}, 0);
		};
	}

	private produceSumFn(field: string) {
		return (list: Array<Room | Section>): number  => {
			let sum = list.reduce((acc: number, entry: Room | Section): number => {
				return acc + (entry as any)[field];
			}, 0);
			return Number(sum.toFixed(2));
		};
	}

	private produceAvgFn(field: string) {
		return (list: Array<Room | Section>): number  => {
			let total = list.length;
			let sum = list.reduce((acc: Decimal, entry: Room | Section): Decimal => {
				return Decimal.add(acc, new Decimal((entry as any)[field]));
			}, new Decimal(0));
			let avg = sum.toNumber() / total;
			return Number(avg.toFixed(2));
		};
	}

	private produceMinFn(field: string) {
		return (list: Array<Room | Section>): number  => {
			let min = (list[0] as any)[field];
			for (let item of list) {
				if ((item as any)[field] < min) {
					min = (item as any)[field];
				}
			}
			return min;
		};
	}

	private produceMaxFn(field: string) {
		return (list: Array<Room | Section>): number  => {
			let max = (list[0] as any)[field];
			for (let item of list) {
				if ((item as any)[field] > max) {
					max = (item as any)[field];
				}
			}
			return max;
		};
	}
}
