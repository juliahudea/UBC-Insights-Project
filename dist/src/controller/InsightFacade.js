"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IInsightFacade_1 = require("./IInsightFacade");
const LoadHelperFunctions_1 = require("./LoadHelperFunctions");
const SectionHelperFunctions_1 = require("./SectionHelperFunctions");
const RoomHelperFunctions_1 = require("./RoomHelperFunctions");
const QueryValidator_1 = require("../model/query/QueryValidator");
const QueryEngine_1 = require("../model/query/QueryEngine");
class InsightFacade {
    metadata;
    dbData;
    constructor() {
        this.metadata = {};
        this.dbData = {};
        console.log("InsightFacadeImpl::init()");
    }
    async addDataset(id, content, kind) {
        if (Object.keys(this.metadata).length === 0) {
            try {
                this.metadata = await (0, LoadHelperFunctions_1.loadMetaData)();
            }
            catch (e) {
                this.metadata = {};
            }
        }
        if (id === undefined ||
            id === null ||
            id === "" ||
            id.includes("_") ||
            id.trim().length === 0 ||
            Object.keys(this.metadata).includes(id)) {
            return Promise.reject(new IInsightFacade_1.InsightError("Invalid id"));
        }
        let datasetContent;
        if (kind === IInsightFacade_1.InsightDatasetKind.Sections) {
            datasetContent = await (0, SectionHelperFunctions_1.addSectionDataset)(content);
        }
        else if (kind === IInsightFacade_1.InsightDatasetKind.Rooms) {
            datasetContent = await (0, RoomHelperFunctions_1.addRoomDataset)(content);
        }
        else {
            return Promise.reject(new IInsightFacade_1.InsightError("Invalid kind"));
        }
        let dataset = {
            id: id,
            kind: kind,
            numRows: datasetContent.length,
        };
        this.metadata[id] = dataset;
        this.dbData[id] = datasetContent;
        const datasetIds = Object.keys(this.metadata);
        let result;
        try {
            result = await (0, LoadHelperFunctions_1.writeMetadata)(this.metadata);
            result = await (0, LoadHelperFunctions_1.addData)(id, datasetContent);
        }
        catch (e) {
            return Promise.reject(new IInsightFacade_1.InsightError("Could not write to disk"));
        }
        return Promise.resolve(datasetIds);
    }
    async listDatasets() {
        let datasetList = [];
        if (Object.keys(this.metadata).length === 0) {
            try {
                this.metadata = await (0, LoadHelperFunctions_1.loadMetaData)();
            }
            catch (e) {
                return Promise.resolve([]);
            }
        }
        for (const dataset in this.metadata) {
            datasetList.push(this.metadata[dataset]);
        }
        return Promise.resolve(datasetList);
    }
    async removeDataset(id) {
        if (id === undefined || id === null || id === "" || id.includes("_") || id.trim().length === 0) {
            return Promise.reject(new IInsightFacade_1.InsightError("Invalid id"));
        }
        if (Object.keys(this.metadata).length === 0) {
            try {
                this.metadata = await (0, LoadHelperFunctions_1.loadMetaData)();
            }
            catch (e) {
                return Promise.reject(new IInsightFacade_1.NotFoundError("Could not load datasets"));
            }
        }
        if (!Object.keys(this.metadata).includes(id)) {
            return Promise.reject(new IInsightFacade_1.NotFoundError("Dataset not found"));
        }
        delete this.metadata[id];
        try {
            await (0, LoadHelperFunctions_1.removeData)(id);
            await (0, LoadHelperFunctions_1.writeMetadata)(this.metadata);
        }
        catch (e) {
            return Promise.reject(new IInsightFacade_1.InsightError("Could not write to disk"));
        }
        return Promise.resolve(id);
    }
    async performQuery(query) {
        if (Object.keys(this.metadata).length === 0) {
            try {
                this.metadata = await (0, LoadHelperFunctions_1.loadMetaData)();
            }
            catch (e) {
                return Promise.reject(new IInsightFacade_1.InsightError("No Datasets Present"));
            }
        }
        if (typeof query !== "object") {
            return Promise.reject(new IInsightFacade_1.InsightError("query not object"));
        }
        let validator;
        try {
            validator = new QueryValidator_1.QueryValidator(query, this.metadata);
        }
        catch (e) {
            return Promise.reject(new IInsightFacade_1.InsightError(e.toString()));
        }
        let dataId = validator.queryDataset;
        if (this.dbData[dataId] === undefined) {
            let data = await (0, LoadHelperFunctions_1.getData)(dataId);
            this.dbData[dataId] = data;
        }
        let data = this.dbData[dataId];
        let queryEngine;
        try {
            queryEngine = new QueryEngine_1.QueryEngine(query, validator, data);
        }
        catch (e) {
            if (e instanceof IInsightFacade_1.ResultTooLargeError) {
                return Promise.reject(e);
            }
            else {
                return Promise.reject(new IInsightFacade_1.InsightError(e.message));
            }
        }
        return Promise.resolve(queryEngine.finalResult);
    }
}
exports.default = InsightFacade;
//# sourceMappingURL=InsightFacade.js.map