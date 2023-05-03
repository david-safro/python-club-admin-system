"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSystemParam = exports.readEnvFile = exports.promptForNewParams = exports.getParamsForUpdate = exports.getParams = exports.getParamsWithCurrentValuesAsDefaults = exports.setNewDefaults = exports.buildBindingOptionsWithBaseValue = exports.getBaseParamBindings = void 0;
const path = require("path");
const clc = require("colorette");
const fs = require("fs-extra");
const error_1 = require("../error");
const logger_1 = require("../logger");
const extensionsHelper_1 = require("./extensionsHelper");
const askUserForParam = require("./askUserForParam");
const track_1 = require("../track");
const env = require("../functions/env");
const utils_1 = require("../utils");
const NONINTERACTIVE_ERROR_MESSAGE = "As of firebase-tools@11, `ext:install`, `ext:update` and `ext:configure` are interactive only commands. " +
    "To deploy an extension noninteractively, use an extensions manifest and `firebase deploy --only extensions`.  " +
    "See https://firebase.google.com/docs/extensions/manifest for more details";
function getBaseParamBindings(params) {
    let ret = {};
    for (const [k, v] of Object.entries(params)) {
        ret = Object.assign(Object.assign({}, ret), { [k]: v.baseValue });
    }
    return ret;
}
exports.getBaseParamBindings = getBaseParamBindings;
function buildBindingOptionsWithBaseValue(baseParams) {
    let paramOptions = {};
    for (const [k, v] of Object.entries(baseParams)) {
        paramOptions = Object.assign(Object.assign({}, paramOptions), { [k]: { baseValue: v } });
    }
    return paramOptions;
}
exports.buildBindingOptionsWithBaseValue = buildBindingOptionsWithBaseValue;
function setNewDefaults(params, newDefaults) {
    params.forEach((param) => {
        if (newDefaults[param.param.toUpperCase()]) {
            param.default = newDefaults[param.param.toUpperCase()];
        }
    });
    return params;
}
exports.setNewDefaults = setNewDefaults;
function getParamsWithCurrentValuesAsDefaults(extensionInstance) {
    var _a, _b, _c, _d;
    const specParams = (0, utils_1.cloneDeep)(((_c = (_b = (_a = extensionInstance === null || extensionInstance === void 0 ? void 0 : extensionInstance.config) === null || _a === void 0 ? void 0 : _a.source) === null || _b === void 0 ? void 0 : _b.spec) === null || _c === void 0 ? void 0 : _c.params) || []);
    const currentParams = (0, utils_1.cloneDeep)(((_d = extensionInstance === null || extensionInstance === void 0 ? void 0 : extensionInstance.config) === null || _d === void 0 ? void 0 : _d.params) || {});
    return setNewDefaults(specParams, currentParams);
}
exports.getParamsWithCurrentValuesAsDefaults = getParamsWithCurrentValuesAsDefaults;
async function getParams(args) {
    let params;
    if (args.nonInteractive) {
        throw new error_1.FirebaseError(NONINTERACTIVE_ERROR_MESSAGE);
    }
    else {
        const firebaseProjectParams = await (0, extensionsHelper_1.getFirebaseProjectParams)(args.projectId);
        params = await askUserForParam.ask({
            projectId: args.projectId,
            instanceId: args.instanceId,
            paramSpecs: args.paramSpecs,
            firebaseProjectParams,
            reconfiguring: !!args.reconfiguring,
        });
    }
    const paramNames = Object.keys(params);
    void (0, track_1.track)("Extension Params", paramNames.length ? "Not Present" : "Present", paramNames.length);
    return params;
}
exports.getParams = getParams;
async function getParamsForUpdate(args) {
    let params;
    if (args.nonInteractive) {
        throw new error_1.FirebaseError(NONINTERACTIVE_ERROR_MESSAGE);
    }
    else {
        params = await promptForNewParams({
            spec: args.spec,
            newSpec: args.newSpec,
            currentParams: args.currentParams,
            projectId: args.projectId,
            instanceId: args.instanceId,
        });
    }
    const paramNames = Object.keys(params);
    void (0, track_1.track)("Extension Params", paramNames.length ? "Not Present" : "Present", paramNames.length);
    return params;
}
exports.getParamsForUpdate = getParamsForUpdate;
async function promptForNewParams(args) {
    const newParamBindingOptions = buildBindingOptionsWithBaseValue(args.currentParams);
    const firebaseProjectParams = await (0, extensionsHelper_1.getFirebaseProjectParams)(args.projectId);
    const sameParam = (param1) => (param2) => {
        return param1.type === param2.type && param1.param === param2.param;
    };
    const paramDiff = (left, right) => {
        return left.filter((aLeft) => !right.find(sameParam(aLeft)));
    };
    const oldParams = args.spec.params.filter((p) => Object.keys(args.currentParams).includes(p.param));
    let paramsDiffDeletions = paramDiff(oldParams, args.newSpec.params);
    paramsDiffDeletions = (0, extensionsHelper_1.substituteParams)(paramsDiffDeletions, firebaseProjectParams);
    let paramsDiffAdditions = paramDiff(args.newSpec.params, oldParams);
    paramsDiffAdditions = (0, extensionsHelper_1.substituteParams)(paramsDiffAdditions, firebaseProjectParams);
    if (paramsDiffDeletions.length) {
        logger_1.logger.info("The following params will no longer be used:");
        for (const param of paramsDiffDeletions) {
            logger_1.logger.info(clc.red(`- ${param.param}: ${args.currentParams[param.param.toUpperCase()]}`));
            delete newParamBindingOptions[param.param.toUpperCase()];
        }
    }
    if (paramsDiffAdditions.length) {
        logger_1.logger.info("To update this instance, configure the following new parameters:");
        for (const param of paramsDiffAdditions) {
            const chosenValue = await askUserForParam.askForParam({
                projectId: args.projectId,
                instanceId: args.instanceId,
                paramSpec: param,
                reconfiguring: false,
            });
            newParamBindingOptions[param.param] = chosenValue;
        }
    }
    return newParamBindingOptions;
}
exports.promptForNewParams = promptForNewParams;
function readEnvFile(envPath) {
    const buf = fs.readFileSync(path.resolve(envPath), "utf8");
    const result = env.parse(buf.toString().trim());
    if (result.errors.length) {
        throw new error_1.FirebaseError(`Error while parsing ${envPath} - unable to parse following lines:\n${result.errors.join("\n")}`);
    }
    return result.envs;
}
exports.readEnvFile = readEnvFile;
function isSystemParam(paramName) {
    const regex = /^firebaseextensions\.[a-zA-Z0-9\.]*\//;
    return regex.test(paramName);
}
exports.isSystemParam = isSystemParam;
