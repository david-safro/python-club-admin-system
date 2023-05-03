"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const Table = require("cli-table");
const command_1 = require("../command");
const logger_1 = require("../logger");
const projectUtils_1 = require("../projectUtils");
const secretManager_1 = require("../gcp/secretManager");
const requirePermissions_1 = require("../requirePermissions");
exports.command = new command_1.Command("functions:secrets:get <KEY>")
    .description("Get metadata for secret and its versions")
    .before(requirePermissions_1.requirePermissions, ["secretmanager.secrets.get"])
    .action(async (key, options) => {
    const projectId = (0, projectUtils_1.needProjectId)(options);
    const versions = await (0, secretManager_1.listSecretVersions)(projectId, key);
    const table = new Table({
        head: ["Version", "State"],
        style: { head: ["yellow"] },
    });
    for (const version of versions) {
        table.push([version.versionId, version.state]);
    }
    logger_1.logger.info(table.toString());
});
