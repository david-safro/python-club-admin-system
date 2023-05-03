"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const command_1 = require("../command");
const extensionsHelper_1 = require("../extensions/extensionsHelper");
const extensionsApi_1 = require("../extensions/extensionsApi");
const utils = require("../utils");
const refs = require("../extensions/refs");
const prompt_1 = require("../prompt");
const clc = require("colorette");
const requireAuth_1 = require("../requireAuth");
const error_1 = require("../error");
const checkMinRequiredVersion_1 = require("../checkMinRequiredVersion");
exports.command = new command_1.Command("ext:dev:unpublish <extensionRef>")
    .description("unpublish an extension")
    .withForce()
    .help("use this command to unpublish an extension, and make it unavailable for developers to install or reconfigure. " +
    "Specify the extension you want to unpublish using the format '<publisherId>/<extensionId>.")
    .before(requireAuth_1.requireAuth)
    .before(checkMinRequiredVersion_1.checkMinRequiredVersion, "extDevMinVersion")
    .action(async (extensionRef, options) => {
    const { publisherId, extensionId, version } = refs.parse(extensionRef);
    utils.logLabeledWarning(extensionsHelper_1.logPrefix, "If you unpublish this extension, developers won't be able to install it. For developers who currently have this extension installed, it will continue to run and will appear as unpublished when listed in the Firebase console or Firebase CLI.");
    utils.logLabeledWarning("This is a permanent action", `Once unpublished, you may never use the extension name '${clc.bold(extensionId)}' again.`);
    if (version) {
        throw new error_1.FirebaseError(`Unpublishing a single version is not currently supported. You can only unpublish ${clc.bold("ALL versions")} of an extension. To unpublish all versions, please remove the version from the reference.`);
    }
    await (0, extensionsApi_1.getExtension)(extensionRef);
    const consent = await comfirmUnpublish(publisherId, extensionId, options);
    if (!consent) {
        throw new error_1.FirebaseError("unpublishing cancelled.");
    }
    await (0, extensionsApi_1.unpublishExtension)(extensionRef);
    utils.logLabeledSuccess(extensionsHelper_1.logPrefix, "successfully unpublished all versions of this extension.");
});
async function comfirmUnpublish(publisherId, extensionId, options) {
    if (options.nonInteractive && !options.force) {
        throw new error_1.FirebaseError("Pass the --force flag to use this command in non-interactive mode");
    }
    if (options.nonInteractive && options.force) {
        return true;
    }
    const message = `You are about to unpublish ALL versions of ${clc.green(`${publisherId}/${extensionId}`)}.\nDo you wish to continue? `;
    return (0, prompt_1.promptOnce)({
        type: "confirm",
        message,
        default: false,
    });
}
