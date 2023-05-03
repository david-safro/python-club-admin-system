"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FunctionsEmulatorShell = void 0;
const uuid = require("uuid");
const functionsEmulator_1 = require("./functionsEmulator");
const utils = require("../utils");
const logger_1 = require("../logger");
const error_1 = require("../error");
class FunctionsEmulatorShell {
    constructor(emu) {
        this.emu = emu;
        this.urls = {};
        this.triggers = emu.getTriggerDefinitions();
        this.emulatedFunctions = this.triggers.map((t) => t.id);
        const entryPoints = this.triggers.map((t) => t.entryPoint);
        utils.logLabeledBullet("functions", `Loaded functions: ${entryPoints.join(", ")}`);
        for (const trigger of this.triggers) {
            if (trigger.httpsTrigger) {
                this.urls[trigger.id] = functionsEmulator_1.FunctionsEmulator.getHttpFunctionUrl(this.emu.getProjectId(), trigger.name, trigger.region, this.emu.getInfo());
            }
        }
    }
    call(name, data, opts) {
        const trigger = this.getTrigger(name);
        logger_1.logger.debug(`shell:${name}: trigger=${JSON.stringify(trigger)}`);
        logger_1.logger.debug(`shell:${name}: opts=${JSON.stringify(opts)}, data=${JSON.stringify(data)}`);
        if (!trigger.eventTrigger) {
            throw new error_1.FirebaseError(`Function ${name} is not a background function`);
        }
        const eventType = trigger.eventTrigger.eventType;
        let resource = opts.resource;
        if (typeof resource === "object" && resource.name) {
            resource = resource.name;
        }
        const proto = {
            eventId: uuid.v4(),
            timestamp: new Date().toISOString(),
            eventType,
            resource,
            params: opts.params,
            auth: opts.auth,
            data,
        };
        this.emu.sendRequest(trigger, proto);
    }
    getTrigger(name) {
        const result = this.triggers.find((trigger) => {
            return trigger.name === name;
        });
        if (!result) {
            throw new error_1.FirebaseError(`Could not find trigger ${name}`);
        }
        return result;
    }
}
exports.FunctionsEmulatorShell = FunctionsEmulatorShell;
