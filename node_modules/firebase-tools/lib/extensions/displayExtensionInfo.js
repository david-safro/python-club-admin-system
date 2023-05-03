"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.retrieveRoleInfo = exports.printSourceDownloadLink = exports.displayExtInfo = void 0;
const clc = require("colorette");
const marked_1 = require("marked");
const TerminalRenderer = require("marked-terminal");
const utils = require("../utils");
const extensionsHelper_1 = require("./extensionsHelper");
const logger_1 = require("../logger");
const error_1 = require("../error");
const types_1 = require("./types");
const iam = require("../gcp/iam");
const secretsUtils_1 = require("./secretsUtils");
marked_1.marked.setOptions({
    renderer: new TerminalRenderer(),
});
const TASKS_ROLE = "cloudtasks.enqueuer";
const TASKS_API = "cloudtasks.googleapis.com";
async function displayExtInfo(extensionName, publisher, spec, published = false) {
    const lines = [];
    lines.push(`**Name**: ${spec.displayName}`);
    if (publisher) {
        lines.push(`**Publisher**: ${publisher}`);
    }
    if (spec.description) {
        lines.push(`**Description**: ${spec.description}`);
    }
    if (published) {
        if (spec.license) {
            lines.push(`**License**: ${spec.license}`);
        }
        if (spec.sourceUrl) {
            lines.push(`**Source code**: ${spec.sourceUrl}`);
        }
    }
    const apis = impliedApis(spec);
    if (apis.length) {
        lines.push(displayApis(apis));
    }
    const roles = impliedRoles(spec);
    if (roles.length) {
        lines.push(await displayRoles(roles));
    }
    if (lines.length > 0) {
        utils.logLabeledBullet(extensionsHelper_1.logPrefix, `information about '${clc.bold(extensionName)}':`);
        const infoStr = lines.join("\n");
        const formatted = (0, marked_1.marked)(infoStr).replace(/\n+$/, "\n");
        logger_1.logger.info(formatted);
        return lines;
    }
    else {
        throw new error_1.FirebaseError("Error occurred during installation: cannot parse info from source spec", {
            context: {
                spec: spec,
                extensionName: extensionName,
            },
        });
    }
}
exports.displayExtInfo = displayExtInfo;
function printSourceDownloadLink(sourceDownloadUri) {
    const sourceDownloadMsg = `Want to review the source code that will be installed? Download it here: ${sourceDownloadUri}`;
    utils.logBullet((0, marked_1.marked)(sourceDownloadMsg));
}
exports.printSourceDownloadLink = printSourceDownloadLink;
async function retrieveRoleInfo(role) {
    const res = await iam.getRole(role);
    return `  ${res.title} (${res.description})`;
}
exports.retrieveRoleInfo = retrieveRoleInfo;
async function displayRoles(roles) {
    const lines = await Promise.all(roles.map((role) => {
        return retrieveRoleInfo(role.role);
    }));
    return clc.bold("**Roles granted to this Extension**:\n") + lines.join("\n");
}
function displayApis(apis) {
    const lines = apis.map((api) => {
        return `  ${api.apiName} (${api.reason})`;
    });
    return "**APIs used by this Extension**:\n" + lines.join("\n");
}
function usesTasks(spec) {
    return spec.resources.some((r) => { var _a; return r.type === types_1.FUNCTIONS_RESOURCE_TYPE && ((_a = r.properties) === null || _a === void 0 ? void 0 : _a.taskQueueTrigger) !== undefined; });
}
function impliedRoles(spec) {
    var _a, _b, _c;
    const roles = [];
    if ((0, secretsUtils_1.usesSecrets)(spec) && !((_a = spec.roles) === null || _a === void 0 ? void 0 : _a.some((r) => r.role === secretsUtils_1.SECRET_ROLE))) {
        roles.push({
            role: secretsUtils_1.SECRET_ROLE,
            reason: "Allows the extension to read secret values from Cloud Secret Manager",
        });
    }
    if (usesTasks(spec) && !((_b = spec.roles) === null || _b === void 0 ? void 0 : _b.some((r) => r.role === TASKS_ROLE))) {
        roles.push({
            role: TASKS_ROLE,
            reason: "Allows the extension to enqueue Cloud Tasks",
        });
    }
    return roles.concat((_c = spec.roles) !== null && _c !== void 0 ? _c : []);
}
function impliedApis(spec) {
    var _a, _b;
    const apis = [];
    if (usesTasks(spec) && !((_a = spec.apis) === null || _a === void 0 ? void 0 : _a.some((a) => a.apiName === TASKS_API))) {
        apis.push({
            apiName: TASKS_API,
            reason: "Allows the extension to enqueue Cloud Tasks",
        });
    }
    return apis.concat((_b = spec.apis) !== null && _b !== void 0 ? _b : []);
}
