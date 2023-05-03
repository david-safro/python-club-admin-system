"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getParams = exports.getSecretEnvVars = exports.getNonSecretEnv = exports.getExtensionFunctionInfo = exports.buildOptions = void 0;
const fs = require("fs-extra");
const path = require("path");
const paramHelper = require("../paramHelper");
const specHelper = require("./specHelper");
const localHelper = require("../localHelper");
const triggerHelper = require("./triggerHelper");
const types_1 = require("../types");
const extensionsHelper = require("../extensionsHelper");
const planner = require("../../deploy/extensions/planner");
const config_1 = require("../../config");
const error_1 = require("../../error");
const emulatorLogger_1 = require("../../emulator/emulatorLogger");
const projectUtils_1 = require("../../projectUtils");
const types_2 = require("../../emulator/types");
async function buildOptions(options) {
    const extDevDir = localHelper.findExtensionYaml(process.cwd());
    options.extDevDir = extDevDir;
    const spec = await specHelper.readExtensionYaml(extDevDir);
    extensionsHelper.validateSpec(spec);
    const params = getParams(options, spec);
    extensionsHelper.validateCommandLineParams(params, spec.params);
    const functionResources = specHelper.getFunctionResourcesWithParamSubstitution(spec, params);
    let testConfig;
    if (options.testConfig) {
        testConfig = readTestConfigFile(options.testConfig);
        checkTestConfig(testConfig, functionResources);
    }
    options.config = buildConfig(functionResources, testConfig);
    options.extDevEnv = params;
    const functionEmuTriggerDefs = functionResources.map((r) => triggerHelper.functionResourceToEmulatedTriggerDefintion(r));
    options.extDevTriggers = functionEmuTriggerDefs;
    options.extDevRuntime = specHelper.getRuntime(functionResources);
    return options;
}
exports.buildOptions = buildOptions;
async function getExtensionFunctionInfo(instance, paramValues) {
    const spec = await planner.getExtensionSpec(instance);
    const functionResources = specHelper.getFunctionResourcesWithParamSubstitution(spec, paramValues);
    const extensionTriggers = functionResources
        .map((r) => triggerHelper.functionResourceToEmulatedTriggerDefintion(r, instance.systemParams))
        .map((trigger) => {
        trigger.name = `ext-${instance.instanceId}-${trigger.name}`;
        return trigger;
    });
    const runtime = specHelper.getRuntime(functionResources);
    const nonSecretEnv = getNonSecretEnv(spec.params, paramValues);
    const secretEnvVariables = getSecretEnvVars(spec.params, paramValues);
    return {
        extensionTriggers,
        runtime,
        nonSecretEnv,
        secretEnvVariables,
    };
}
exports.getExtensionFunctionInfo = getExtensionFunctionInfo;
const isSecretParam = (p) => p.type === extensionsHelper.SpecParamType.SECRET || p.type === types_1.ParamType.SECRET;
function getNonSecretEnv(params, paramValues) {
    const getNonSecretEnv = Object.assign({}, paramValues);
    const secretParams = params.filter(isSecretParam);
    for (const p of secretParams) {
        delete getNonSecretEnv[p.param];
    }
    return getNonSecretEnv;
}
exports.getNonSecretEnv = getNonSecretEnv;
function getSecretEnvVars(params, paramValues) {
    const secretEnvVar = [];
    const secretParams = params.filter(isSecretParam);
    for (const s of secretParams) {
        if (paramValues[s.param]) {
            const [, projectId, , secret, , version] = paramValues[s.param].split("/");
            secretEnvVar.push({
                key: s.param,
                secret,
                projectId,
                version,
            });
        }
    }
    return secretEnvVar;
}
exports.getSecretEnvVars = getSecretEnvVars;
function getParams(options, extensionSpec) {
    const projectId = (0, projectUtils_1.needProjectId)(options);
    const userParams = paramHelper.readEnvFile(options.testParams);
    const autoParams = {
        PROJECT_ID: projectId,
        EXT_INSTANCE_ID: extensionSpec.name,
        DATABASE_INSTANCE: projectId,
        DATABASE_URL: `https://${projectId}.firebaseio.com`,
        STORAGE_BUCKET: `${projectId}.appspot.com`,
    };
    const unsubbedParamsWithoutDefaults = Object.assign(autoParams, userParams);
    const unsubbedParams = extensionsHelper.populateDefaultParams(unsubbedParamsWithoutDefaults, extensionSpec.params);
    return extensionsHelper.substituteParams(unsubbedParams, unsubbedParams);
}
exports.getParams = getParams;
function checkTestConfig(testConfig, functionResources) {
    const logger = emulatorLogger_1.EmulatorLogger.forEmulator(types_2.Emulators.FUNCTIONS);
    if (!testConfig.functions && functionResources.length) {
        logger.log("WARN", "This extension uses functions," +
            "but 'firebase.json' provided by --test-config is missing a top-level 'functions' object." +
            "Functions will not be emulated.");
    }
    if (!testConfig.firestore && shouldEmulateFirestore(functionResources)) {
        logger.log("WARN", "This extension interacts with Cloud Firestore," +
            "but 'firebase.json' provided by --test-config is missing a top-level 'firestore' object." +
            "Cloud Firestore will not be emulated.");
    }
    if (!testConfig.database && shouldEmulateDatabase(functionResources)) {
        logger.log("WARN", "This extension interacts with Realtime Database," +
            "but 'firebase.json' provided by --test-config is missing a top-level 'database' object." +
            "Realtime Database will not be emulated.");
    }
    if (!testConfig.storage && shouldEmulateStorage(functionResources)) {
        logger.log("WARN", "This extension interacts with Cloud Storage," +
            "but 'firebase.json' provided by --test-config is missing a top-level 'storage' object." +
            "Cloud Storage will not be emulated.");
    }
}
function readTestConfigFile(testConfigPath) {
    try {
        const buf = fs.readFileSync(path.resolve(testConfigPath));
        return JSON.parse(buf.toString());
    }
    catch (err) {
        throw new error_1.FirebaseError(`Error reading --test-config file: ${err.message}\n`, {
            original: err,
        });
    }
}
function buildConfig(functionResources, testConfig) {
    const config = new config_1.Config(testConfig || {}, { projectDir: process.cwd(), cwd: process.cwd() });
    const emulateFunctions = shouldEmulateFunctions(functionResources);
    if (!testConfig) {
        if (emulateFunctions) {
            config.set("functions", {});
        }
        if (shouldEmulateFirestore(functionResources)) {
            config.set("firestore", {});
        }
        if (shouldEmulateDatabase(functionResources)) {
            config.set("database", {});
        }
        if (shouldEmulatePubsub(functionResources)) {
            config.set("pubsub", {});
        }
        if (shouldEmulateStorage(functionResources)) {
            config.set("storage", {});
        }
    }
    if (config.src.functions) {
        const sourceDirectory = getFunctionSourceDirectory(functionResources);
        config.set("functions.source", sourceDirectory);
    }
    return config;
}
function getFunctionSourceDirectory(functionResources) {
    var _a;
    let sourceDirectory;
    for (const r of functionResources) {
        const dir = ((_a = r.properties) === null || _a === void 0 ? void 0 : _a.sourceDirectory) || "functions";
        if (!sourceDirectory) {
            sourceDirectory = dir;
        }
        else if (sourceDirectory !== dir) {
            throw new error_1.FirebaseError(`Found function resources with different sourceDirectories: '${sourceDirectory}' and '${dir}'. The extensions emulator only supports a single sourceDirectory.`);
        }
    }
    return sourceDirectory || "functions";
}
function shouldEmulateFunctions(resources) {
    return resources.length > 0;
}
function shouldEmulate(emulatorName, resources) {
    var _a, _b;
    for (const r of resources) {
        const eventType = ((_b = (_a = r.properties) === null || _a === void 0 ? void 0 : _a.eventTrigger) === null || _b === void 0 ? void 0 : _b.eventType) || "";
        if (eventType.includes(emulatorName)) {
            return true;
        }
    }
    return false;
}
function shouldEmulateFirestore(resources) {
    return shouldEmulate("cloud.firestore", resources);
}
function shouldEmulateDatabase(resources) {
    return shouldEmulate("google.firebase.database", resources);
}
function shouldEmulatePubsub(resources) {
    return shouldEmulate("google.pubsub", resources);
}
function shouldEmulateStorage(resources) {
    return shouldEmulate("google.storage", resources);
}
