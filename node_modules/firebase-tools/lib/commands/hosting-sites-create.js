"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const colorette_1 = require("colorette");
const utils_1 = require("../utils");
const command_1 = require("../command");
const api_1 = require("../hosting/api");
const prompt_1 = require("../prompt");
const error_1 = require("../error");
const requirePermissions_1 = require("../requirePermissions");
const projectUtils_1 = require("../projectUtils");
const logger_1 = require("../logger");
const LOG_TAG = "hosting:sites";
exports.command = new command_1.Command("hosting:sites:create [siteId]")
    .description("create a Firebase Hosting site")
    .option("--app <appId>", "specify an existing Firebase Web App ID")
    .before(requirePermissions_1.requirePermissions, ["firebasehosting.sites.update"])
    .action(async (siteId, options) => {
    const projectId = (0, projectUtils_1.needProjectId)(options);
    const appId = options.app;
    if (!siteId) {
        if (options.nonInteractive) {
            throw new error_1.FirebaseError(`"siteId" argument must be provided in a non-interactive environment`);
        }
        siteId = await (0, prompt_1.promptOnce)({
            type: "input",
            message: "Please provide an unique, URL-friendly id for the site (<id>.web.app):",
            validate: (s) => s.length > 0,
        });
    }
    if (!siteId) {
        throw new error_1.FirebaseError(`"siteId" must not be empty`);
    }
    let site;
    try {
        site = await (0, api_1.createSite)(projectId, siteId, appId);
    }
    catch (e) {
        if (e.status === 409) {
            throw new error_1.FirebaseError(`Site ${(0, colorette_1.bold)(siteId)} already exists in project ${(0, colorette_1.bold)(projectId)}.`, { original: e });
        }
        throw e;
    }
    logger_1.logger.info();
    (0, utils_1.logLabeledSuccess)(LOG_TAG, `Site ${(0, colorette_1.bold)(siteId)} has been created in project ${(0, colorette_1.bold)(projectId)}.`);
    if (appId) {
        (0, utils_1.logLabeledSuccess)(LOG_TAG, `Site ${(0, colorette_1.bold)(siteId)} has been linked to web app ${(0, colorette_1.bold)(appId)}`);
    }
    (0, utils_1.logLabeledSuccess)(LOG_TAG, `Site URL: ${site.defaultUrl}`);
    logger_1.logger.info();
    logger_1.logger.info(`To deploy to this site, follow the guide at https://firebase.google.com/docs/hosting/multisites.`);
    return site;
});
