"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.downComp = exports.upComp = exports.filterKeys = exports.numbericApplyTokens = exports.applyTokens = exports.roomMFields = exports.roomSFields = exports.sectionMFields = exports.sectionSFields = void 0;
exports.sectionSFields = ["dept", "id", "instructor", "title", "uuid"];
exports.sectionMFields = ["avg", "pass", "fail", "audit", "year"];
exports.roomSFields = ["fullname", "shortname", "number", "name", "address", "type", "furniture", "href"];
exports.roomMFields = ["lat", "lon", "seats"];
exports.applyTokens = ["MAX", "MIN", "AVG", "COUNT", "SUM"];
exports.numbericApplyTokens = ["MAX", "MIN", "AVG", "SUM"];
exports.filterKeys = ["IS", "GT", "LT", "EQ", "NOT", "AND", "OR"];
const upComp = (a, b) => {
    return a > b;
};
exports.upComp = upComp;
const downComp = (a, b) => {
    return b > a;
};
exports.downComp = downComp;
//# sourceMappingURL=Constants.js.map