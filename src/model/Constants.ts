import {InsightResult} from "../controller/IInsightFacade";
import Section from "./Section";
import Room from "./Room";

export interface Obj  {[key: string]: object}
export interface ObjA  {[key: string]: any}
export interface FilterT {[filter: string]: object | any[]}
export const sectionSFields = ["dept", "id", "instructor", "title", "uuid"];
export const sectionMFields = ["avg", "pass", "fail", "audit", "year"];
export const roomSFields = ["fullname", "shortname", "number", "name", "address", "type", "furniture", "href"];
export const roomMFields = ["lat", "lon", "seats"];
export const applyTokens = ["MAX", "MIN", "AVG", "COUNT", "SUM"];
export const numbericApplyTokens = ["MAX", "MIN", "AVG", "SUM"];
export const filterKeys = ["IS", "GT", "LT", "EQ", "NOT", "AND", "OR"];
export const upComp = (a: any, b: any) => {
	return a > b;
};
export const downComp = (a: any, b: any) => {
	return b > a;
};
export interface Group {
	result: InsightResult;
	entries: Array<Room | Section>
}
