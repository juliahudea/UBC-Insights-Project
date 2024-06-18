"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringToHashString = exports.checkDirName = exports.removeData = exports.getData = exports.addData = exports.writeMetadata = exports.unzipFile = exports.loadMetaData = void 0;
const IInsightFacade_1 = require("./IInsightFacade");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const jszip_1 = __importDefault(require("jszip"));
async function loadMetaData() {
    try {
        if (!await fs.pathExists(path.join(__dirname, "../../data/data.json"))) {
            return Promise.reject(new IInsightFacade_1.InsightError("No datasets to load"));
        }
    }
    catch (e) {
        return Promise.reject(e);
    }
    let loadedDatasets = await fs.readFile(path.join(__dirname, "../../data/data.json"), "utf8").catch((err) => {
        return Promise.reject(new IInsightFacade_1.InsightError("Failed to read dataset from file"));
    });
    return Promise.resolve(JSON.parse(loadedDatasets));
}
exports.loadMetaData = loadMetaData;
async function unzipFile(content) {
    const jszip = new jszip_1.default();
    let unzippedFile = await jszip.loadAsync(content, { base64: true }).catch((error) => {
        return Promise.reject(new IInsightFacade_1.InsightError("Not a zip file"));
    });
    return Promise.resolve(unzippedFile);
}
exports.unzipFile = unzipFile;
function checkDirName(file) {
    let counter = 0;
    file.forEach((filePath, filter) => {
        if (filePath.split("/", 1)[0] === "courses" || filePath.split("/", 1)[0] === "campus") {
            counter++;
        }
    });
    return (counter > 0);
}
exports.checkDirName = checkDirName;
async function writeMetadata(datasets) {
    let result;
    let dataResult = [];
    try {
        const storageDir = path.join(__dirname, "../../data");
        const storagePath = path.join(__dirname, "../../data/data.json");
        const dataToWrite = JSON.stringify(datasets);
        try {
            result = await fs.pathExists(storageDir);
            if (!result) {
                result = await fs.mkdir(storageDir);
            }
        }
        catch (e) {
            return Promise.reject(e);
        }
        result = await fs.writeFile(storagePath, dataToWrite, "utf8");
    }
    catch (error) {
        return Promise.reject(new IInsightFacade_1.InsightError("Failed to write dataset to file"));
    }
}
exports.writeMetadata = writeMetadata;
async function addData(id, data) {
    const storageDir = path.join(__dirname, "../../data/data");
    const storagePath = path.join(__dirname, `../../data/data/${stringToHashString(id)}.json`);
    try {
        if (!await fs.pathExists(storageDir)) {
            await fs.mkdir(storageDir);
        }
    }
    catch (e) {
        return Promise.reject(e);
    }
    await fs.outputJSON(storagePath, { data: data });
    return Promise.resolve(true);
}
exports.addData = addData;
async function getData(id) {
    const storageDir = path.join(__dirname, "../../data/data");
    const storedPath = path.join(__dirname, `../../data/data/${stringToHashString(id)}.json`);
    try {
        if (!await fs.pathExists(storageDir)) {
            await fs.mkdir(storageDir);
        }
    }
    catch (e) {
        return Promise.reject(e);
    }
    let data = [];
    try {
        data = await fs.readJson(storedPath);
    }
    catch (e) {
        return Promise.reject(e);
    }
    return Promise.resolve(data["data"]);
}
exports.getData = getData;
async function removeData(id) {
    const storageDir = path.join(__dirname, "../../data/data");
    const storedPath = path.join(__dirname, `../../data/data/${stringToHashString(id)}.json`);
    try {
        if (!await fs.pathExists(storageDir)) {
            await fs.mkdir(storageDir);
        }
    }
    catch (e) {
        return Promise.reject(e);
    }
    await fs.remove(storedPath);
    return Promise.resolve(true);
}
exports.removeData = removeData;
function stringToHashString(name) {
    let hash = "";
    if (!name.length) {
        return hash;
    }
    for (const char of name) {
        hash = hash.concat(char.charCodeAt(0).toString(16)).concat("_");
    }
    return hash;
}
exports.stringToHashString = stringToHashString;
//# sourceMappingURL=LoadHelperFunctions.js.map