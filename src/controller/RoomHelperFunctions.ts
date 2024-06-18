import {InsightDataset, InsightError} from "./IInsightFacade";
import JSZip from "jszip";
import Room from "../model/Room";
import {parse} from "parse5";
import {unzipFile} from "./LoadHelperFunctions";
import * as http from "node:http";

async function addRoomDataset(content: string): Promise<Room[]> {
	const file = await unzipFile(content);
	let rooms: Room[] = [];

	try {
		rooms = await parseRooms(file);
	} catch (e) {
		return Promise.reject(new InsightError(`Invalid content: ${e}`));
	}

	// console.log(rooms);

	return Promise.resolve(rooms);
}

async function parseRooms(jszip: JSZip): Promise<Room[]> {
	let rooms: Room[] = [];
	let buildings: any[] = [];

	let index = jszip.files["index.htm"];
	// check that the index file exists
	if (!index) {
		return Promise.reject(new InsightError("No index file found"));
	}

	// parse the index content
	let indexContent: any = parse(await index.async("string"));

	// look for valid building table
	let buildingTable;
	try {
		buildingTable = await getValidTable(indexContent);
	} catch (e) {
		return Promise.reject(new InsightError("No valid building table found in index file"));
	}

	try {
		buildings = await getBuildings(buildingTable, jszip);
	} catch (e) {
		return Promise.reject(new InsightError(`Error getting buildings: ${e}`));
	}


	// iterate through the buildings list to get the building files
	try {
		rooms = await getRoomsFromBuildings(buildings);
	} catch (e) {
		return Promise.reject(new InsightError(`Error getting rooms: ${e}`));
	}

	return Promise.resolve(rooms);
}

async function getRoomsFromBuildings(buildings: any[]): Promise<Room[]> {
	let rooms: Room[] = [];

	const roomPromises = buildings.map(async (building) => {
		let buildingRooms: Room[];
		try {
			buildingRooms = await getRooms(building);
		} catch (e) {
			buildingRooms = [];
		}
		rooms.push(...buildingRooms);
	});

	await Promise.all(roomPromises);

	if (rooms.length === 0) {
		return Promise.reject(new InsightError("No rooms found"));
	} else {
		return Promise.resolve(rooms);
	}
}

async function getValidTable(indexContent: any): Promise<any> {
	let tables: any[] = [];

	let nodes = indexContent.childNodes.slice();

	// get all the tables from the index file (valid or not)
	while (nodes.length !== 0) {
		let node = nodes.pop();
		if (node.nodeName === "table") {
			tables.push(node);
		} else if (node.childNodes !== undefined && node.childNodes.length !== 0) {
			for (let childNode of node.childNodes) {
				nodes.push(childNode);
			}
		}
	}

	// check validity of each table
	let validTables = await Promise.all(tables.map(async function (table: any) {
		if (await isTableValid(table)) {
			return table;
		} else {
			return undefined;
		}
	}));

	let validTable = validTables.find((table) => table !== undefined);

	if (validTable !== undefined) {
		return Promise.resolve(validTable);
	} else {
		return Promise.reject(new InsightError("No valid table found"));
	}
}

async function isTableValid(table: any): Promise<boolean> {
	let valid: boolean = false;
	let nodes = table.childNodes.slice();

	while (nodes.length !== 0) {
		let node = nodes.pop();
		if (node !== undefined && node.nodeName === "td") {
			if (node.attrs !== undefined) {
				node.attrs.forEach(function (attribute: any) {
					if (attribute.name === "class" && attribute.value.includes("views-field")) {
						valid = true;
						return valid;
					}
					return valid;
				});
			}
			break; // if a valid class is found, break the loop
		} else if (node.childNodes !== undefined && node.childNodes.length !== 0) {
			for (let childNode of node.childNodes) {
				nodes.push(childNode);
			}
		}
	}
	return Promise.resolve(valid);
}

async function getBuildings(buildingTable: any, jszip: JSZip): Promise<any[]> {

	let buildings = await getBuildingsFromTable(buildingTable, jszip);

	if (buildings.length === 0) {
		return Promise.reject(new InsightError("No buildings found in table"));
	}

	let validBuildings: any[] = [];

	const buildingPromises = buildings.map(async (building) => {
		let file = jszip.files[building.file];
		if (file !== undefined) {
			building.file = parse(await file.async("string"));
			validBuildings.push(building);
		}
	});

	await Promise.all(buildingPromises);

	if (validBuildings.length === 0) {
		return Promise.reject(new InsightError("No building files found"));
	} else {
		return Promise.resolve(buildings);
	}
}

async function getBuildingsFromTable(buildingTable: any, jszip: JSZip): Promise<any[]> {
	let buildings: any[] = [];
	let buildingRows: any[] = await getTableRows(buildingTable);

	// iterate through the table rows
	while (buildingRows.length !== 0) {
		let row = buildingRows.pop();
		let building: any = {
			fullname: "",
			shortname: "",
			address: "",
			file: "",
		};
		// get cells from the table row
		let cells = row.childNodes.slice();

		while (cells.length !== 0) {
			let cell = cells.pop();
			if (cell !== undefined && cell.nodeName === "td") {
				if (cell.attrs !== undefined) {
					cell.attrs.forEach(function (attribute: any) {
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
			} else if (cell.childNodes !== undefined && cell.childNodes.length !== 0) {
				for (let childNode of cell.childNodes) {
					cells.push(childNode);
				}
			}
		}
		buildings.push(building);
	}
	return Promise.resolve(buildings);
}


async function getRooms(building: any): Promise<Room[]> {
	let geolocation: any = {};
	try {
		geolocation = await getGeolocation(building.address);
	} catch (e) {
		return Promise.reject(new InsightError("Geolocation Sever Issue"));
	}

	let roomTable: any;
	try {
		roomTable = await getValidTable(building.file);
	} catch (e) {
		return Promise.reject(new InsightError("No valid room table found"));
	}
	let rows: any[] = await getTableRows(roomTable);
	let rooms: Room[] = [];

	// iterate through the table rows and get a list of rooms
	const roomPromises = rows.map(async (row: any) => {
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
		return Promise.reject(new InsightError("No valid rooms found"));
	} else {
		return Promise.resolve(rooms);
	}
}

async function getRoom(row: any): Promise<Room> {
	let room: Room = new Room(undefined, undefined, undefined, undefined, undefined,
		undefined, undefined, undefined, undefined, undefined, undefined);
	let cells = row.childNodes.slice();
	while (cells.length !== 0) {
		let cell = cells.pop();
		if (cell !== undefined && cell.nodeName === "td") {
			if (cell.attrs !== undefined) {
				cell.attrs.forEach(function (attribute: any) {
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
			} else if (cell.childNodes !== undefined && cell.childNodes.length !== 0) {
				for (let childNode of cell.childNodes) {
					cells.push(childNode);
				}
			}
		}
	}

	return Promise.resolve(room);
}

async function isValidRoom(room: Room): Promise<boolean> {
	if (
		room.fullname === undefined ||
		room.shortname === undefined ||
		room.number === undefined ||
		room.name === undefined ||
		room.address === undefined ||
		room.seats === undefined ||
		room.type === undefined ||
		room.furniture === undefined ||
		room.href === undefined
	) {
		return Promise.resolve(false);
	}
	return Promise.resolve(true);
}

async function getTableRows(table: any): Promise<any[]> {
	let rows: any[] = [];
	let nodes = table.childNodes.slice();

	// get table rows from the building table body
	// this is currently missing the last row of the table
	while (nodes.length > 0) {
		let node = nodes.pop();
		if (node !== undefined && node.nodeName === "tr") {
			rows.push(node);
		} else if (node.childNodes !== undefined && node.childNodes.length > 0) {
			for (let childNode of node.childNodes) {
				nodes.push(childNode);
			}
		}
	}

	return Promise.resolve(rows);
}


async function getGeolocation(address: string) {
	return new Promise((resolve, reject) => {
		const url = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team062/" + encodeURI(address);

		http.get(url, (res: any) => {
			let data = "";

			// A chunk of data has been received.
			res.on("data", (chunk: any) => {
				data += chunk;
			});

			// The whole response has been received.
			res.on("end", () => {
				let geolocation = JSON.parse(data);
				resolve(geolocation);
			});

		}).on("error", (err: any) => {
			reject(err);
		});
	});
}

export {addRoomDataset, parseRooms,
	isValidRoom, getRoom, getTableRows, getValidTable, isTableValid, getBuildings, getRooms};
