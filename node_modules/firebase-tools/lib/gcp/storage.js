"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServiceAccount = exports.listBuckets = exports.getBucket = exports.deleteObject = exports.uploadObject = exports.upload = exports.getDefaultBucket = void 0;
const path = require("path");
const api_1 = require("../api");
const apiv2_1 = require("../apiv2");
const logger_1 = require("../logger");
const error_1 = require("../error");
async function getDefaultBucket(projectId) {
    try {
        const appengineClient = new apiv2_1.Client({ urlPrefix: api_1.appengineOrigin, apiVersion: "v1" });
        const resp = await appengineClient.get(`/apps/${projectId}`);
        if (resp.body.defaultBucket === "undefined") {
            logger_1.logger.debug("Default storage bucket is undefined.");
            throw new error_1.FirebaseError("Your project is being set up. Please wait a minute before deploying again.");
        }
        return resp.body.defaultBucket;
    }
    catch (err) {
        logger_1.logger.info("\n\nThere was an issue deploying your functions. Verify that your project has a Google App Engine instance setup at https://console.cloud.google.com/appengine and try again. If this issue persists, please contact support.");
        throw err;
    }
}
exports.getDefaultBucket = getDefaultBucket;
async function upload(source, uploadUrl, extraHeaders) {
    const url = new URL(uploadUrl);
    const localAPIClient = new apiv2_1.Client({ urlPrefix: url.origin, auth: false });
    const res = await localAPIClient.request({
        method: "PUT",
        path: url.pathname,
        queryParams: url.searchParams,
        responseType: "xml",
        headers: Object.assign({ "content-type": "application/zip" }, extraHeaders),
        body: source.stream,
        skipLog: { resBody: true },
    });
    return {
        generation: res.response.headers.get("x-goog-generation"),
    };
}
exports.upload = upload;
async function uploadObject(source, bucketName) {
    if (path.extname(source.file) !== ".zip") {
        throw new error_1.FirebaseError(`Expected a file name ending in .zip, got ${source.file}`);
    }
    const localAPIClient = new apiv2_1.Client({ urlPrefix: api_1.storageOrigin });
    const location = `/${bucketName}/${path.basename(source.file)}`;
    const res = await localAPIClient.request({
        method: "PUT",
        path: location,
        headers: {
            "Content-Type": "application/zip",
            "x-goog-content-length-range": "0,123289600",
        },
        body: source.stream,
    });
    return {
        bucket: bucketName,
        object: path.basename(source.file),
        generation: res.response.headers.get("x-goog-generation"),
    };
}
exports.uploadObject = uploadObject;
function deleteObject(location) {
    const localAPIClient = new apiv2_1.Client({ urlPrefix: api_1.storageOrigin });
    return localAPIClient.delete(location);
}
exports.deleteObject = deleteObject;
async function getBucket(bucketName) {
    try {
        const localAPIClient = new apiv2_1.Client({ urlPrefix: api_1.storageOrigin });
        const result = await localAPIClient.get(`/storage/v1/b/${bucketName}`);
        return result.body;
    }
    catch (err) {
        logger_1.logger.debug(err);
        throw new error_1.FirebaseError("Failed to obtain the storage bucket", {
            original: err,
        });
    }
}
exports.getBucket = getBucket;
async function listBuckets(projectId) {
    try {
        const localAPIClient = new apiv2_1.Client({ urlPrefix: api_1.storageOrigin });
        const result = await localAPIClient.get(`/storage/v1/b?project=${projectId}`);
        return result.body.items.map((bucket) => bucket.name);
    }
    catch (err) {
        logger_1.logger.debug(err);
        throw new error_1.FirebaseError("Failed to read the storage buckets", {
            original: err,
        });
    }
}
exports.listBuckets = listBuckets;
async function getServiceAccount(projectId) {
    try {
        const localAPIClient = new apiv2_1.Client({ urlPrefix: api_1.storageOrigin });
        const response = await localAPIClient.get(`/storage/v1/projects/${projectId}/serviceAccount`);
        return response.body;
    }
    catch (err) {
        logger_1.logger.debug(err);
        throw new error_1.FirebaseError("Failed to obtain the Cloud Storage service agent", {
            original: err,
        });
    }
}
exports.getServiceAccount = getServiceAccount;
