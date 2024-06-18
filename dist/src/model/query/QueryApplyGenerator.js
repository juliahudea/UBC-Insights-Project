"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryApplyGenerator = void 0;
const decimal_js_1 = __importDefault(require("decimal.js"));
class QueryApplyGenerator {
    queryValidator;
    queryApplyFnList = [];
    constructor(queryValidator) {
        this.queryValidator = queryValidator;
        this.queryApplyFnList = this.produceApplyFnList();
    }
    produceApplyFnList() {
        let applyList = this.queryValidator.queryApplyRules;
        let applyFnList = [];
        for (let applyRule of applyList) {
            let applyFnObj = {};
            let applyKey = Object.keys(applyRule)[0];
            let applyFn = this.produceApplyFn(Object.values(applyRule)[0]);
            applyFnObj[applyKey] = applyFn;
            applyFnList.push(applyFnObj);
        }
        return applyFnList;
    }
    produceApplyFn(applyRule) {
        let applyToken = Object.keys(applyRule)[0];
        let key = Object.values(applyRule)[0];
        let field = key.split("_")[1];
        switch (applyToken) {
            case "MAX": {
                return this.produceMaxFn(field);
                break;
            }
            case "MIN": {
                return this.produceMinFn(field);
                break;
            }
            case "AVG": {
                return this.produceAvgFn(field);
                break;
            }
            case "SUM": {
                return this.produceSumFn(field);
                break;
            }
            default: {
                return this.productCountFn(field);
            }
        }
    }
    productCountFn(field) {
        return (list) => {
            let occurrences = [];
            return list.reduce((acc, entry) => {
                let isNew = 0;
                if (!occurrences.includes(entry[field])) {
                    occurrences.push(entry[field]);
                    isNew = 1;
                }
                return acc + isNew;
            }, 0);
        };
    }
    produceSumFn(field) {
        return (list) => {
            let sum = list.reduce((acc, entry) => {
                return acc + entry[field];
            }, 0);
            return Number(sum.toFixed(2));
        };
    }
    produceAvgFn(field) {
        return (list) => {
            let total = list.length;
            let sum = list.reduce((acc, entry) => {
                return decimal_js_1.default.add(acc, new decimal_js_1.default(entry[field]));
            }, new decimal_js_1.default(0));
            let avg = sum.toNumber() / total;
            return Number(avg.toFixed(2));
        };
    }
    produceMinFn(field) {
        return (list) => {
            let min = list[0][field];
            for (let item of list) {
                if (item[field] < min) {
                    min = item[field];
                }
            }
            return min;
        };
    }
    produceMaxFn(field) {
        return (list) => {
            let max = list[0][field];
            for (let item of list) {
                if (item[field] > max) {
                    max = item[field];
                }
            }
            return max;
        };
    }
}
exports.QueryApplyGenerator = QueryApplyGenerator;
//# sourceMappingURL=QueryApplyGenerator.js.map