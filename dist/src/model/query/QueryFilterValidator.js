"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryFilterValidator = void 0;
const Constants_1 = require("../Constants");
class QueryFilterValidator {
    queryValidator;
    constructor(queryValidator) {
        this.queryValidator = queryValidator;
    }
    validateFilters(filter) {
        if (Object.keys(filter).length === 0) {
            return;
        }
        if (!this.checkFilter(filter)) {
            throw new Error("Bad Filter Key");
        }
        let filterO = filter;
        let compKey = Object.keys(filterO)[0];
        switch (compKey) {
            case "IS": {
                if (!this.checkSComp(filterO["IS"])) {
                    throw new Error("Bad SComp");
                }
                break;
            }
            case "GT": {
                this.validateMComp(filterO, compKey);
                break;
            }
            case "LT": {
                this.validateMComp(filterO, compKey);
                break;
            }
            case "EQ": {
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
    validateLComp(filterO, compKey) {
        if (!this.checkLComp(filterO[compKey])) {
            throw new Error("Bad LComp");
        }
        filterO[compKey].forEach((filter) => {
            this.validateFilters(filter);
        });
    }
    validateNComp(filterO, compKey) {
        if (!this.checkNeg(filterO["NOT"])) {
            throw new Error("Bad NComp");
        }
        this.validateFilters(filterO["NOT"]);
    }
    validateMComp(filterO, compKey) {
        if (!this.checkMComp(filterO[compKey])) {
            throw new Error("BadMComp");
        }
    }
    checkFilter(filter) {
        if (Object.keys(filter).length !== 1) {
            return false;
        }
        let key = Object.keys(filter)[0];
        return typeof key === "string" &&
            (typeof filter[key] === "object" || Array.isArray(filter[key])) &&
            Constants_1.filterKeys.includes(Object.keys(filter)[0]);
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
        return !(Array.isArray(neg) || Object.keys(neg).length !== 1 ||
            typeof Object.keys(neg)[0] !== "string");
    }
    checkMComp(mComp) {
        if (mComp === undefined || Array.isArray(mComp) || Object.keys(mComp).length !== 1 ||
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
            && inputStringSplit[2] === "" && inputStringSplit[1] !== "") ||
            (inputStringSplit.length === 2 && inputStringSplit.includes("")) ||
            (inputStringSplit.length === 1);
    }
    checkSKey(sKey) {
        let sKeySplit = sKey.split("_");
        if (sKeySplit.length !== 2) {
            return false;
        }
        return this.queryValidator.allowedSFields.includes(sKeySplit[1]) &&
            this.queryValidator.queryDataset === sKeySplit[0];
    }
    checkMKey(mKey) {
        let mKeySplit = mKey.split("_");
        if (mKeySplit.length !== 2) {
            return false;
        }
        return this.queryValidator.allowedMFields.includes(mKeySplit[1]) &&
            this.queryValidator.queryDataset === mKeySplit[0];
    }
}
exports.QueryFilterValidator = QueryFilterValidator;
//# sourceMappingURL=QueryFilterValidator.js.map