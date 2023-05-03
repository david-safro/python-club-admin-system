"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const utils = require("../utils");
const clc = require("colorette");
const command_1 = require("../command");
const extensionsHelper_1 = require("../extensions/extensionsHelper");
const extensionsApi_1 = require("../extensions/extensionsApi");
const refs = require("../extensions/refs");
const prompt_1 = require("../prompt");
const requireAuth_1 = require("../requireAuth");
const error_1 = require("../error");
const checkMinRequiredVersion_1 = require("../checkMinRequiredVersion");
exports.command = new command_1.Command("ext:dev:delete <extensionRef>")
    .description("delete an extension")
    .help("use this command to delete an extension, and make it unavailable for developers to install or reconfigure. " +
    "Specify the extension you want to delete using the format '<publisherId>/<extensionId>.")
    .before(requireAuth_1.requireAuth)
    .before(checkMinRequiredVersion_1.checkMinRequiredVersion, "extDevMinVersion")
    .action(async (extensionRef) => {
    const { publisherId, extensionId, version } = refs.parse(extensionRef);
    if (version) {
        throw new error_1.FirebaseError(`Deleting a single version is not currently supported. You can only delete ${clc.bold("ALL versions")} of an extension. To delete all versions, please remove the version from the reference.`);
    }
    utils.logLabeledWarning(extensionsHelper_1.logPrefix, "If you delete this extension, developers won't be able to install it. " +
        "For developers who currently have this extension installed, " +
        "it will continue to run and will appear as unpublished when " +
        "listed in the Firebase console or Firebase CLI.");
    utils.logLabeledWarning("This is a permanent action", `Once deleted, you may never use the extension name '${clc.bold(extensionId)}' again.`);
    await (0, extensionsApi_1.getExtension)(extensionRef);
    const consent = await confirmDelete(publisherId, extensionId);
    if (!consent) {
        throw new error_1.FirebaseError("deletion cancelled.");
    }
    await (0, extensionsApi_1.deleteExtension)(extensionRef);
    utils.logLabeledSuccess(extensionsHelper_1.logPrefix, "successfully deleted all versions of this extension.");
});
async function confirmDelete(publisherId, extensionId) {
    const message = `You are about to delete ALL versions of ${clc.green(`${publisherId}/${extensionId}`)}.\nDo you wish to continue? `;
    return (0, prompt_1.promptOnce)({
        type: "confirm",
        message,
        default: false,
    });
}
