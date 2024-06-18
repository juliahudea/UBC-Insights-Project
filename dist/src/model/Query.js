"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Query = exports.mFields = exports.sFields = void 0;
exports.sFields = ["dept", "id", "instructor", "title", "uuid"];
exports.mFields = ["avg", "pass", "fail", "audit", "year"];
class Query {
    datasets;
    queryDataset = "";
    queryOrder = "";
    queryColumns = [];
    queryFilter = (section) => {
        return true;
    };
    constructor(query, datasets) {
        this.datasets = datasets;
        this.parseOptions(query);
        this.parseWhere(query);
    }
    parseWhere(query) {
        if (JSON.stringify(Object.keys(query).sort()) !== JSON.stringify(["OPTIONS", "WHERE"]) ||
            typeof query["WHERE"] !== "object") {
            throw new Error();
        }
        let queryO = query;
        this.queryFilter = this.parseFilters(queryO["WHERE"]);
    }
    parseFilters(filter) {
        if (Object.keys(filter).length === 0) {
            return (section) => {
                return true;
            };
        }
        if (!this.checkFilter(filter)) {
            throw new Error();
        }
        let filterO = filter;
        let compKey = Object.keys(filterO)[0];
        switch (compKey) {
            case "IS": {
                if (!this.checkSComp(filterO["IS"])) {
                    throw new Error();
                }
                return this.handleSComp(filterO["IS"]);
                break;
            }
            case "GT": {
                return this.produceMComp(filterO, compKey);
                break;
            }
            case "LT": {
                return this.produceMComp(filterO, compKey);
                break;
            }
            case "EQ": {
                return this.produceMComp(filterO, compKey);
                break;
            }
            case "AND": {
                return this.produceLComp(filterO, compKey);
                break;
            }
            case "OR": {
                return this.produceLComp(filterO, compKey);
                break;
            }
            default: {
                return this.produceNComp(filterO, compKey);
            }
        }
    }
    produceLComp(filterO, compKey) {
        if (!this.checkLComp(filterO[compKey])) {
            throw new Error();
        }
        return this.handleLComp(filterO[compKey], compKey);
    }
    produceNComp(filterO, compKey) {
        if (!this.checkNeg(filterO["NOT"])) {
            throw new Error();
        }
        let child = this.parseFilters(filterO["NOT"]);
        return (section) => {
            return !child(section);
        };
    }
    produceMComp(filterO, compKey) {
        if (!this.checkMComp(filterO[compKey])) {
            throw new Error();
        }
        return this.handleMComp(filterO[compKey], compKey);
    }
    handleLComp(filterOElement, compKey) {
        let children = filterOElement.map((filter) => {
            return this.parseFilters(filter);
        });
        if (compKey === "AND") {
            return (section) => {
                let result = true;
                children.forEach((filter) => {
                    result = result && filter(section);
                });
                return result;
            };
        }
        else {
            return (section) => {
                let result = false;
                children.forEach((filter) => {
                    result = result || filter(section);
                });
                return result;
            };
        }
    }
    handleSComp(sComp) {
        let sKey = Object.keys(sComp)[0];
        let sField = sKey.split("_")[1];
        let inputString = sComp[sKey];
        let inputStringSplit = inputString.split("*");
        switch (inputStringSplit.length) {
            case 3:
                return (section) => {
                    let sectionObject = section;
                    return sectionObject[sField].includes(inputStringSplit[1]);
                };
                break;
            case 2:
                if (inputStringSplit[0] === "") {
                    return (section) => {
                        let sectionObject = section;
                        return sectionObject[sField].endsWith(inputStringSplit[1]);
                    };
                }
                return (section) => {
                    let sectionObject = section;
                    return sectionObject[sField].startsWith(inputStringSplit[0]);
                };
                break;
            default:
                return (section) => {
                    let sectionObject = section;
                    return sectionObject[sField] === inputString;
                };
        }
    }
    handleMComp(mComp, compKey) {
        let mKey = Object.keys(mComp)[0];
        let compNum = mComp[mKey];
        let mField = mKey.split("_")[1];
        switch (compKey) {
            case "GT":
                return (section) => {
                    let sectionObject = section;
                    return sectionObject[mField] > compNum;
                };
                break;
            case "LT":
                return (section) => {
                    let sectionObject = section;
                    return sectionObject[mField] < compNum;
                };
                break;
            default:
                return (section) => {
                    let sectionObject = section;
                    return sectionObject[mField] === compNum;
                };
        }
    }
    checkFilter(filter) {
        if (!(Object.keys(filter).length === 1)) {
            return false;
        }
        let key = Object.keys(filter)[0];
        return typeof key === "string" &&
            (typeof filter[key] === "object" || Array.isArray(filter[key])) &&
            ["IS", "GT", "LT", "EQ", "NOT", "AND", "OR"].includes(Object.keys(filter)[0]);
    }
    parseOptions(query) {
        if (!this.checkOptionsKeys(query)) {
            throw new Error();
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
            throw new Error();
        }
        let columnsArr = columns;
        this.queryDataset = columns[0].split("_")[0];
        if (!this.datasets.includes(this.queryDataset)) {
            throw new Error();
        }
        return columnsArr.map((column) => {
            let columnSplit = column.split("_");
            if (!(columnSplit[0] === this.queryDataset) ||
                !(exports.mFields.includes(columnSplit[1]) || exports.sFields.includes(columnSplit[1]))) {
                throw new Error();
            }
            return columnSplit[1];
        });
    }
    parseOrder(order) {
        if (typeof order !== "string") {
            throw new Error();
        }
        let orderS = order;
        let orderSplit = orderS.split("_");
        if (orderSplit.length !== 2 ||
            this.queryDataset !== orderSplit[0] ||
            !this.queryColumns.includes(orderSplit[1])) {
            throw new Error();
        }
        return orderSplit[1];
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
    checkSComp(sComp) {
        if (sComp === undefined || Array.isArray(sComp) ||
            Object.keys(sComp).length !== 1 ||
            typeof Object.keys(sComp)[0] !== "string" ||
            typeof sComp[Object.keys(sComp)[0]] !== "string") {
            return false;
        }
        let sCompO = sComp;
        let sKey = Object.keys(sCompO)[0];
        let inputString = sCompO[sKey];
        let inputStringSplit = inputString.split("*");
        return this.checkInputString(inputStringSplit) && this.checkSKey(sKey);
    }
    checkLComp(lComp) {
        return typeof Array.isArray(lComp) &&
            lComp.length >= 1 &&
            lComp.reduce((acc, curr) => {
                return acc && (typeof curr === "object");
            });
    }
    checkNeg(neg) {
        return !(Array.isArray(neg) ||
            Object.keys(neg).length !== 1 ||
            typeof Object.keys(neg)[0] !== "string");
    }
    checkMComp(mComp) {
        if (mComp === undefined || Array.isArray(mComp) ||
            Object.keys(mComp).length !== 1 ||
            typeof Object.keys(mComp)[0] !== "string" ||
            typeof mComp[Object.keys(mComp)[0]] !== "number") {
            return false;
        }
        let mCompO = mComp;
        let mKey = Object.keys(mCompO)[0];
        let inputNum = mCompO[mKey];
        return this.checkMKey(mKey);
    }
    checkInputString(inputStringSplit) {
        return (inputStringSplit.length === 3 && inputStringSplit[0] === ""
            && inputStringSplit[2] === ""
            && inputStringSplit[1] !== "")
            || (inputStringSplit.length === 2 && inputStringSplit.includes(""))
            || (inputStringSplit.length === 1);
    }
    checkSKey(sKey) {
        let sKeySplit = sKey.split("_");
        if (sKeySplit.length !== 2) {
            return false;
        }
        return exports.sFields.includes(sKeySplit[1]) && this.datasets.includes(sKeySplit[0]);
    }
    checkMKey(mKey) {
        let mKeySplit = mKey.split("_");
        if (mKeySplit.length !== 2) {
            return false;
        }
        return exports.mFields.includes(mKeySplit[1]) && this.datasets.includes(mKeySplit[0]);
    }
}
exports.Query = Query;
//# sourceMappingURL=Query.js.map