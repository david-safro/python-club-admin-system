"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const tty = require("tty");
const fs = require("fs");
const clc = require("colorette");
const secrets_1 = require("../functions/secrets");
const command_1 = require("../command");
const requirePermissions_1 = require("../requirePermissions");
const prompt_1 = require("../prompt");
const utils_1 = require("../utils");
const projectUtils_1 = require("../projectUtils");
const secretManager_1 = require("../gcp/secretManager");
const secrets = require("../functions/secrets");
const backend = require("../deploy/functions/backend");
exports.command = new command_1.Command("functions:secrets:set <KEY>")
    .description("Create or update a secret for use in Cloud Functions for Firebase.")
    .withForce("Automatically updates functions to use the new secret.")
    .before(requirePermissions_1.requirePermissions, [
    "secretmanager.secrets.create",
    "secretmanager.secrets.get",
    "secretmanager.secrets.update",
    "secretmanager.versions.add",
])
    .option("--data-file <dataFile>", 'File path from which to read secret data. Set to "-" to read the secret data from stdin.')
    .action(async (unvalidatedKey, options) => {
    const projectId = (0, projectUtils_1.needProjectId)(options);
    const projectNumber = await (0, projectUtils_1.needProjectNumber)(options);
    const key = await (0, secrets_1.ensureValidKey)(unvalidatedKey, options);
    const secret = await (0, secrets_1.ensureSecret)(projectId, key, options);
    let secretValue;
    if ((!options.dataFile || options.dataFile === "-") && tty.isatty(0)) {
        secretValue = await (0, prompt_1.promptOnce)({
            name: key,
            type: "password",
            message: `Enter a value for ${key}`,
        });
    }
    else {
        let dataFile = 0;
        if (options.dataFile && options.dataFile !== "-") {
            dataFile = options.dataFile;
        }
        secretValue = fs.readFileSync(dataFile, "utf-8");
    }
    const secretVersion = await (0, secretManager_1.addVersion)(projectId, key, secretValue);
    (0, utils_1.logSuccess)(`Created a new secret version ${(0, secretManager_1.toSecretVersionResourceName)(secretVersion)}`);
    if (!secrets.isFirebaseManaged(secret)) {
        (0, utils_1.logBullet)("Please deploy your functions for the change to take effect by running:\n\t" +
            clc.bold("firebase deploy --only functions"));
        return;
    }
    const haveBackend = await backend.existingBackend({ projectId });
    const endpointsToUpdate = backend
        .allEndpoints(haveBackend)
        .filter((e) => secrets.inUse({ projectId, projectNumber }, secret, e));
    if (endpointsToUpdate.length === 0) {
        return;
    }
    (0, utils_1.logBullet)(`${endpointsToUpdate.length} functions are using stale version of secret ${secret.name}:\n\t` +
        endpointsToUpdate.map((e) => `${e.id}(${e.region})`).join("\n\t"));
    if (!options.force) {
        const confirm = await (0, prompt_1.promptOnce)({
            name: "redeploy",
            type: "confirm",
            default: true,
            message: `Do you want to re-deploy the functions and destroy the stale version of secret ${secret.name}?`,
        }, options);
        if (!confirm) {
            (0, utils_1.logBullet)("Please deploy your functions for the change to take effect by running:\n\t" +
                clc.bold("firebase deploy --only functions"));
            return;
        }
    }
    const updateOps = endpointsToUpdate.map(async (e) => {
        (0, utils_1.logBullet)(`Updating function ${e.id}(${e.region})...`);
        const updated = await secrets.updateEndpointSecret({ projectId, projectNumber }, secretVersion, e);
        (0, utils_1.logBullet)(`Updated function ${e.id}(${e.region}).`);
        return updated;
    });
    await Promise.all(updateOps);
});
