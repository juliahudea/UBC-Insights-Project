"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryEngine = void 0;
const QueryFilterGenerator_1 = require("./QueryFilterGenerator");
const QuerySortGenerator_1 = require("./QuerySortGenerator");
const QueryApplyGenerator_1 = require("./QueryApplyGenerator");
const IInsightFacade_1 = require("../../controller/IInsightFacade");
class QueryEngine {
    query;
    data;
    filteredData;
    finalResult;
    queryValidator;
    queryFilterGenerator;
    querySortGenerator;
    queryApplyGenerator;
    constructor(query, queryValidator, data) {
        this.query = query;
        this.data = data;
        this.queryValidator = queryValidator;
        this.queryFilterGenerator = new QueryFilterGenerator_1.QueryFilterGenerator(query, queryValidator);
        this.queryApplyGenerator = new QueryApplyGenerator_1.QueryApplyGenerator(queryValidator);
        this.querySortGenerator = new QuerySortGenerator_1.QuerySortGenerator(queryValidator);
        this.filteredData = this.applyFilter();
        this.finalResult = this.handleColumns();
        this.handleSort();
    }
    applyFilter() {
        let queryFilter = this.queryFilterGenerator.queryFilter;
        let filteredData = [];
        let counter = 0;
        for (let entry of this.data) {
            if (queryFilter(entry)) {
                if (counter >= 5000 && !this.queryValidator.transformation) {
                    throw new IInsightFacade_1.ResultTooLargeError("Result Too large");
                }
                filteredData.push(entry);
                counter++;
            }
        }
        return filteredData;
    }
    handleColumns() {
        let transformation = this.queryValidator.transformation;
        if (transformation) {
            return this.handleColumnsWithTrans();
        }
        return this.handleColumnsDef();
    }
    handleColumnsWithTrans() {
        let groupKeys = this.queryValidator.queryGroups;
        let groups = this.produceGroups(groupKeys);
        this.applyTransforms(groups);
        return this.extractColumns(groups);
    }
    handleColumnsDef() {
        let columns = this.queryValidator.queryColumns;
        let datasetId = this.queryValidator.queryDataset;
        let unsortedResult = [];
        for (let entry of this.filteredData) {
            let currResult = {};
            for (let column of columns) {
                currResult[`${datasetId}_${column}`] = entry[column];
            }
            unsortedResult.push(currResult);
        }
        return unsortedResult;
    }
    handleSort() {
        let orderComp = this.querySortGenerator.querySortComp;
        this.finalResult.sort(orderComp);
    }
    produceGroups(groupKeys) {
        let counter = 0;
        let id = this.queryValidator.queryDataset;
        let groupValues = groupKeys.map((key) => {
            return [];
        });
        let groups = {};
        for (let entry of this.filteredData) {
            groupKeys.forEach((key, index) => {
                let value = entry[key];
                if (!groupValues[index].includes(value)) {
                    groupValues[index].push(value);
                }
            });
        }
        for (let entry of this.filteredData) {
            let groupStr = "";
            let currResult = {};
            groupKeys.forEach((key, index) => {
                let value = entry[key];
                let valIndex = groupValues[index].indexOf(value);
                groupStr = groupStr.concat(valIndex.toString()).concat("_");
                currResult[`${id}_${key}`] = value;
            });
            if (groups[groupStr] === undefined) {
                if (counter >= 5000) {
                    throw new IInsightFacade_1.ResultTooLargeError("Result Too Large");
                }
                groups[groupStr] = { result: currResult, entries: [] };
                groups[groupStr]["entries"].push(entry);
                counter++;
            }
            else {
                groups[groupStr]["entries"].push(entry);
            }
        }
        return Object.values(groups);
    }
    applyTransforms(groups) {
        let transforms = this.queryApplyGenerator.queryApplyFnList;
        for (let transform of transforms) {
            for (let group of groups) {
                let transformFn = Object.values(transform)[0];
                let transformKey = Object.keys(transform)[0];
                let groupEntries = group["entries"];
                let result = transformFn(groupEntries);
                group["result"][transformKey] = result;
            }
        }
    }
    extractColumns(groups) {
        let columns = this.query["OPTIONS"]["COLUMNS"];
        let results = [];
        for (let group of groups) {
            let groupResult = group["result"];
            let result = {};
            for (let column of columns) {
                result[column] = groupResult[column];
            }
            results.push(result);
        }
        return results;
    }
}
exports.QueryEngine = QueryEngine;
//# sourceMappingURL=QueryEngine.js.map