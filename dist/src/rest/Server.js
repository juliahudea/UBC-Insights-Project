"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const InsightFacade_1 = __importDefault(require("../controller/InsightFacade"));
const IInsightFacade_1 = require("../controller/IInsightFacade");
class Server {
    port;
    express;
    server;
    constructor(port) {
        console.info(`Server::<init>( ${port} )`);
        this.port = port;
        this.express = (0, express_1.default)();
        this.registerMiddleware();
        this.registerRoutes();
        this.express.use(express_1.default.static("./frontend/public"));
    }
    start() {
        return new Promise((resolve, reject) => {
            console.info("Server::start() - start");
            if (this.server !== undefined) {
                console.error("Server::start() - server already listening");
                reject();
            }
            else {
                this.server = this.express.listen(this.port, () => {
                    console.info(`Server::start() - server listening on port: ${this.port}`);
                    resolve();
                }).on("error", (err) => {
                    console.error(`Server::start() - server ERROR: ${err.message}`);
                    reject(err);
                });
            }
        });
    }
    stop() {
        console.info("Server::stop()");
        return new Promise((resolve, reject) => {
            if (this.server === undefined) {
                console.error("Server::stop() - ERROR: server not started");
                reject();
            }
            else {
                this.server.close(() => {
                    console.info("Server::stop() - server closed");
                    resolve();
                });
            }
        });
    }
    registerMiddleware() {
        this.express.use(express_1.default.json());
        this.express.use(express_1.default.raw({ type: "application/*", limit: "10mb" }));
        this.express.use((0, cors_1.default)());
    }
    registerRoutes() {
        this.express.get("/echo/:msg", Server.echo);
        let facade = new InsightFacade_1.default();
        this.express.post("/query", async (request, response) => {
            await Server.executeQuery(facade, request, response);
        });
        this.express.put("/dataset/:id/:kind", async (request, response) => {
            await Server.executeAddDataset(facade, request, response);
        });
        this.express.get("/datasets", async (request, response) => {
            await Server.executeListDatasets(facade, request, response);
        });
        this.express.delete("/dataset/:id", async (request, response) => {
            await Server.executeRemoveDataset(facade, request, response);
        });
    }
    static echo(req, res) {
        try {
            console.log(`Server::echo(..) - params: ${JSON.stringify(req.params)}`);
            const response = Server.performEcho(req.params.msg);
            res.status(200).json({ result: response });
        }
        catch (err) {
            res.status(400).json({ error: err });
        }
    }
    static async executeQuery(facade, request, response) {
        try {
            let queryResult = await facade.performQuery(request.body);
            response.status(200).json({ result: queryResult });
        }
        catch (e) {
            response.status(400).json({ error: e.message });
        }
    }
    static async executeAddDataset(facade, request, response) {
        let content = request.body.fileData;
        try {
            let kindsMap = { rooms: IInsightFacade_1.InsightDatasetKind.Rooms, sections: IInsightFacade_1.InsightDatasetKind.Sections };
            let kind = kindsMap[request.params.kind];
            if (!kind) {
                throw new Error("Bad Kind");
            }
            let addDatasetResult = await facade.addDataset(request.params.id, content, kind);
            response.status(200).json({ result: addDatasetResult });
        }
        catch (e) {
            response.status(400).json({ error: e.message });
        }
    }
    static async executeListDatasets(facade, request, response) {
        let listDatasetResult = await facade.listDatasets();
        response.status(200).json({ result: listDatasetResult });
    }
    static async executeRemoveDataset(facade, request, response) {
        try {
            let removeDatasetResult = await facade.removeDataset(request.params.id);
            response.status(200).json({ result: removeDatasetResult });
        }
        catch (e) {
            if (e instanceof IInsightFacade_1.NotFoundError) {
                response.status(404).json({ error: e.message });
            }
            else {
                response.status(400).json({ error: e.message });
            }
        }
    }
    static performEcho(msg) {
        if (typeof msg !== "undefined" && msg !== null) {
            return `${msg}...${msg}`;
        }
        else {
            return "Message not provided";
        }
    }
}
exports.default = Server;
//# sourceMappingURL=Server.js.map