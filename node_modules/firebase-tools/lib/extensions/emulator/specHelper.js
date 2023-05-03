"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRuntime = exports.DEFAULT_RUNTIME = exports.getFunctionProperties = exports.getFunctionResourcesWithParamSubstitution = exports.readFileFromDirectory = exports.readPostinstall = exports.readExtensionYaml = void 0;
const yaml = require("js-yaml");
const path = require("path");
const fs = require("fs-extra");
const error_1 = require("../../error");
const extensionsHelper_1 = require("../extensionsHelper");
const utils_1 = require("../utils");
const SPEC_FILE = "extension.yaml";
const POSTINSTALL_FILE = "POSTINSTALL.md";
const validFunctionTypes = [
    "firebaseextensions.v1beta.function",
    "firebaseextensions.v1beta.v2function",
    "firebaseextensions.v1beta.scheduledFunction",
];
function wrappedSafeLoad(source) {
    try {
        return yaml.safeLoad(source);
    }
    catch (err) {
        if (err instanceof yaml.YAMLException) {
            throw new error_1.FirebaseError(`YAML Error: ${err.message}`, { original: err });
        }
        throw err;
    }
}
async function readExtensionYaml(directory) {
    const extensionYaml = await readFileFromDirectory(directory, SPEC_FILE);
    const source = extensionYaml.source;
    return wrappedSafeLoad(source);
}
exports.readExtensionYaml = readExtensionYaml;
async function readPostinstall(directory) {
    const content = await readFileFromDirectory(directory, POSTINSTALL_FILE);
    return content.source;
}
exports.readPostinstall = readPostinstall;
function readFileFromDirectory(directory, file) {
    return new Promise((resolve, reject) => {
        fs.readFile(path.resolve(directory, file), "utf8", (err, data) => {
            if (err) {
                if (err.code === "ENOENT") {
                    return reject(new error_1.FirebaseError(`Could not find "${file}" in "${directory}"`, { original: err }));
                }
                reject(new error_1.FirebaseError(`Failed to read file "${file}" in "${directory}"`, { original: err }));
            }
            else {
                resolve(data);
            }
        });
    }).then((source) => {
        return {
            source,
            sourceDirectory: directory,
        };
    });
}
exports.readFileFromDirectory = readFileFromDirectory;
function getFunctionResourcesWithParamSubstitution(extensionSpec, params) {
    const rawResources = extensionSpec.resources.filter((resource) => validFunctionTypes.includes(resource.type));
    return (0, extensionsHelper_1.substituteParams)(rawResources, params);
}
exports.getFunctionResourcesWithParamSubstitution = getFunctionResourcesWithParamSubstitution;
function getFunctionProperties(resources) {
    return resources.map((r) => r.properties);
}
exports.getFunctionProperties = getFunctionProperties;
exports.DEFAULT_RUNTIME = "nodejs14";
function getRuntime(resources) {
    if (resources.length === 0) {
        return exports.DEFAULT_RUNTIME;
    }
    const invalidRuntimes = [];
    const runtimes = resources.map((r) => {
        const runtime = (0, utils_1.getResourceRuntime)(r);
        if (!runtime) {
            return exports.DEFAULT_RUNTIME;
        }
        if (!/^(nodejs)?([0-9]+)/.test(runtime)) {
            invalidRuntimes.push(runtime);
            return exports.DEFAULT_RUNTIME;
        }
        return runtime;
    });
    if (invalidRuntimes.length) {
        throw new error_1.FirebaseError(`The following runtimes are not supported by the Emulator Suite: ${invalidRuntimes.join(", ")}. \n Only Node runtimes are supported.`);
    }
    return runtimes.sort()[runtimes.length - 1];
}
exports.getRuntime = getRuntime;
