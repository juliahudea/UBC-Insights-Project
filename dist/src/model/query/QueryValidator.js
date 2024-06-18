"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryValidator = void 0;
const IInsightFacade_1 = require("../../controller/IInsightFacade");
const Constants_1 = require("../Constants");
const QueryFilterValidator_1 = require("./QueryFilterValidator");
class QueryValidator {
    datasets;
    transformation = true;
    allowedSFields = Constants_1.sectionSFields;
    allowedMFields = Constants_1.sectionMFields;
    queryKind = IInsightFacade_1.InsightDatasetKind.Sections;
    queryDataset = "";
    queryOrder = "";
    queryGroups = [];
    queryApplyKeys = [];
    queryApplyRules = [];
    queryColumns = [];
    constructor(query, datasets) {
        this.datasets = datasets;
        this.parseTransformation(query);
        this.parseOptions(query);
        this.parseWhere(query);
    }
    parseTransformation(query) {
        if (!("TRANSFORMATIONS" in query)) {
            this.transformation = false;
            return;
        }
        this.checkTransKey(query);
        let transformObj = query["TRANSFORMATIONS"];
        this.checkGroup(transformObj["GROUP"]);
        this.checkApply(transformObj["APPLY"]);
    }
    checkTransKey(query) {
        let correctKeys = JSON.stringify(["APPLY", "GROUP"]);
        if (typeof query["TRANSFORMATIONS"] !== "object" ||
            JSON.stringify(Object.keys(query["TRANSFORMATIONS"]).sort()) !== correctKeys) {
            throw new Error("Bad Transformations Object");
        }
    }
    checkGroup(groupList) {
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
                !(this.allowedMFields.includes(keySplit[1]) || this.allowedSFields.includes(keySplit[1]))) {
                throw new Error("Bad Group List");
            }
            this.queryGroups.push(keySplit[1]);
        }
    }
    checkApply(applyObj) {
        if (!Array.isArray(applyObj)) {
            throw new Error("Bad ApplyRuleList");
        }
        for (let applyRule of applyObj) {
            if (typeof applyRule !== "object" || Object.keys(applyRule).length !== 1 ||
                typeof Object.keys(applyRule)[0] !== "string" || Object.keys(applyRule)[0].includes("_") ||
                Object.keys(applyRule)[0] === "") {
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
    checkApplyKeyValue(applyRuleValue) {
        if (typeof applyRuleValue !== "object" ||
            Object.keys(applyRuleValue).length !== 1 ||
            typeof Object.keys(applyRuleValue)[0] !== "string" ||
            typeof Object.values(applyRuleValue)[0] !== "string") {
            return false;
        }
        let applyToken = Object.keys(applyRuleValue)[0];
        let key = Object.values(applyRuleValue)[0];
        let keySplit = key.split("_");
        return Constants_1.applyTokens.includes(applyToken) && keySplit.length === 2 && keySplit[0] === this.queryDataset &&
            (this.allowedMFields.includes(keySplit[1]) || this.allowedSFields.includes(keySplit[1])) &&
            (!Constants_1.numbericApplyTokens.includes(applyToken) || this.allowedMFields.includes(keySplit[1]));
    }
    parseWhere(query) {
        if (!(JSON.stringify(Object.keys(query).sort()) === JSON.stringify(["OPTIONS", "WHERE"]) ||
            JSON.stringify(Object.keys(query).sort()) ===
                JSON.stringify(["OPTIONS", "TRANSFORMATIONS", "WHERE"])) ||
            typeof query["WHERE"] !== "object") {
            throw new Error("Bad Where Object");
        }
        let queryO = query;
        new QueryFilterValidator_1.QueryFilterValidator(this).validateFilters(queryO["WHERE"]);
    }
    parseOptions(query) {
        if (!this.checkOptionsKeys(query)) {
            throw new Error("Issue With Options");
        }
        let queryO = query;
        let optionValues = JSON.stringify(Object.keys(queryO["OPTIONS"]).sort());
        if (optionValues === JSON.stringify(["COLUMNS"])) {
            this.queryColumns = this.parseColumn(queryO["OPTIONS"]["COLUMNS"]);
        }
        else {
            this.queryColumns = this.parseColumn(queryO["OPTIONS"]["COLUMNS"]);
            this.queryOrder = this.parseOrder((queryO["OPTIONS"]["ORDER"]));
        }
    }
    parseColumn(columns) {
        if (!Array.isArray(columns) || columns.length === 0 || typeof columns[0] !== "string") {
            throw new Error("Bad Columns ");
        }
        let columnsArr = columns;
        if (!this.transformation) {
            let queryId = columnsArr[0].split("_")[0];
            this.checkDatasetId(queryId);
            this.queryDataset = queryId;
        }
        return columnsArr.map((column) => {
            let columnSplit = column.split("_");
            if (columnSplit.length === 1) {
                if (this.queryApplyKeys.includes(column)) {
                    return column;
                }
                else {
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
    checkDatasetId(queryId) {
        if (!Object.keys(this.datasets).includes(queryId)) {
            throw new Error("Dataset Not Added");
        }
        if (this.datasets[queryId].kind === IInsightFacade_1.InsightDatasetKind.Rooms) {
            this.allowedMFields = Constants_1.roomMFields;
            this.allowedSFields = Constants_1.roomSFields;
            this.queryKind = IInsightFacade_1.InsightDatasetKind.Rooms;
        }
    }
    parseOrder(order) {
        if (typeof order !== "string" && typeof order !== "object") {
            throw new Error("Bad Order Object");
        }
        if (typeof order === "string") {
            return this.parseSingleOrder(order);
        }
        return this.parseMultiOrder(order);
    }
    parseMultiOrder(order) {
        let correctKeys = JSON.stringify(["dir", "keys"]);
        if (JSON.stringify(Object.keys(order).sort()) !== correctKeys ||
            !(order["dir"] === "UP" || order["dir"] === "DOWN") ||
            !Array.isArray(order["keys"]) || order["keys"].length === 0) {
            throw new Error("Bad Sort Object");
        }
        for (let key of order["keys"]) {
            this.parseSingleOrder(key);
        }
        return order;
    }
    parseSingleOrder(order) {
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
    checkOptionsKeys(query) {
        if (!("OPTIONS" in query) || typeof query["OPTIONS"] !== "object") {
            return false;
        }
        let optionValues = JSON.stringify(Object.keys(query["OPTIONS"]).sort());
        let columnsExists = optionValues === JSON.stringify(["COLUMNS"]);
        let bothExists = optionValues === JSON.stringify(["COLUMNS", "ORDER"]);
        return columnsExists || bothExists;
    }
}
exports.QueryValidator = QueryValidator;
//# sourceMappingURL=QueryValidator.js.map