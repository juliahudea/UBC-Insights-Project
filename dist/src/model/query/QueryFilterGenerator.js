"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryFilterGenerator = void 0;
class QueryFilterGenerator {
    queryValidator;
    queryFilter = (entry) => {
        return true;
    };
    constructor(query, queryValidator) {
        this.queryValidator = queryValidator;
        this.queryFilter = this.parseFilters(query["WHERE"]);
    }
    parseFilters(filter) {
        if (Object.keys(filter).length === 0) {
            return (entry) => {
                return true;
            };
        }
        let compKey = Object.keys(filter)[0];
        switch (compKey) {
            case "IS": {
                return this.handleSComp(filter["IS"]);
                break;
            }
            case "GT": {
                return this.handleMComp(filter[compKey], compKey);
                break;
            }
            case "LT": {
                return this.handleMComp(filter[compKey], compKey);
                break;
            }
            case "EQ": {
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
    handleNComp(filterO) {
        let child = this.parseFilters(filterO["NOT"]);
        return (entry) => {
            return !child(entry);
        };
    }
    handleLComp(filterOElement, compKey) {
        let children = filterOElement.map((filter) => {
            return this.parseFilters(filter);
        });
        if (compKey === "AND") {
            return (entry) => {
                let result = true;
                children.forEach((filter) => {
                    result = result && filter(entry);
                });
                return result;
            };
        }
        else {
            return (entry) => {
                let result = false;
                children.forEach((filter) => {
                    result = result || filter(entry);
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
                return (entry) => {
                    let sectionObject = entry;
                    return sectionObject[sField].includes(inputStringSplit[1]);
                };
                break;
            case 2:
                if (inputStringSplit[0] === "") {
                    return (entry) => {
                        let sectionObject = entry;
                        return sectionObject[sField].endsWith(inputStringSplit[1]);
                    };
                }
                return (entry) => {
                    let sectionObject = entry;
                    return sectionObject[sField].startsWith(inputStringSplit[0]);
                };
                break;
            default:
                return (entry) => {
                    let sectionObject = entry;
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
                return (entry) => {
                    let sectionObject = entry;
                    return sectionObject[mField] > compNum;
                };
                break;
            case "LT":
                return (entry) => {
                    let sectionObject = entry;
                    return sectionObject[mField] < compNum;
                };
                break;
            default:
                return (entry) => {
                    let sectionObject = entry;
                    return sectionObject[mField] === compNum;
                };
        }
    }
}
exports.QueryFilterGenerator = QueryFilterGenerator;
//# sourceMappingURL=QueryFilterGenerator.js.map