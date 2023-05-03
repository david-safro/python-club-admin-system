"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listDatabaseInstances = void 0;
const api_1 = require("../api");
const apiv2_1 = require("../apiv2");
const logger_1 = require("../logger");
const utils = require("../utils");
function _handleErrorResponse(response) {
    if (response.body && response.body.error) {
        return utils.reject(response.body.error, { code: 2 });
    }
    logger_1.logger.debug("[firedata] error:", response.status, response.body);
    return utils.reject("Unexpected error encountered with FireData.", {
        code: 2,
    });
}
async function listDatabaseInstances(projectNumber) {
    const client = new apiv2_1.Client({ urlPrefix: api_1.firedataOrigin, apiVersion: "v1" });
    const response = await client.get(`/projects/${projectNumber}/databases`, {
        resolveOnHTTPError: true,
    });
    if (response.status === 200) {
        return response.body.instance;
    }
    return _handleErrorResponse(response);
}
exports.listDatabaseInstances = listDatabaseInstances;
