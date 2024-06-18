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
exports.getRooms = exports.getBuildings = exports.isTableValid = exports.getValidTable = exports.getTableRows = exports.getRoom = exports.isValidRoom = exports.parseRooms = exports.addRoomDataset = void 0;
const IInsightFacade_1 = require("./IInsightFacade");
const Room_1 = __importDefault(require("../model/Room"));
const parse5_1 = require("parse5");
const LoadHelperFunctions_1 = require("./LoadHelperFunctions");
const http = __importStar(require("node:http"));
async function addRoomDataset(content) {
    const file = await (0, LoadHelperFunctions_1.unzipFile)(content);
    let rooms = [];
    try {
        rooms = await parseRooms(file);
    }
    catch (e) {
        return Promise.reject(new IInsightFacade_1.InsightError(`Invalid content: ${e}`));
    }
    return Promise.resolve(rooms);
}
exports.addRoomDataset = addRoomDataset;
async function parseRooms(jszip) {
    let rooms = [];
    let buildings = [];
    let index = jszip.files["index.htm"];
    if (!index) {
        return Promise.reject(new IInsightFacade_1.InsightError("No index file found"));
    }
    let indexContent = (0, parse5_1.parse)(await index.async("string"));
    let buildingTable;
    try {
        buildingTable = await getValidTable(indexContent);
    }
    catch (e) {
        return Promise.reject(new IInsightFacade_1.InsightError("No valid building table found in index file"));
    }
    try {
        buildings = await getBuildings(buildingTable, jszip);
    }
    catch (e) {
        return Promise.reject(new IInsightFacade_1.InsightError(`Error getting buildings: ${e}`));
    }
    try {
        rooms = await getRoomsFromBuildings(buildings);
    }
    catch (e) {
        return Promise.reject(new IInsightFacade_1.InsightError(`Error getting rooms: ${e}`));
    }
    return Promise.resolve(rooms);
}
exports.parseRooms = parseRooms;
async function getRoomsFromBuildings(buildings) {
    let rooms = [];
    const roomPromises = buildings.map(async (building) => {
        let buildingRooms;
        try {
            buildingRooms = await getRooms(building);
        }
        catch (e) {
            buildingRooms = [];
        }
        rooms.push(...buildingRooms);
    });
    await Promise.all(roomPromises);
    if (rooms.length === 0) {
        return Promise.reject(new IInsightFacade_1.InsightError("No rooms found"));
    }
    else {
        return Promise.resolve(rooms);
    }
}
async function getValidTable(indexContent) {
    let tables = [];
    let nodes = indexContent.childNodes.slice();
    while (nodes.length !== 0) {
        let node = nodes.pop();
        if (node.nodeName === "table") {
            tables.push(node);
        }
        else if (node.childNodes !== undefined && node.childNodes.length !== 0) {
            for (let childNode of node.childNodes) {
                nodes.push(childNode);
            }
        }
    }
    let validTables = await Promise.all(tables.map(async function (table) {
        if (await isTableValid(table)) {
            return table;
        }
        else {
            return undefined;
        }
    }));
    let validTable = validTables.find((table) => table !== undefined);
    if (validTable !== undefined) {
        return Promise.resolve(validTable);
    }
    else {
        return Promise.reject(new IInsightFacade_1.InsightError("No valid table found"));
    }
}
exports.getValidTable = getValidTable;
async function isTableValid(table) {
    let valid = false;
    let nodes = table.childNodes.slice();
    while (nodes.length !== 0) {
        let node = nodes.pop();
        if (node !== undefined && node.nodeName === "td") {
            if (node.attrs !== undefined) {
                node.attrs.forEach(function (attribute) {
                    if (attribute.name === "class" && attribute.value.includes("views-field")) {
                        valid = true;
                        return valid;
                    }
                    return valid;
                });
            }
            break;
        }
        else if (node.childNodes !== undefined && node.childNodes.length !== 0) {
            for (let childNode of node.childNodes) {
                nodes.push(childNode);
            }
        }
    }
    return Promise.resolve(valid);
}
exports.isTableValid = isTableValid;
async function getBuildings(buildingTable, jszip) {
    let buildings = await getBuildingsFromTable(buildingTable, jszip);
    if (buildings.length === 0) {
        return Promise.reject(new IInsightFacade_1.InsightError("No buildings found in table"));
    }
    let validBuildings = [];
    const buildingPromises = buildings.map(async (building) => {
        let file = jszip.files[building.file];
        if (file !== undefined) {
            building.file = (0, parse5_1.parse)(await file.async("string"));
            validBuildings.push(building);
        }
    });
    await Promise.all(buildingPromises);
    if (validBuildings.length === 0) {
        return Promise.reject(new IInsightFacade_1.InsightError("No building files found"));
    }
    else {
        return Promise.resolve(buildings);
    }
}
exports.getBuildings = getBuildings;
async function getBuildingsFromTable(buildingTable, jszip) {
    let buildings = [];
    let buildingRows = await getTableRows(buildingTable);
    while (buildingRows.length !== 0) {
        let row = buildingRows.pop();
        let building = {
            fullname: "",
            shortname: "",
            address: "",
            file: "",
        };
        let cells = row.childNodes.slice();
        while (cells.length !== 0) {
            let cell = cells.pop();
            if (cell !== undefined && cell.nodeName === "td") {
                if (cell.attrs !== undefined) {
                    cell.attrs.forEach(function (attribute) {
                        if (attribute.name === "class") {
                            switch (attribute.value) {
                                case "views-field views-field-field-building-code":
                                    building.shortname = cell.childNodes[0].value.trim();
                                    break;
                                case "views-field views-field-title":
                                    building.fullname = cell.childNodes[1].childNodes[0].value;
                                    building.file = cell.childNodes[1].attrs[0].value.slice(2);
                                    break;
                                case "views-field views-field-field-building-address":
                                    building.address = cell.childNodes[0].value.trim();
                                    break;
                            }
                        }
                    });
                }
            }
            else if (cell.childNodes !== undefined && cell.childNodes.length !== 0) {
                for (let childNode of cell.childNodes) {
                    cells.push(childNode);
                }
            }
        }
        buildings.push(building);
    }
    return Promise.resolve(buildings);
}
async function getRooms(building) {
    let geolocation = {};
    try {
        geolocation = await getGeolocation(building.address);
    }
    catch (e) {
        return Promise.reject(new IInsightFacade_1.InsightError("Geolocation Sever Issue"));
    }
    let roomTable;
    try {
        roomTable = await getValidTable(building.file);
    }
    catch (e) {
        return Promise.reject(new IInsightFacade_1.InsightError("No valid room table found"));
    }
    let rows = await getTableRows(roomTable);
    let rooms = [];
    const roomPromises = rows.map(async (row) => {
        let room = await getRoom(row);
        room.address = building.address;
        room.fullname = building.fullname;
        room.shortname = building.shortname;
        room.name = room.shortname + "_" + room.number;
        room.lat = geolocation.lat;
        room.lon = geolocation.lon;
        if (await isValidRoom(room)) {
            rooms.push(room);
        }
    });
    const roomResults = await Promise.all(roomPromises);
    if (rooms.length === 0) {
        return Promise.reject(new IInsightFacade_1.InsightError("No valid rooms found"));
    }
    else {
        return Promise.resolve(rooms);
    }
}
exports.getRooms = getRooms;
async function getRoom(row) {
    let room = new Room_1.default(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined);
    let cells = row.childNodes.slice();
    while (cells.length !== 0) {
        let cell = cells.pop();
        if (cell !== undefined && cell.nodeName === "td") {
            if (cell.attrs !== undefined) {
                cell.attrs.forEach(function (attribute) {
                    if (attribute.name === "class") {
                        switch (attribute.value) {
                            case "views-field views-field-field-room-number":
                                room.number = cell.childNodes[1].childNodes[0].value;
                                break;
                            case "views-field views-field-field-room-capacity":
                                room.seats = Number(cell.childNodes[0].value.trim());
                                break;
                            case "views-field views-field-field-room-furniture":
                                room.furniture = cell.childNodes[0].value.trim();
                                break;
                            case "views-field views-field-field-room-type":
                                room.type = cell.childNodes[0].value.trim();
                                break;
                            case "views-field views-field-nothing":
                                room.href = cell.childNodes[1].attrs[0].value;
                                break;
                        }
                    }
                });
            }
            else if (cell.childNodes !== undefined && cell.childNodes.length !== 0) {
                for (let childNode of cell.childNodes) {
                    cells.push(childNode);
                }
            }
        }
    }
    return Promise.resolve(room);
}
exports.getRoom = getRoom;
async function isValidRoom(room) {
    if (room.fullname === undefined ||
        room.shortname === undefined ||
        room.number === undefined ||
        room.name === undefined ||
        room.address === undefined ||
        room.seats === undefined ||
        room.type === undefined ||
        room.furniture === undefined ||
        room.href === undefined) {
        return Promise.resolve(false);
    }
    return Promise.resolve(true);
}
exports.isValidRoom = isValidRoom;
async function getTableRows(table) {
    let rows = [];
    let nodes = table.childNodes.slice();
    while (nodes.length > 0) {
        let node = nodes.pop();
        if (node !== undefined && node.nodeName === "tr") {
            rows.push(node);
        }
        else if (node.childNodes !== undefined && node.childNodes.length > 0) {
            for (let childNode of node.childNodes) {
                nodes.push(childNode);
            }
        }
    }
    return Promise.resolve(rows);
}
exports.getTableRows = getTableRows;
async function getGeolocation(address) {
    return new Promise((resolve, reject) => {
        const url = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team062/" + encodeURI(address);
        http.get(url, (res) => {
            let data = "";
            res.on("data", (chunk) => {
                data += chunk;
            });
            res.on("end", () => {
                let geolocation = JSON.parse(data);
                resolve(geolocation);
            });
        }).on("error", (err) => {
            reject(err);
        });
    });
}
//# sourceMappingURL=RoomHelperFunctions.js.map