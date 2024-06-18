"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuerySortGenerator = void 0;
const Constants_1 = require("../Constants");
class QuerySortGenerator {
    queryValidator;
    querySortComp = (curr, other) => {
        return 1;
    };
    constructor(queryValidator) {
        this.queryValidator = queryValidator;
        this.querySortComp = this.produceSortComp();
    }
    produceSortComp() {
        if (typeof this.queryValidator.queryOrder === "string") {
            return this.produceSingleSort(this.queryValidator.queryOrder);
        }
        return this.handleMultiSort(this.queryValidator.queryOrder);
    }
    produceSingleSort(orderKey) {
        return (curr, other) => {
            if (curr[orderKey] === other[orderKey]) {
                return 0;
            }
            if (curr[orderKey] > other[orderKey]) {
                return 1;
            }
            return -1;
        };
    }
    handleMultiSort(orderObj) {
        let dir = orderObj["dir"];
        let keyList = orderObj["keys"];
        let comp = Constants_1.upComp;
        if (dir === "DOWN") {
            comp = Constants_1.downComp;
        }
        return this.produceMultiSort(keyList, comp);
    }
    produceMultiSort(keyList, comp) {
        let orderKey = keyList[0];
        if (keyList.length === 1) {
            return (curr, other) => {
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
        return (curr, other) => {
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
exports.QuerySortGenerator = QuerySortGenerator;
//# sourceMappingURL=QuerySortGenerator.js.map