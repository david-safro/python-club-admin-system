"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const clc = require("colorette");
const Table = require("cli-table");
const command_1 = require("../command");
const error_1 = require("../error");
const utils_1 = require("../utils");
const extensionsApi_1 = require("../extensions/extensionsApi");
const logger_1 = require("../logger");
const extensionsHelper_1 = require("../extensions/extensionsHelper");
const requireAuth_1 = require("../requireAuth");
const extensionsUtils = require("../extensions/utils");
exports.command = new command_1.Command("ext:dev:list <publisherId>")
    .description("list all published extensions associated with this publisher ID")
    .before(requireAuth_1.requireAuth)
    .action(async (publisherId) => {
    let extensions;
    try {
        extensions = await (0, extensionsApi_1.listExtensions)(publisherId);
    }
    catch (err) {
        throw new error_1.FirebaseError(err);
    }
    if (extensions.length < 1) {
        throw new error_1.FirebaseError(`There are no published extensions associated with publisher ID ${clc.bold(publisherId)}. This could happen for two reasons:\n` +
            "  - The publisher ID doesn't exist or could be misspelled\n" +
            "  - This publisher has not published any extensions\n\n" +
            "If you are expecting some extensions to appear, please make sure you have the correct publisher ID and try again.");
    }
    const table = new Table({
        head: ["Extension ID", "Version", "Published"],
        style: { head: ["yellow"] },
    });
    const sorted = extensions.sort((a, b) => new Date(b.createTime).valueOf() - new Date(a.createTime).valueOf());
    sorted.forEach((extension) => {
        table.push([
            (0, utils_1.last)(extension.ref.split("/")),
            extension.latestVersion,
            extension.createTime ? extensionsUtils.formatTimestamp(extension.createTime) : "",
        ]);
    });
    (0, utils_1.logLabeledBullet)(extensionsHelper_1.logPrefix, `list of published extensions for publisher ${clc.bold(publisherId)}:`);
    logger_1.logger.info(table.toString());
    return { extensions: sorted };
});
