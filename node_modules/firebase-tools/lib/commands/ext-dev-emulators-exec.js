"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const clc = require("colorette");
const checkMinRequiredVersion_1 = require("../checkMinRequiredVersion");
const command_1 = require("../command");
const error_1 = require("../error");
const commandUtils = require("../emulator/commandUtils");
exports.command = new command_1.Command("ext:dev:emulators:exec <script>")
    .description("deprecated: please use `firebase emulators:exec` instead")
    .before(commandUtils.setExportOnExitOptions)
    .option(commandUtils.FLAG_INSPECT_FUNCTIONS, commandUtils.DESC_INSPECT_FUNCTIONS)
    .option(commandUtils.FLAG_TEST_CONFIG, commandUtils.DESC_TEST_CONFIG)
    .option(commandUtils.FLAG_TEST_PARAMS, commandUtils.DESC_TEST_PARAMS)
    .option(commandUtils.FLAG_IMPORT, commandUtils.DESC_IMPORT)
    .option(commandUtils.FLAG_EXPORT_ON_EXIT, commandUtils.DESC_EXPORT_ON_EXIT)
    .option(commandUtils.FLAG_UI, commandUtils.DESC_UI)
    .before(checkMinRequiredVersion_1.checkMinRequiredVersion, "extDevMinVersion")
    .action((script) => {
    const localInstallCommand = `firebase ext:install ${process.cwd()}`;
    const emulatorsExecCommand = `firebase emulators:exec '${script}`;
    throw new error_1.FirebaseError("ext:dev:emulators:exec is no longer supported. " +
        "Instead, navigate to a Firebase project directory and add this extension to the extensions manifest by running:\n" +
        clc.bold(localInstallCommand) +
        "\nThen, you can emulate this extension as part of that project by running:\n" +
        clc.bold(emulatorsExecCommand));
});
