"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const command_1 = require("../command");
const Table = require("cli-table");
const clc = require("colorette");
const ora = require("ora");
const logger_1 = require("../logger");
const requirePermissions_1 = require("../requirePermissions");
const projectUtils_1 = require("../projectUtils");
const firedata = require("../gcp/firedata");
const types_1 = require("../emulator/types");
const commandUtils_1 = require("../emulator/commandUtils");
const experiments = require("../experiments");
const projectUtils_2 = require("../projectUtils");
const database_1 = require("../management/database");
function logInstances(instances) {
    if (instances.length === 0) {
        logger_1.logger.info(clc.bold("No database instances found."));
        return;
    }
    const tableHead = ["Database Instance Name", "Location", "Type", "State"];
    const table = new Table({ head: tableHead, style: { head: ["green"] } });
    instances.forEach((db) => {
        table.push([db.name, db.location, db.type, db.state]);
    });
    logger_1.logger.info(table.toString());
}
function logInstancesCount(count = 0) {
    if (count === 0) {
        return;
    }
    logger_1.logger.info("");
    logger_1.logger.info(`${count} database instance(s) total.`);
}
exports.command = new command_1.Command("database:instances:list")
    .description("list realtime database instances, optionally filtered by a specified location")
    .before(requirePermissions_1.requirePermissions, ["firebasedatabase.instances.list"])
    .before(commandUtils_1.warnEmulatorNotSupported, types_1.Emulators.DATABASE)
    .action(async (options) => {
    const location = (0, database_1.parseDatabaseLocation)(options.location, database_1.DatabaseLocation.ANY);
    const spinner = ora("Preparing the list of your Firebase Realtime Database instances" +
        `${location === database_1.DatabaseLocation.ANY ? "" : ` for location: ${location}`}`).start();
    let instances;
    if (experiments.isEnabled("rtdbmanagement")) {
        const projectId = (0, projectUtils_2.needProjectId)(options);
        try {
            instances = await (0, database_1.listDatabaseInstances)(projectId, location);
        }
        catch (err) {
            spinner.fail();
            throw err;
        }
        spinner.succeed();
        logInstances(instances);
        logInstancesCount(instances.length);
        return instances;
    }
    const projectNumber = await (0, projectUtils_1.needProjectNumber)(options);
    try {
        instances = await firedata.listDatabaseInstances(projectNumber);
    }
    catch (err) {
        spinner.fail();
        throw err;
    }
    spinner.succeed();
    for (const instance of instances) {
        logger_1.logger.info(instance.instance);
    }
    logger_1.logger.info(`Project ${options.project} has ${instances.length} database instances`);
    return instances;
});
if (experiments.isEnabled("rtdbmanagement")) {
    exports.command = exports.command.option("-l, --location <location>", "(optional) location for the database instance, defaults to us-central1");
}
