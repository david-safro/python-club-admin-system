"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultHostingSite = void 0;
const logger_1 = require("./logger");
const projects_1 = require("./management/projects");
const projectUtils_1 = require("./projectUtils");
async function getDefaultHostingSite(options) {
    var _a;
    const projectId = (0, projectUtils_1.needProjectId)(options);
    const project = await (0, projects_1.getFirebaseProject)(projectId);
    const site = (_a = project.resources) === null || _a === void 0 ? void 0 : _a.hostingSite;
    if (!site) {
        logger_1.logger.debug(`No default hosting site found for project: ${options.project}. Using projectId as hosting site name.`);
        return options.project;
    }
    return site;
}
exports.getDefaultHostingSite = getDefaultHostingSite;
