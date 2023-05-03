"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const command_1 = require("../command");
const logger_1 = require("../logger");
const projectUtils_1 = require("../projectUtils");
const secretManager_1 = require("../gcp/secretManager");
exports.command = new command_1.Command("functions:secrets:access <KEY>[@version]")
    .description("Access secret value given secret and its version. Defaults to accessing the latest version.")
    .action(async (key, options) => {
    const projectId = (0, projectUtils_1.needProjectId)(options);
    let [name, version] = key.split("@");
    if (!version) {
        version = "latest";
    }
    const value = await (0, secretManager_1.accessSecretVersion)(projectId, name, version);
    logger_1.logger.info(value);
});
