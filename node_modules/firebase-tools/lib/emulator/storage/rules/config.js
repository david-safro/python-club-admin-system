"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStorageRulesConfig = void 0;
const error_1 = require("../../../error");
const fsutils_1 = require("../../../fsutils");
const constants_1 = require("../../constants");
const types_1 = require("../../types");
const emulatorLogger_1 = require("../../emulatorLogger");
function getSourceFile(rules, options) {
    const path = options.config.path(rules);
    return { name: path, content: (0, fsutils_1.readFile)(path) };
}
function getStorageRulesConfig(projectId, options) {
    const storageConfig = options.config.data.storage;
    if (!storageConfig) {
        if (constants_1.Constants.isDemoProject(projectId)) {
            const storageLogger = emulatorLogger_1.EmulatorLogger.forEmulator(types_1.Emulators.STORAGE);
            storageLogger.logLabeled("BULLET", "storage", `Detected demo project ID "${projectId}", using a default (open) rules configuration.`);
            const path = __dirname + "/../../../../templates/emulators/default_storage.rules";
            return { name: path, content: (0, fsutils_1.readFile)(path) };
        }
        throw new error_1.FirebaseError("Cannot start the Storage emulator without rules file specified in firebase.json: run 'firebase init' and set up your Storage configuration");
    }
    if (!Array.isArray(storageConfig)) {
        if (!storageConfig.rules) {
            throw new error_1.FirebaseError("Cannot start the Storage emulator without rules file specified in firebase.json: run 'firebase init' and set up your Storage configuration");
        }
        return getSourceFile(storageConfig.rules, options);
    }
    const results = [];
    const { rc } = options;
    for (const targetConfig of storageConfig) {
        if (!targetConfig.target) {
            throw new error_1.FirebaseError("Must supply 'target' in Storage configuration");
        }
        rc.requireTarget(projectId, "storage", targetConfig.target);
        rc.target(projectId, "storage", targetConfig.target).forEach((resource) => {
            results.push({ resource, rules: getSourceFile(targetConfig.rules, options) });
        });
    }
    return results;
}
exports.getStorageRulesConfig = getStorageRulesConfig;
