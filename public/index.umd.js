(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.RayyanJS = {}));
})(this, (function (exports) { 'use strict';

    let options = {
        exclude: [],
        include: [],
        logging: true,
    };

    // components include a dictionary of name: function.
    const components = {};
    /**
     * includeComponent is the function each component function needs to call in order for the component to be included
     * in the fingerprint.
     * @param {string} name - the name identifier of the component
     * @param {componentFunctionInterface} creationFunction - the function that implements the component
     * @returns
     */
    const includeComponent = (name, creationFunction) => {
        if (typeof window !== 'undefined')
            components[name] = creationFunction;
    };
    /**
     * The function turns the map of component functions to a map of Promises when called
     * @returns {[name: string]: <Promise>componentInterface}
     */
    const getComponentPromises = () => {
        return Object.fromEntries(Object.entries(components)
            .filter(([key]) => {
            var _a;
            return !((_a = options === null || options === void 0 ? void 0 : options.exclude) === null || _a === void 0 ? void 0 : _a.includes(key));
        })
            .filter(([key]) => {
            var _a, _b, _c, _d;
            return ((_a = options === null || options === void 0 ? void 0 : options.include) === null || _a === void 0 ? void 0 : _a.some(e => e.includes('.')))
                ? (_b = options === null || options === void 0 ? void 0 : options.include) === null || _b === void 0 ? void 0 : _b.some(e => e.startsWith(key))
                : ((_c = options === null || options === void 0 ? void 0 : options.include) === null || _c === void 0 ? void 0 : _c.length) === 0 || ((_d = options === null || options === void 0 ? void 0 : options.include) === null || _d === void 0 ? void 0 : _d.includes(key));
        })
            .map(([key, value]) => [key, value()]));
    };
    const timeoutInstance = {
        'timeout': "true"
    };

    /**
     * This code is taken from https://github.com/LinusU/murmur-128/blob/master/index.js
     * But instead of dependencies to encode-utf8 and fmix, I've implemented them here.
     */
    function encodeUtf8(text) {
        const encoder = new TextEncoder();
        return encoder.encode(text).buffer;
    }
    function fmix(input) {
        input ^= (input >>> 16);
        input = Math.imul(input, 0x85ebca6b);
        input ^= (input >>> 13);
        input = Math.imul(input, 0xc2b2ae35);
        input ^= (input >>> 16);
        return (input >>> 0);
    }
    const C = new Uint32Array([
        0x239b961b,
        0xab0e9789,
        0x38b34ae5,
        0xa1e38b93
    ]);
    function rotl(m, n) {
        return (m << n) | (m >>> (32 - n));
    }
    function body(key, hash) {
        const blocks = (key.byteLength / 16) | 0;
        const view32 = new Uint32Array(key, 0, blocks * 4);
        for (let i = 0; i < blocks; i++) {
            const k = view32.subarray(i * 4, (i + 1) * 4);
            k[0] = Math.imul(k[0], C[0]);
            k[0] = rotl(k[0], 15);
            k[0] = Math.imul(k[0], C[1]);
            hash[0] = (hash[0] ^ k[0]);
            hash[0] = rotl(hash[0], 19);
            hash[0] = (hash[0] + hash[1]);
            hash[0] = Math.imul(hash[0], 5) + 0x561ccd1b;
            k[1] = Math.imul(k[1], C[1]);
            k[1] = rotl(k[1], 16);
            k[1] = Math.imul(k[1], C[2]);
            hash[1] = (hash[1] ^ k[1]);
            hash[1] = rotl(hash[1], 17);
            hash[1] = (hash[1] + hash[2]);
            hash[1] = Math.imul(hash[1], 5) + 0x0bcaa747;
            k[2] = Math.imul(k[2], C[2]);
            k[2] = rotl(k[2], 17);
            k[2] = Math.imul(k[2], C[3]);
            hash[2] = (hash[2] ^ k[2]);
            hash[2] = rotl(hash[2], 15);
            hash[2] = (hash[2] + hash[3]);
            hash[2] = Math.imul(hash[2], 5) + 0x96cd1c35;
            k[3] = Math.imul(k[3], C[3]);
            k[3] = rotl(k[3], 18);
            k[3] = Math.imul(k[3], C[0]);
            hash[3] = (hash[3] ^ k[3]);
            hash[3] = rotl(hash[3], 13);
            hash[3] = (hash[3] + hash[0]);
            hash[3] = Math.imul(hash[3], 5) + 0x32ac3b17;
        }
    }
    function tail(key, hash) {
        const blocks = (key.byteLength / 16) | 0;
        const reminder = (key.byteLength % 16);
        const k = new Uint32Array(4);
        const tail = new Uint8Array(key, blocks * 16, reminder);
        switch (reminder) {
            case 15:
                k[3] = (k[3] ^ (tail[14] << 16));
                break; // fallthrough
            case 14:
                k[3] = (k[3] ^ (tail[13] << 8));
                break; // fallthrough
            case 13:
                k[3] = (k[3] ^ (tail[12] << 0));
                k[3] = Math.imul(k[3], C[3]);
                k[3] = rotl(k[3], 18);
                k[3] = Math.imul(k[3], C[0]);
                hash[3] = (hash[3] ^ k[3]);
                break;
            // fallthrough
            case 12:
                k[2] = (k[2] ^ (tail[11] << 24));
                break; // fallthrough
            case 11:
                k[2] = (k[2] ^ (tail[10] << 16));
                break; // fallthrough
            case 10:
                k[2] = (k[2] ^ (tail[9] << 8));
                break; // fallthrough
            case 9:
                k[2] = (k[2] ^ (tail[8] << 0));
                k[2] = Math.imul(k[2], C[2]);
                k[2] = rotl(k[2], 17);
                k[2] = Math.imul(k[2], C[3]);
                hash[2] = (hash[2] ^ k[2]);
                break;
            // fallthrough
            case 8:
                k[1] = (k[1] ^ (tail[7] << 24));
                break; // fallthrough
            case 7:
                k[1] = (k[1] ^ (tail[6] << 16));
                break; // fallthrough
            case 6:
                k[1] = (k[1] ^ (tail[5] << 8));
                break; // fallthrough
            case 5:
                k[1] = (k[1] ^ (tail[4] << 0));
                k[1] = Math.imul(k[1], C[1]);
                k[1] = rotl(k[1], 16);
                k[1] = Math.imul(k[1], C[2]);
                hash[1] = (hash[1] ^ k[1]);
                break;
            // fallthrough
            case 4:
                k[0] = (k[0] ^ (tail[3] << 24));
                break; // fallthrough
            case 3:
                k[0] = (k[0] ^ (tail[2] << 16));
                break; // fallthrough
            case 2:
                k[0] = (k[0] ^ (tail[1] << 8));
                break; // fallthrough
            case 1:
                k[0] = (k[0] ^ (tail[0] << 0));
                k[0] = Math.imul(k[0], C[0]);
                k[0] = rotl(k[0], 15);
                k[0] = Math.imul(k[0], C[1]);
                hash[0] = (hash[0] ^ k[0]);
                break;
        }
    }
    function finalize(key, hash) {
        hash[0] = (hash[0] ^ key.byteLength);
        hash[1] = (hash[1] ^ key.byteLength);
        hash[2] = (hash[2] ^ key.byteLength);
        hash[3] = (hash[3] ^ key.byteLength);
        hash[0] = (hash[0] + hash[1]) | 0;
        hash[0] = (hash[0] + hash[2]) | 0;
        hash[0] = (hash[0] + hash[3]) | 0;
        hash[1] = (hash[1] + hash[0]) | 0;
        hash[2] = (hash[2] + hash[0]) | 0;
        hash[3] = (hash[3] + hash[0]) | 0;
        hash[0] = fmix(hash[0]);
        hash[1] = fmix(hash[1]);
        hash[2] = fmix(hash[2]);
        hash[3] = fmix(hash[3]);
        hash[0] = (hash[0] + hash[1]) | 0;
        hash[0] = (hash[0] + hash[2]) | 0;
        hash[0] = (hash[0] + hash[3]) | 0;
        hash[1] = (hash[1] + hash[0]) | 0;
        hash[2] = (hash[2] + hash[0]) | 0;
        hash[3] = (hash[3] + hash[0]) | 0;
    }
    function hash(key, seed = 0) {
        seed = (seed ? (seed | 0) : 0);
        if (typeof key === 'string') {
            key = encodeUtf8(key);
        }
        if (!(key instanceof ArrayBuffer)) {
            throw new TypeError('Expected key to be ArrayBuffer or string');
        }
        const hash = new Uint32Array([seed, seed, seed, seed]);
        body(key, hash);
        tail(key, hash);
        finalize(key, hash);
        const byteArray = new Uint8Array(hash.buffer);
        return Array.from(byteArray).map(byte => byte.toString(16).padStart(2, '0')).join('');
    }

    function delay(t, val) {
        return new Promise((resolve) => {
            setTimeout(() => resolve(val), t);
        });
    }
    function raceAll(promises, timeoutTime, timeoutVal) {
        return Promise.all(promises.map((p) => {
            return Promise.race([p, delay(timeoutTime, timeoutVal)]);
        }));
    }

    async function getFingerprintData() {
        try {
            const promiseMap = getComponentPromises();
            const keys = Object.keys(promiseMap);
            const promises = Object.values(promiseMap);
            const resolvedValues = await raceAll(promises, (options === null || options === void 0 ? void 0 : options.timeout) || 1000, timeoutInstance);
            const resolvedComponents = {};
            resolvedValues.forEach((value, index) => {
                if (value !== undefined) {
                    resolvedComponents[keys[index]] = value;
                }
            });
            return filterFingerprintData(resolvedComponents, options.exclude || [], options.include || [], "");
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * This function filters the fingerprint data based on the exclude and include list
     * @param {componentInterface} obj - components objects from main componentInterface
     * @param {string[]} excludeList - elements to exclude from components objects (e.g : 'canvas', 'system.browser')
     * @param {string[]} includeList - elements to only include from components objects (e.g : 'canvas', 'system.browser')
     * @param {string} path - auto-increment path iterating on key objects from components objects
     * @returns {componentInterface} result - returns the final object before hashing in order to get fingerprint
     */
    function filterFingerprintData(obj, excludeList, includeList, path = "") {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            const currentPath = path + key + ".";
            if (typeof value === "object" && !Array.isArray(value)) {
                const filtered = filterFingerprintData(value, excludeList, includeList, currentPath);
                if (Object.keys(filtered).length > 0) {
                    result[key] = filtered;
                }
            }
            else {
                const isExcluded = excludeList.some((exclusion) => currentPath.startsWith(exclusion));
                const isIncluded = includeList.some((inclusion) => currentPath.startsWith(inclusion));
                if (!isExcluded || isIncluded) {
                    result[key] = value;
                }
            }
        }
        return result;
    }
    async function getFingerprint$1() {
        try {
            const fingerprintData = await getFingerprintData();
            const serializedFingerprint = getSerializedFingerprintObj(fingerprintData);
            const thisHash = hash(JSON.stringify(serializedFingerprint));
            const componentsUsedForHash = getHashRelevantKeys(serializedFingerprint);
            return {
                hash: thisHash.toString(),
                data: fingerprintData,
                componentsUsedForHash: componentsUsedForHash,
            };
        }
        catch (error) {
            throw error;
        }
    }
    function serializedObject(data) {
        return {
            audio: data.audio,
            fonts: data.fonts,
            hardware: data.hardware,
            math: data.math,
            permissions: data.permissions,
            screen: data.screen,
            system: data.system,
            emojiFingerprint: data.emojiFingerprint,
            vendorFlavour: data.vendorFlavour,
            colorGamut: data.colorGamut,
            canvas: data.canvas,
            webglBasics: data.webGlBasics,
        };
    }
    function getSerializedFingerprintObj(data) {
        return serializedObject(data);
    }
    function getHashRelevantKeys(data) {
        const fpdata = serializedObject(data);
        return Object.keys(fpdata);
    }

    async function detectTorBrowser$1() {
        const totalChecks = 7;
        let score = 0;
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (tz === "Atlantic/Reykjavik")
            score++;
        const webGLInfo = getWebGLInfo();
        if (["Mozilla", "unknown"].includes(webGLInfo.vendor))
            score++;
        if (!window.RTCPeerConnection)
            score++;
        if (!navigator.deviceMemory)
            score++;
        if (navigator.hardwareConcurrency === 2)
            score++;
        if (!navigator.credentials)
            score++;
        if (!navigator.geolocation)
            score++;
        return {
            status: score >= 6,
            confidence: `${((score / totalChecks)).toFixed(2)}`,
        };
    }
    const getWebGLInfo = () => {
        try {
            const canvas = document.createElement("canvas");
            const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
            if (!gl)
                return { vendor: "unsupported", renderer: "unsupported" };
            const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
            return debugInfo
                ? {
                    vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
                    renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL),
                }
                : { vendor: "unknown", renderer: "unknown" };
        }
        catch (_a) {
            return { vendor: "error", renderer: "error" };
        }
    };

    async function detectIncognito$1() {
        return new Promise(function (resolve, reject) {
            let browser_name = 'unknown';
            function __callback(status) {
                resolve({
                    status,
                    browser_name
                });
            }
            function identifyChromium() {
                const ua = navigator.userAgent;
                if (ua.match(/Chrome/)) {
                    if (navigator.brave !== undefined) {
                        return 'Brave';
                    }
                    else if (ua.match(/Edg/)) {
                        return 'Edge';
                    }
                    else if (ua.match(/OPR/)) {
                        return 'Opera';
                    }
                    return 'Chrome';
                }
                else {
                    return 'Chromium';
                }
            }
            function assertEvalToString(value) {
                return value === eval.toString().length;
            }
            function feid() {
                let toFixedEngineID = 0;
                let neg = parseInt("-1");
                try {
                    neg.toFixed(neg);
                }
                catch (e) {
                    toFixedEngineID = e.message.length;
                }
                return toFixedEngineID;
            }
            function isSafari() {
                return feid() === 44;
            }
            function isChrome() {
                return feid() === 51;
            }
            function isFirefox() {
                return feid() === 25;
            }
            function isMSIE() {
                return (navigator.msSaveBlob !== undefined && assertEvalToString(39));
            }
            /**
             * Safari (Safari for iOS & macOS)
             **/
            function newSafariTestByStorageFallback() {
                var _a;
                if (!((_a = navigator.storage) === null || _a === void 0 ? void 0 : _a.estimate)) {
                    __callback(false);
                    return;
                }
                navigator.storage
                    .estimate()
                    .then(({ quota }) => {
                    // iOS 18.x/macOS Safari 18.x (normal): ~41GB
                    // iOS 18.x/macOS Safari 18.x (private): ~1GB
                    // If reported quota < 2 GB => likely private
                    if (quota && quota < 2000000000) {
                        __callback(true);
                    }
                    else {
                        __callback(false);
                    }
                })
                    .catch(() => {
                    __callback(false);
                });
            }
            function newSafariTest() {
                const tmp_name = String(Math.random());
                try {
                    const db = window.indexedDB.open(tmp_name, 1);
                    db.onupgradeneeded = function (i) {
                        var _a, _b;
                        const res = (_a = i.target) === null || _a === void 0 ? void 0 : _a.result;
                        try {
                            res.createObjectStore('test', {
                                autoIncrement: true
                            }).put(new Blob());
                        }
                        catch (e) {
                            let message = e;
                            if (e instanceof Error) {
                                message = (_b = e.message) !== null && _b !== void 0 ? _b : e;
                            }
                            if (typeof message !== 'string') {
                                __callback(false);
                                return;
                            }
                            const matchesExpectedError = message.includes('BlobURLs are not yet supported');
                            if (matchesExpectedError) {
                                __callback(true);
                            }
                        }
                        finally {
                            res.close();
                            window.indexedDB.deleteDatabase(tmp_name);
                            // indexdb works on newer versions of safari so we need to check via storage fallback
                            newSafariTestByStorageFallback();
                        }
                    };
                }
                catch (e) {
                    __callback(false);
                }
            }
            function oldSafariTest() {
                const openDB = window.openDatabase;
                const storage = window.localStorage;
                try {
                    openDB(null, null, null, null);
                }
                catch (e) {
                    __callback(true);
                    return;
                }
                try {
                    storage.setItem('test', '1');
                    storage.removeItem('test');
                }
                catch (e) {
                    __callback(true);
                    return;
                }
                __callback(false);
            }
            function safariPrivateTest() {
                if (navigator.maxTouchPoints !== undefined) {
                    newSafariTest();
                }
                else {
                    oldSafariTest();
                }
            }
            /**
             * Chrome
             **/
            function getQuotaLimit() {
                const w = window;
                if (w.performance !== undefined &&
                    w.performance.memory !== undefined &&
                    w.performance.memory.jsHeapSizeLimit !== undefined) {
                    return performance.memory.jsHeapSizeLimit;
                }
                return 1073741824;
            }
            // >= 76
            function storageQuotaChromePrivateTest() {
                navigator.webkitTemporaryStorage.queryUsageAndQuota(function (_, quota) {
                    const quotaInMib = Math.round(quota / (1024 * 1024));
                    const quotaLimitInMib = Math.round(getQuotaLimit() / (1024 * 1024)) * 2;
                    __callback(quotaInMib < quotaLimitInMib);
                }, function (e) {
                    reject(new Error('detectIncognito somehow failed to query storage quota: ' +
                        e.message));
                });
            }
            // 50 to 75
            function oldChromePrivateTest() {
                const fs = window.webkitRequestFileSystem;
                const success = function () {
                    __callback(false);
                };
                const error = function () {
                    __callback(true);
                };
                fs(0, 1, success, error);
            }
            function chromePrivateTest() {
                if (self.Promise !== undefined && self.Promise.allSettled !== undefined) {
                    storageQuotaChromePrivateTest();
                }
                else {
                    oldChromePrivateTest();
                }
            }
            /**
             * Firefox
             **/
            function firefoxPrivateTest() {
                __callback(navigator.serviceWorker === undefined);
            }
            /**
             * MSIE
             **/
            function msiePrivateTest() {
                __callback(window.indexedDB === undefined);
            }
            function main() {
                if (isSafari()) {
                    browser_name = 'Safari';
                    safariPrivateTest();
                }
                else if (isChrome()) {
                    browser_name = identifyChromium();
                    chromePrivateTest();
                }
                else if (isFirefox()) {
                    browser_name = 'Firefox';
                    firefoxPrivateTest();
                }
                else if (isMSIE()) {
                    browser_name = 'Internet Explorer';
                    msiePrivateTest();
                }
                else {
                    reject(new Error('detectIncognito cannot determine the browser'));
                }
            }
            main();
        });
    }

    /******************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise, SuppressedError, Symbol, Iterator */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    function __generator(thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
        return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (g && (g = 0, op[0] && (_ = 0)), _) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    }

    function __spreadArray(to, from, pack) {
        if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
            if (ar || !(i in from)) {
                if (!ar) ar = Array.prototype.slice.call(from, 0, i);
                ar[i] = from[i];
            }
        }
        return to.concat(ar || Array.prototype.slice.call(from));
    }

    typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
        var e = new Error(message);
        return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
    };

    /**
     * Fingerprint BotD v1.9.1 - Copyright (c) FingerprintJS, Inc, 2024 (https://fingerprint.com)
     * Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license.
     */


    var version = "1.9.1";

    /**
     * Enum for types of bots.
     * Specific types of bots come first, followed by automation technologies.
     *
     * @readonly
     * @enum {string}
     */
    var BotKind = {
        // Object is used instead of Typescript enum to avoid emitting IIFE which might be affected by further tree-shaking.
        // See example of compiled enums https://stackoverflow.com/q/47363996)
        Awesomium: 'awesomium',
        Cef: 'cef',
        CefSharp: 'cefsharp',
        CoachJS: 'coachjs',
        Electron: 'electron',
        FMiner: 'fminer',
        Geb: 'geb',
        NightmareJS: 'nightmarejs',
        Phantomas: 'phantomas',
        PhantomJS: 'phantomjs',
        Rhino: 'rhino',
        Selenium: 'selenium',
        Sequentum: 'sequentum',
        SlimerJS: 'slimerjs',
        WebDriverIO: 'webdriverio',
        WebDriver: 'webdriver',
        HeadlessChrome: 'headless_chrome',
        Unknown: 'unknown',
    };
    /**
     * Bot detection error.
     */
    var BotdError = /** @class */ (function (_super) {
        __extends(BotdError, _super);
        /**
         * Creates a new BotdError.
         *
         * @class
         */
        function BotdError(state, message) {
            var _this = _super.call(this, message) || this;
            _this.state = state;
            _this.name = 'BotdError';
            Object.setPrototypeOf(_this, BotdError.prototype);
            return _this;
        }
        return BotdError;
    }(Error));

    function detect(components, detectors) {
        var detections = {};
        var finalDetection = {
            bot: false,
        };
        for (var detectorName in detectors) {
            var detector = detectors[detectorName];
            var detectorRes = detector(components);
            var detection = { bot: false };
            if (typeof detectorRes === 'string') {
                detection = { bot: true, botKind: detectorRes };
            }
            else if (detectorRes) {
                detection = { bot: true, botKind: BotKind.Unknown };
            }
            detections[detectorName] = detection;
            if (detection.bot) {
                finalDetection = detection;
            }
        }
        return [detections, finalDetection];
    }
    function collect(sources) {
        return __awaiter(this, void 0, void 0, function () {
            var components, sourcesKeys;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        components = {};
                        sourcesKeys = Object.keys(sources);
                        return [4 /*yield*/, Promise.all(sourcesKeys.map(function (sourceKey) { return __awaiter(_this, void 0, void 0, function () {
                                var res, _a, _b, error_1;
                                var _c;
                                return __generator(this, function (_d) {
                                    switch (_d.label) {
                                        case 0:
                                            res = sources[sourceKey];
                                            _d.label = 1;
                                        case 1:
                                            _d.trys.push([1, 3, , 4]);
                                            _a = components;
                                            _b = sourceKey;
                                            _c = {};
                                            return [4 /*yield*/, res()];
                                        case 2:
                                            _a[_b] = (_c.value = _d.sent(),
                                                _c.state = 0 /* State.Success */,
                                                _c);
                                            return [3 /*break*/, 4];
                                        case 3:
                                            error_1 = _d.sent();
                                            if (error_1 instanceof BotdError) {
                                                components[sourceKey] = {
                                                    state: error_1.state,
                                                    error: "".concat(error_1.name, ": ").concat(error_1.message),
                                                };
                                            }
                                            else {
                                                components[sourceKey] = {
                                                    state: -3 /* State.UnexpectedBehaviour */,
                                                    error: error_1 instanceof Error ? "".concat(error_1.name, ": ").concat(error_1.message) : String(error_1),
                                                };
                                            }
                                            return [3 /*break*/, 4];
                                        case 4: return [2 /*return*/];
                                    }
                                });
                            }); }))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, components];
                }
            });
        });
    }

    function detectAppVersion(_a) {
        var appVersion = _a.appVersion;
        if (appVersion.state !== 0 /* State.Success */)
            return false;
        if (/headless/i.test(appVersion.value))
            return BotKind.HeadlessChrome;
        if (/electron/i.test(appVersion.value))
            return BotKind.Electron;
        if (/slimerjs/i.test(appVersion.value))
            return BotKind.SlimerJS;
    }

    function arrayIncludes(arr, value) {
        return arr.indexOf(value) !== -1;
    }
    function strIncludes(str, value) {
        return str.indexOf(value) !== -1;
    }
    function arrayFind(array, callback) {
        if ('find' in array)
            return array.find(callback);
        for (var i = 0; i < array.length; i++) {
            if (callback(array[i], i, array))
                return array[i];
        }
        return undefined;
    }

    function getObjectProps(obj) {
        return Object.getOwnPropertyNames(obj);
    }
    function includes(arr) {
        var keys = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            keys[_i - 1] = arguments[_i];
        }
        var _loop_1 = function (key) {
            if (typeof key === 'string') {
                if (arrayIncludes(arr, key))
                    return { value: true };
            }
            else {
                var match = arrayFind(arr, function (value) { return key.test(value); });
                if (match != null)
                    return { value: true };
            }
        };
        for (var _a = 0, keys_1 = keys; _a < keys_1.length; _a++) {
            var key = keys_1[_a];
            var state_1 = _loop_1(key);
            if (typeof state_1 === "object")
                return state_1.value;
        }
        return false;
    }
    function countTruthy$1(values) {
        return values.reduce(function (sum, value) { return sum + (value ? 1 : 0); }, 0);
    }

    function detectDocumentAttributes(_a) {
        var documentElementKeys = _a.documentElementKeys;
        if (documentElementKeys.state !== 0 /* State.Success */)
            return false;
        if (includes(documentElementKeys.value, 'selenium', 'webdriver', 'driver')) {
            return BotKind.Selenium;
        }
    }

    function detectErrorTrace(_a) {
        var errorTrace = _a.errorTrace;
        if (errorTrace.state !== 0 /* State.Success */)
            return false;
        if (/PhantomJS/i.test(errorTrace.value))
            return BotKind.PhantomJS;
    }

    function detectEvalLengthInconsistency(_a) {
        var evalLength = _a.evalLength, browserKind = _a.browserKind, browserEngineKind = _a.browserEngineKind;
        if (evalLength.state !== 0 /* State.Success */ ||
            browserKind.state !== 0 /* State.Success */ ||
            browserEngineKind.state !== 0 /* State.Success */)
            return;
        var length = evalLength.value;
        if (browserEngineKind.value === "unknown" /* BrowserEngineKind.Unknown */)
            return false;
        return ((length === 37 && !arrayIncludes(["webkit" /* BrowserEngineKind.Webkit */, "gecko" /* BrowserEngineKind.Gecko */], browserEngineKind.value)) ||
            (length === 39 && !arrayIncludes(["internet_explorer" /* BrowserKind.IE */], browserKind.value)) ||
            (length === 33 && !arrayIncludes(["chromium" /* BrowserEngineKind.Chromium */], browserEngineKind.value)));
    }

    function detectFunctionBind(_a) {
        var functionBind = _a.functionBind;
        if (functionBind.state === -2 /* State.NotFunction */)
            return BotKind.PhantomJS;
    }

    function detectLanguagesLengthInconsistency(_a) {
        var languages = _a.languages;
        if (languages.state === 0 /* State.Success */ && languages.value.length === 0) {
            return BotKind.HeadlessChrome;
        }
    }

    function detectMimeTypesConsistent(_a) {
        var mimeTypesConsistent = _a.mimeTypesConsistent;
        if (mimeTypesConsistent.state === 0 /* State.Success */ && !mimeTypesConsistent.value) {
            return BotKind.Unknown;
        }
    }

    function detectNotificationPermissions(_a) {
        var notificationPermissions = _a.notificationPermissions, browserKind = _a.browserKind;
        if (browserKind.state !== 0 /* State.Success */ || browserKind.value !== "chrome" /* BrowserKind.Chrome */)
            return false;
        if (notificationPermissions.state === 0 /* State.Success */ && notificationPermissions.value) {
            return BotKind.HeadlessChrome;
        }
    }

    function detectPluginsArray(_a) {
        var pluginsArray = _a.pluginsArray;
        if (pluginsArray.state === 0 /* State.Success */ && !pluginsArray.value)
            return BotKind.HeadlessChrome;
    }

    function detectPluginsLengthInconsistency(_a) {
        var pluginsLength = _a.pluginsLength, android = _a.android, browserKind = _a.browserKind, browserEngineKind = _a.browserEngineKind;
        if (pluginsLength.state !== 0 /* State.Success */ ||
            android.state !== 0 /* State.Success */ ||
            browserKind.state !== 0 /* State.Success */ ||
            browserEngineKind.state !== 0 /* State.Success */)
            return;
        if (browserKind.value !== "chrome" /* BrowserKind.Chrome */ ||
            android.value ||
            browserEngineKind.value !== "chromium" /* BrowserEngineKind.Chromium */)
            return;
        if (pluginsLength.value === 0)
            return BotKind.HeadlessChrome;
    }

    function detectProcess(_a) {
        var _b;
        var process = _a.process;
        if (process.state !== 0 /* State.Success */)
            return false;
        if (process.value.type === 'renderer' || ((_b = process.value.versions) === null || _b === void 0 ? void 0 : _b.electron) != null)
            return BotKind.Electron;
    }

    function detectProductSub(_a) {
        var productSub = _a.productSub, browserKind = _a.browserKind;
        if (productSub.state !== 0 /* State.Success */ || browserKind.state !== 0 /* State.Success */)
            return false;
        if ((browserKind.value === "chrome" /* BrowserKind.Chrome */ ||
            browserKind.value === "safari" /* BrowserKind.Safari */ ||
            browserKind.value === "opera" /* BrowserKind.Opera */ ||
            browserKind.value === "wechat" /* BrowserKind.WeChat */) &&
            productSub.value !== '20030107')
            return BotKind.Unknown;
    }

    function detectUserAgent(_a) {
        var userAgent = _a.userAgent;
        if (userAgent.state !== 0 /* State.Success */)
            return false;
        if (/PhantomJS/i.test(userAgent.value))
            return BotKind.PhantomJS;
        if (/Headless/i.test(userAgent.value))
            return BotKind.HeadlessChrome;
        if (/Electron/i.test(userAgent.value))
            return BotKind.Electron;
        if (/slimerjs/i.test(userAgent.value))
            return BotKind.SlimerJS;
    }

    function detectWebDriver(_a) {
        var webDriver = _a.webDriver;
        if (webDriver.state === 0 /* State.Success */ && webDriver.value)
            return BotKind.HeadlessChrome;
    }

    function detectWebGL(_a) {
        var webGL = _a.webGL;
        if (webGL.state === 0 /* State.Success */) {
            var _b = webGL.value, vendor = _b.vendor, renderer = _b.renderer;
            if (vendor == 'Brian Paul' && renderer == 'Mesa OffScreen') {
                return BotKind.HeadlessChrome;
            }
        }
    }

    function detectWindowExternal(_a) {
        var windowExternal = _a.windowExternal;
        if (windowExternal.state !== 0 /* State.Success */)
            return false;
        if (/Sequentum/i.test(windowExternal.value))
            return BotKind.Sequentum;
    }

    function detectWindowSize(_a) {
        var windowSize = _a.windowSize, documentFocus = _a.documentFocus;
        if (windowSize.state !== 0 /* State.Success */ || documentFocus.state !== 0 /* State.Success */)
            return false;
        var _b = windowSize.value, outerWidth = _b.outerWidth, outerHeight = _b.outerHeight;
        // When a page is opened in a new tab without focusing it right away, the window outer size is 0x0
        if (!documentFocus.value)
            return;
        if (outerWidth === 0 && outerHeight === 0)
            return BotKind.HeadlessChrome;
    }

    function detectDistinctiveProperties(_a) {
        var distinctiveProps = _a.distinctiveProps;
        if (distinctiveProps.state !== 0 /* State.Success */)
            return false;
        var value = distinctiveProps.value;
        var bot;
        for (bot in value)
            if (value[bot])
                return bot;
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    var detectors = {
        detectAppVersion: detectAppVersion,
        detectDocumentAttributes: detectDocumentAttributes,
        detectErrorTrace: detectErrorTrace,
        detectEvalLengthInconsistency: detectEvalLengthInconsistency,
        detectFunctionBind: detectFunctionBind,
        detectLanguagesLengthInconsistency: detectLanguagesLengthInconsistency,
        detectNotificationPermissions: detectNotificationPermissions,
        detectPluginsArray: detectPluginsArray,
        detectPluginsLengthInconsistency: detectPluginsLengthInconsistency,
        detectProcess: detectProcess,
        detectUserAgent: detectUserAgent,
        detectWebDriver: detectWebDriver,
        detectWebGL: detectWebGL,
        detectWindowExternal: detectWindowExternal,
        detectWindowSize: detectWindowSize,
        detectMimeTypesConsistent: detectMimeTypesConsistent,
        detectProductSub: detectProductSub,
        detectDistinctiveProperties: detectDistinctiveProperties,
    };

    function getAppVersion() {
        var appVersion = navigator.appVersion;
        if (appVersion == undefined) {
            throw new BotdError(-1 /* State.Undefined */, 'navigator.appVersion is undefined');
        }
        return appVersion;
    }

    function getDocumentElementKeys() {
        if (document.documentElement === undefined) {
            throw new BotdError(-1 /* State.Undefined */, 'document.documentElement is undefined');
        }
        var documentElement = document.documentElement;
        if (typeof documentElement.getAttributeNames !== 'function') {
            throw new BotdError(-2 /* State.NotFunction */, 'document.documentElement.getAttributeNames is not a function');
        }
        return documentElement.getAttributeNames();
    }

    function getErrorTrace() {
        try {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            null[0]();
        }
        catch (error) {
            if (error instanceof Error && error['stack'] != null) {
                return error.stack.toString();
            }
        }
        throw new BotdError(-3 /* State.UnexpectedBehaviour */, 'errorTrace signal unexpected behaviour');
    }

    function getEvalLength() {
        return eval.toString().length;
    }

    function getFunctionBind() {
        if (Function.prototype.bind === undefined) {
            throw new BotdError(-2 /* State.NotFunction */, 'Function.prototype.bind is undefined');
        }
        return Function.prototype.bind.toString();
    }

    function getBrowserEngineKind() {
        var _a, _b;
        // Based on research in October 2020. Tested to detect Chromium 42-86.
        var w = window;
        var n = navigator;
        if (countTruthy$1([
            'webkitPersistentStorage' in n,
            'webkitTemporaryStorage' in n,
            n.vendor.indexOf('Google') === 0,
            'webkitResolveLocalFileSystemURL' in w,
            'BatteryManager' in w,
            'webkitMediaStream' in w,
            'webkitSpeechGrammar' in w,
        ]) >= 5) {
            return "chromium" /* BrowserEngineKind.Chromium */;
        }
        if (countTruthy$1([
            'ApplePayError' in w,
            'CSSPrimitiveValue' in w,
            'Counter' in w,
            n.vendor.indexOf('Apple') === 0,
            'getStorageUpdates' in n,
            'WebKitMediaKeys' in w,
        ]) >= 4) {
            return "webkit" /* BrowserEngineKind.Webkit */;
        }
        if (countTruthy$1([
            'buildID' in navigator,
            'MozAppearance' in ((_b = (_a = document.documentElement) === null || _a === void 0 ? void 0 : _a.style) !== null && _b !== void 0 ? _b : {}),
            'onmozfullscreenchange' in w,
            'mozInnerScreenX' in w,
            'CSSMozDocumentRule' in w,
            'CanvasCaptureMediaStream' in w,
        ]) >= 4) {
            return "gecko" /* BrowserEngineKind.Gecko */;
        }
        return "unknown" /* BrowserEngineKind.Unknown */;
    }
    function getBrowserKind() {
        var _a;
        var userAgent = (_a = navigator.userAgent) === null || _a === void 0 ? void 0 : _a.toLowerCase();
        if (strIncludes(userAgent, 'edg/')) {
            return "edge" /* BrowserKind.Edge */;
        }
        else if (strIncludes(userAgent, 'trident') || strIncludes(userAgent, 'msie')) {
            return "internet_explorer" /* BrowserKind.IE */;
        }
        else if (strIncludes(userAgent, 'wechat')) {
            return "wechat" /* BrowserKind.WeChat */;
        }
        else if (strIncludes(userAgent, 'firefox')) {
            return "firefox" /* BrowserKind.Firefox */;
        }
        else if (strIncludes(userAgent, 'opera') || strIncludes(userAgent, 'opr')) {
            return "opera" /* BrowserKind.Opera */;
        }
        else if (strIncludes(userAgent, 'chrome')) {
            return "chrome" /* BrowserKind.Chrome */;
        }
        else if (strIncludes(userAgent, 'safari')) {
            return "safari" /* BrowserKind.Safari */;
        }
        else {
            return "unknown" /* BrowserKind.Unknown */;
        }
    }
    // Source: https://github.com/fingerprintjs/fingerprintjs/blob/master/src/utils/browser.ts#L223
    function isAndroid$1() {
        var browserEngineKind = getBrowserEngineKind();
        var isItChromium = browserEngineKind === "chromium" /* BrowserEngineKind.Chromium */;
        var isItGecko = browserEngineKind === "gecko" /* BrowserEngineKind.Gecko */;
        // Only 2 browser engines are presented on Android.
        // Actually, there is also Android 4.1 browser, but it's not worth detecting it at the moment.
        if (!isItChromium && !isItGecko)
            return false;
        var w = window;
        // Chrome removes all words "Android" from `navigator` when desktop version is requested
        // Firefox keeps "Android" in `navigator.appVersion` when desktop version is requested
        return (countTruthy$1([
            'onorientationchange' in w,
            'orientation' in w,
            isItChromium && !('SharedWorker' in w),
            isItGecko && /android/i.test(navigator.appVersion),
        ]) >= 2);
    }
    function getDocumentFocus() {
        if (document.hasFocus === undefined) {
            return false;
        }
        return document.hasFocus();
    }
    function isChromium86OrNewer() {
        // Checked in Chrome 85 vs Chrome 86 both on desktop and Android
        var w = window;
        return (countTruthy$1([
            !('MediaSettingsRange' in w),
            'RTCEncodedAudioFrame' in w,
            '' + w.Intl === '[object Intl]',
            '' + w.Reflect === '[object Reflect]',
        ]) >= 3);
    }

    function getLanguages() {
        var n = navigator;
        var result = [];
        var language = n.language || n.userLanguage || n.browserLanguage || n.systemLanguage;
        if (language !== undefined) {
            result.push([language]);
        }
        if (Array.isArray(n.languages)) {
            var browserEngine = getBrowserEngineKind();
            // Starting from Chromium 86, there is only a single value in `navigator.language` in Incognito mode:
            // the value of `navigator.language`. Therefore, the value is ignored in this browser.
            if (!(browserEngine === "chromium" /* BrowserEngineKind.Chromium */ && isChromium86OrNewer())) {
                result.push(n.languages);
            }
        }
        else if (typeof n.languages === 'string') {
            var languages = n.languages;
            if (languages) {
                result.push(languages.split(','));
            }
        }
        return result;
    }

    function areMimeTypesConsistent() {
        if (navigator.mimeTypes === undefined) {
            throw new BotdError(-1 /* State.Undefined */, 'navigator.mimeTypes is undefined');
        }
        var mimeTypes = navigator.mimeTypes;
        var isConsistent = Object.getPrototypeOf(mimeTypes) === MimeTypeArray.prototype;
        for (var i = 0; i < mimeTypes.length; i++) {
            isConsistent && (isConsistent = Object.getPrototypeOf(mimeTypes[i]) === MimeType.prototype);
        }
        return isConsistent;
    }

    function getNotificationPermissions() {
        return __awaiter(this, void 0, void 0, function () {
            var permissions, permissionStatus;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (window.Notification === undefined) {
                            throw new BotdError(-1 /* State.Undefined */, 'window.Notification is undefined');
                        }
                        if (navigator.permissions === undefined) {
                            throw new BotdError(-1 /* State.Undefined */, 'navigator.permissions is undefined');
                        }
                        permissions = navigator.permissions;
                        if (typeof permissions.query !== 'function') {
                            throw new BotdError(-2 /* State.NotFunction */, 'navigator.permissions.query is not a function');
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, permissions.query({ name: 'notifications' })];
                    case 2:
                        permissionStatus = _a.sent();
                        return [2 /*return*/, window.Notification.permission === 'denied' && permissionStatus.state === 'prompt'];
                    case 3:
                        _a.sent();
                        throw new BotdError(-3 /* State.UnexpectedBehaviour */, 'notificationPermissions signal unexpected behaviour');
                    case 4: return [2 /*return*/];
                }
            });
        });
    }

    function getPluginsArray() {
        if (navigator.plugins === undefined) {
            throw new BotdError(-1 /* State.Undefined */, 'navigator.plugins is undefined');
        }
        if (window.PluginArray === undefined) {
            throw new BotdError(-1 /* State.Undefined */, 'window.PluginArray is undefined');
        }
        return navigator.plugins instanceof PluginArray;
    }

    function getPluginsLength() {
        if (navigator.plugins === undefined) {
            throw new BotdError(-1 /* State.Undefined */, 'navigator.plugins is undefined');
        }
        if (navigator.plugins.length === undefined) {
            throw new BotdError(-3 /* State.UnexpectedBehaviour */, 'navigator.plugins.length is undefined');
        }
        return navigator.plugins.length;
    }

    function getProcess() {
        var process = window.process;
        var errorPrefix = 'window.process is';
        if (process === undefined) {
            throw new BotdError(-1 /* State.Undefined */, "".concat(errorPrefix, " undefined"));
        }
        if (process && typeof process !== 'object') {
            throw new BotdError(-3 /* State.UnexpectedBehaviour */, "".concat(errorPrefix, " not an object"));
        }
        return process;
    }

    function getProductSub() {
        var productSub = navigator.productSub;
        if (productSub === undefined) {
            throw new BotdError(-1 /* State.Undefined */, 'navigator.productSub is undefined');
        }
        return productSub;
    }

    function getRTT() {
        if (navigator.connection === undefined) {
            throw new BotdError(-1 /* State.Undefined */, 'navigator.connection is undefined');
        }
        if (navigator.connection.rtt === undefined) {
            throw new BotdError(-1 /* State.Undefined */, 'navigator.connection.rtt is undefined');
        }
        return navigator.connection.rtt;
    }

    function getUserAgent() {
        return navigator.userAgent;
    }

    function getWebDriver() {
        if (navigator.webdriver == undefined) {
            throw new BotdError(-1 /* State.Undefined */, 'navigator.webdriver is undefined');
        }
        return navigator.webdriver;
    }

    function getWebGL() {
        var canvasElement = document.createElement('canvas');
        if (typeof canvasElement.getContext !== 'function') {
            throw new BotdError(-2 /* State.NotFunction */, 'HTMLCanvasElement.getContext is not a function');
        }
        var webGLContext = canvasElement.getContext('webgl');
        if (webGLContext === null) {
            throw new BotdError(-4 /* State.Null */, 'WebGLRenderingContext is null');
        }
        if (typeof webGLContext.getParameter !== 'function') {
            throw new BotdError(-2 /* State.NotFunction */, 'WebGLRenderingContext.getParameter is not a function');
        }
        var vendor = webGLContext.getParameter(webGLContext.VENDOR);
        var renderer = webGLContext.getParameter(webGLContext.RENDERER);
        return { vendor: vendor, renderer: renderer };
    }

    function getWindowExternal() {
        if (window.external === undefined) {
            throw new BotdError(-1 /* State.Undefined */, 'window.external is undefined');
        }
        var external = window.external;
        if (typeof external.toString !== 'function') {
            throw new BotdError(-2 /* State.NotFunction */, 'window.external.toString is not a function');
        }
        return external.toString();
    }

    function getWindowSize() {
        return {
            outerWidth: window.outerWidth,
            outerHeight: window.outerHeight,
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight,
        };
    }

    function checkDistinctiveProperties() {
        var _a;
        // The order in the following list matters, because specific types of bots come first, followed by automation technologies.
        var distinctivePropsList = (_a = {},
            _a[BotKind.Awesomium] = {
                window: ['awesomium'],
            },
            _a[BotKind.Cef] = {
                window: ['RunPerfTest'],
            },
            _a[BotKind.CefSharp] = {
                window: ['CefSharp'],
            },
            _a[BotKind.CoachJS] = {
                window: ['emit'],
            },
            _a[BotKind.FMiner] = {
                window: ['fmget_targets'],
            },
            _a[BotKind.Geb] = {
                window: ['geb'],
            },
            _a[BotKind.NightmareJS] = {
                window: ['__nightmare', 'nightmare'],
            },
            _a[BotKind.Phantomas] = {
                window: ['__phantomas'],
            },
            _a[BotKind.PhantomJS] = {
                window: ['callPhantom', '_phantom'],
            },
            _a[BotKind.Rhino] = {
                window: ['spawn'],
            },
            _a[BotKind.Selenium] = {
                window: ['_Selenium_IDE_Recorder', '_selenium', 'calledSelenium', /^([a-z]){3}_.*_(Array|Promise|Symbol)$/],
                document: ['__selenium_evaluate', 'selenium-evaluate', '__selenium_unwrapped'],
            },
            _a[BotKind.WebDriverIO] = {
                window: ['wdioElectron'],
            },
            _a[BotKind.WebDriver] = {
                window: [
                    'webdriver',
                    '__webdriverFunc',
                    '__lastWatirAlert',
                    '__lastWatirConfirm',
                    '__lastWatirPrompt',
                    '_WEBDRIVER_ELEM_CACHE',
                    'ChromeDriverw',
                ],
                document: [
                    '__webdriver_script_fn',
                    '__driver_evaluate',
                    '__webdriver_evaluate',
                    '__fxdriver_evaluate',
                    '__driver_unwrapped',
                    '__webdriver_unwrapped',
                    '__fxdriver_unwrapped',
                    '__webdriver_script_fn',
                    '__webdriver_script_func',
                    '__webdriver_script_function',
                    '$cdc_asdjflasutopfhvcZLmcf',
                    '$cdc_asdjflasutopfhvcZLmcfl_',
                    '$chrome_asyncScriptInfo',
                    '__$webdriverAsyncExecutor',
                ],
            },
            _a[BotKind.HeadlessChrome] = {
                window: ['domAutomation', 'domAutomationController'],
            },
            _a);
        var botName;
        var result = {};
        var windowProps = getObjectProps(window);
        var documentProps = [];
        if (window.document !== undefined)
            documentProps = getObjectProps(window.document);
        for (botName in distinctivePropsList) {
            var props = distinctivePropsList[botName];
            if (props !== undefined) {
                var windowContains = props.window === undefined ? false : includes.apply(void 0, __spreadArray([windowProps], props.window, false));
                var documentContains = props.document === undefined || !documentProps.length ? false : includes.apply(void 0, __spreadArray([documentProps], props.document, false));
                result[botName] = windowContains || documentContains;
            }
        }
        return result;
    }

    var sources = {
        android: isAndroid$1,
        browserKind: getBrowserKind,
        browserEngineKind: getBrowserEngineKind,
        documentFocus: getDocumentFocus,
        userAgent: getUserAgent,
        appVersion: getAppVersion,
        rtt: getRTT,
        windowSize: getWindowSize,
        pluginsLength: getPluginsLength,
        pluginsArray: getPluginsArray,
        errorTrace: getErrorTrace,
        productSub: getProductSub,
        windowExternal: getWindowExternal,
        mimeTypesConsistent: areMimeTypesConsistent,
        evalLength: getEvalLength,
        webGL: getWebGL,
        webDriver: getWebDriver,
        languages: getLanguages,
        notificationPermissions: getNotificationPermissions,
        documentElementKeys: getDocumentElementKeys,
        functionBind: getFunctionBind,
        process: getProcess,
        distinctiveProps: checkDistinctiveProperties,
    };

    /**
     * Class representing a bot detector.
     *
     * @class
     * @implements {BotDetectorInterface}
     */
    var BotDetector = /** @class */ (function () {
        function BotDetector() {
            this.components = undefined;
            this.detections = undefined;
        }
        BotDetector.prototype.getComponents = function () {
            return this.components;
        };
        BotDetector.prototype.getDetections = function () {
            return this.detections;
        };
        /**
         * @inheritdoc
         */
        BotDetector.prototype.detect = function () {
            if (this.components === undefined) {
                throw new Error("BotDetector.detect can't be called before BotDetector.collect");
            }
            var _a = detect(this.components, detectors), detections = _a[0], finalDetection = _a[1];
            this.detections = detections;
            return finalDetection;
        };
        /**
         * @inheritdoc
         */
        BotDetector.prototype.collect = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _a = this;
                            return [4 /*yield*/, collect(sources)];
                        case 1:
                            _a.components = _b.sent();
                            return [2 /*return*/, this.components];
                    }
                });
            });
        };
        return BotDetector;
    }());

    /**
     * Sends an unpersonalized AJAX request to collect installation statistics
     */
    function monitor() {
        // The FingerprintJS CDN (https://github.com/fingerprintjs/cdn) replaces `window.__fpjs_d_m` with `true`
        if (window.__fpjs_d_m || Math.random() >= 0.001) {
            return;
        }
        try {
            var request = new XMLHttpRequest();
            request.open('get', "https://m1.openfpcdn.io/botd/v".concat(version, "/npm-monitoring"), true);
            request.send();
        }
        catch (error) {
            // console.error is ok here because it's an unexpected error handler
            // eslint-disable-next-line no-console
            console.error(error);
        }
    }
    function load(_a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.monitoring, monitoring = _c === void 0 ? true : _c;
        return __awaiter(this, void 0, void 0, function () {
            var detector;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        if (monitoring) {
                            monitor();
                        }
                        detector = new BotDetector();
                        return [4 /*yield*/, detector.collect()];
                    case 1:
                        _d.sent();
                        return [2 /*return*/, detector];
                }
            });
        });
    }

    async function botDetection$1() {
        try {
            const botd = await load();
            const result = botd.detect();
            if (result.bot) {
                return {
                    status: true,
                    botKind: result.botKind,
                };
            }
            else {
                return {
                    status: false,
                };
            }
        }
        catch (error) {
            console.error(error);
            return null;
        }
    }

    /**
     * Detect browser using multiple techniques to be resilient against spoofing and user agent changes
     */
    function getBrowserName() {
        const details = detectBrowser$1();
        return details.name;
    }
    /**
     * Enhanced browser detection that uses multiple techniques to identify the browser
     * with high confidence even when user agent is spoofed or in mobile simulation mode
     */
    function detectBrowser$1() {
        // Default result with low confidence
        const result = {
            name: 'Unknown',
            version: 'Unknown',
            confidence: 0,
            engine: 'Unknown'
        };
        // Collection of detection results with confidence scores
        const detections = [];
        // First check for Edge in user agent (this is a fast check before other more intensive checks)
        const ua = navigator.userAgent.toLowerCase();
        if (ua.indexOf('edg/') !== -1 || ua.indexOf('edge/') !== -1) {
            detections.push({ name: 'Edge', confidence: 75 });
        }
        // 1. Engine detection based on error messages (more reliable than UA)
        const engineSignatures = getEngineSignatures();
        detectByEngineSignatures(detections, engineSignatures);
        // 2. Feature detection for specific browsers
        detectByFeatures(detections);
        // 3. Protocol handler detection
        detectByProtocolHandlers(detections);
        // 4. CSS property detection
        detectByCssProperties(detections);
        // 5. Performance timing
        detectByPerformance(detections);
        // 6. JavaScript behavior patterns
        detectByJsBehavior(detections);
        // 7. Edge-specific detection - separate function to better differentiate Edge from Chrome
        detectEdgeBrowser(detections);
        // 8. Chrome-specific detection - enhanced Chrome detection
        detectChromeBrowser(detections);
        // 9. Brave-specific detection - get specific Brave signals
        detectBraveBrowser(detections);
        // Combine all detection results and calculate final browser with confidence
        if (detections.length > 0) {
            // Group by browser name and sum confidence
            const grouped = detections.reduce((acc, curr) => {
                acc[curr.name] = (acc[curr.name] || 0) + curr.confidence;
                return acc;
            }, {});
            // Find the browser with highest confidence
            let maxConfidence = 0;
            let detectedBrowser = 'Unknown';
            for (const [browser, confidence] of Object.entries(grouped)) {
                if (confidence > maxConfidence) {
                    maxConfidence = confidence;
                    detectedBrowser = browser;
                }
            }
            // Extra Edge check - check if incognito detection can confirm this is Edge
            if (detectedBrowser === 'Chrome' && isActuallyEdge()) {
                detectedBrowser = 'Edge';
            }
            result.name = detectedBrowser;
            result.confidence = Math.min(100, maxConfidence);
            // Set engine based on browser
            if (['Chrome', 'Edge', 'Opera', 'Brave'].includes(detectedBrowser)) {
                result.engine = 'Blink';
            }
            else if (detectedBrowser === 'Firefox') {
                result.engine = 'Gecko';
            }
            else if (detectedBrowser === 'Safari') {
                result.engine = 'WebKit';
            }
            // Try to extract version
            result.version = getBrowserVersion(detectedBrowser);
        }
        return result;
    }
    /**
     * Special detection for Brave browser
     */
    function detectBraveBrowser(detections) {
        try {
            // Check for Brave API directly
            if (navigator.brave) {
                detections.push({ name: 'Brave', confidence: 95 });
                return;
            }
            // Check for specific Brave patterns in the user agent
            const ua = navigator.userAgent;
            if (ua.includes('Brave') || ua.includes('brave')) {
                detections.push({ name: 'Brave', confidence: 90 });
                return;
            }
            // Brave specific behavior checks
            // 1. Brave removes certain tracking headers
            // 2. Brave blocks fingerprinting by default
            // 3. Brave has specific privacy features
            // Check for Chrome without Google Chrome-specific features
            if (typeof window.chrome !== 'undefined' &&
                window.chrome.runtime &&
                !window.google) {
                // Additional check for absence of Chrome-specific features
                const hasNoChromeFeatures = !('google' in window) &&
                    !window.chrome.webstore &&
                    typeof navigator.brave !== 'undefined';
                if (hasNoChromeFeatures) {
                    detections.push({ name: 'Brave', confidence: 60 });
                }
            }
        }
        catch (e) {
            // Ignore detection errors
        }
    }
    /**
     * Specific check to determine if a browser is Edge by using the same techniques
     * that incognito detection uses, which seems to report Edge correctly
     */
    function isActuallyEdge() {
        try {
            // Check user agent for Edge keywords
            const ua = navigator.userAgent.toLowerCase();
            if (ua.indexOf('edg/') !== -1 || ua.indexOf('edge/') !== -1) {
                return true;
            }
            // Check if any MS-specific APIs or DOM elements are available
            if (window.msCredentials ||
                document.documentMode ||
                typeof window.MSInputMethodContext !== 'undefined' ||
                typeof navigator.msLaunchUri === 'function') {
                return true;
            }
            // Check Edge-specific combination of features
            if (typeof window.chrome !== 'undefined' &&
                window.chrome.runtime &&
                !window.chrome.webstore &&
                !window.opr &&
                !window.opera) {
                // Additional Edge-specific check
                try {
                    // Edge typically does not have the Chrome PDF viewer plugin
                    const hasChromePdfViewer = Array.from(navigator.plugins)
                        .some(plugin => plugin.name === 'Chrome PDF Viewer');
                    // Check for unique Edge plugin patterns
                    const hasEdgePluginPattern = Array.from(navigator.plugins)
                        .some(plugin => plugin.name.indexOf('Edge') !== -1);
                    if (!hasChromePdfViewer || hasEdgePluginPattern) {
                        return true;
                    }
                }
                catch (e) {
                    // Plugin check failed
                }
            }
            return false;
        }
        catch (e) {
            return false;
        }
    }
    /**
     * Gets browser error behavior signature from various engine-specific behaviors
     */
    function getEngineSignatures() {
        // Error message length from toFixed with negative values
        let toFixedErrorLength = 0;
        try {
            const neg = parseInt("-1");
            neg.toFixed(neg);
        }
        catch (e) {
            toFixedErrorLength = e.message.length;
        }
        // Function.toString() behavior - varies by browser
        let functionToStringLength = 0;
        try {
            functionToStringLength = Function.prototype.toString.call(Function).length;
        }
        catch (e) {
            // Ignore error
        }
        return {
            toFixedErrorLength,
            functionToStringLength
        };
    }
    /**
     * Detects browsers based on engine-specific error message patterns
     */
    function detectByEngineSignatures(detections, signatures) {
        // Safari typically has error message length of 44
        if (signatures.toFixedErrorLength === 44) {
            detections.push({ name: 'Safari', confidence: 40 });
        }
        // Chrome typically has error message length of 51
        else if (signatures.toFixedErrorLength === 51) {
            detections.push({ name: 'Chrome', confidence: 30 }); // Increased from 15
        }
        // Firefox typically has error message length of 25
        else if (signatures.toFixedErrorLength === 25) {
            detections.push({ name: 'Firefox', confidence: 30 });
        }
        // Function.toString length can help differentiate browsers too
        if (signatures.functionToStringLength > 30 && signatures.functionToStringLength < 40) {
            detections.push({ name: 'Firefox', confidence: 10 });
        }
        else if (signatures.functionToStringLength > 40) {
            detections.push({ name: 'Chrome', confidence: 15 }); // Increased from 5
        }
    }
    /**
     * Detects browser by checking for browser-specific features and APIs
     */
    function detectByFeatures(detections) {
        // Brave detection
        if (navigator.brave &&
            typeof navigator.brave.isBrave === 'function') {
            detections.push({ name: 'Brave', confidence: 90 });
        }
        // Check for Chrome-specific APIs
        if (typeof window.chrome !== 'undefined' &&
            window.chrome.app &&
            window.chrome.runtime) {
            // First check if it's not actually Edge
            const ua = navigator.userAgent.toLowerCase();
            if (ua.indexOf('edg/') === -1 && ua.indexOf('edge/') === -1) {
                if (navigator.brave === undefined) {
                    detections.push({ name: 'Chrome', confidence: 40 }); // Increased from 25
                }
            }
            else {
                // This is more likely Edge than Chrome
                detections.push({ name: 'Edge', confidence: 40 });
            }
        }
        // Additional Chrome-specific feature detection
        if (window.chrome &&
            window.chrome.csi &&
            window.chrome.loadTimes &&
            !window.opr &&
            !window.opera &&
            !(navigator.brave && typeof navigator.brave.isBrave === 'function')) {
            // These features are very specific to Chrome and not present in most other Chromium browsers
            detections.push({ name: 'Chrome', confidence: 60 });
        }
        // Firefox-specific objects
        if (typeof window.InstallTrigger !== 'undefined' ||
            typeof window.sidebar !== 'undefined') {
            detections.push({ name: 'Firefox', confidence: 70 });
        }
        // Safari detection
        if (/constructor/i.test(window.HTMLElement) ||
            (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!(typeof window.safari === 'undefined') && window.safari.pushNotification)) {
            detections.push({ name: 'Safari', confidence: 70 });
        }
        // Basic Edge detection - more detailed in detectEdgeBrowser function
        if (window.msCredentials || document.documentMode) {
            detections.push({ name: 'Edge', confidence: 60 }); // Increased confidence
        }
        // Opera detection
        if (window.opr || window.opera) {
            detections.push({ name: 'Opera', confidence: 60 });
        }
    }
    /**
     * Detects browser by checking for browser-specific protocol handlers
     */
    function detectByProtocolHandlers(detections) {
        // Chrome/Chromium protocols
        if (typeof navigator.registerProtocolHandler === 'function') {
            try {
                if ('chrome' in window) {
                    // Only consider chrome protocol if not Edge
                    const ua = navigator.userAgent.toLowerCase();
                    if (ua.indexOf('edg/') === -1 && ua.indexOf('edge/') === -1) {
                        detections.push({ name: 'Chrome', confidence: 25 }); // Increased from 15
                    }
                }
                // Edge has ms-* protocols available
                if ('ms-access' in navigator ||
                    'ms-browser-extension' in navigator ||
                    'ms-calculator' in navigator ||
                    'ms-drive-to' in navigator ||
                    'ms-excel' in navigator ||
                    'ms-gamebarservices' in navigator ||
                    'ms-search' in navigator ||
                    'ms-word' in navigator) {
                    detections.push({ name: 'Edge', confidence: 80 }); // Increased confidence
                }
                // Opera has specific protocol handlers
                if ('opr:' in navigator.plugins ||
                    'opera:' in navigator.plugins) {
                    detections.push({ name: 'Opera', confidence: 25 });
                }
            }
            catch (e) {
                // Protocol detection failed
            }
        }
    }
    /**
     * Detects browser by checking for browser-specific CSS properties
     */
    function detectByCssProperties(detections) {
        const docStyle = window.getComputedStyle(document.documentElement);
        // Webkit-specific properties
        if (docStyle.getPropertyValue('--apple-trailing-word') !== '' ||
            docStyle.getPropertyValue('-webkit-app-region') !== '') {
            detections.push({ name: 'Safari', confidence: 20 });
        }
        // Firefox-specific properties
        if (docStyle.getPropertyValue('-moz-context-properties') !== '' ||
            docStyle.getPropertyValue('-moz-user-focus') !== '') {
            detections.push({ name: 'Firefox', confidence: 20 });
        }
        // Edge-specific CSS properties
        if (docStyle.getPropertyValue('-ms-ime-align') !== '' ||
            docStyle.getPropertyValue('-ms-flow-from') !== '') {
            detections.push({ name: 'Edge', confidence: 60 }); // Increased confidence
        }
    }
    /**
     * Detects browser by analyzing performance characteristics
     */
    function detectByPerformance(detections) {
        // Chrome/Chromium-based browsers expose memory info
        if (performance.memory &&
            performance.memory.jsHeapSizeLimit) {
            // Different Chromium browsers have different heap size limits
            const heapLimit = performance.memory.jsHeapSizeLimit;
            if (heapLimit > 2000000000) {
                // Check if it's not actually Edge before assuming Chrome
                const ua = navigator.userAgent.toLowerCase();
                if (ua.indexOf('edg/') === -1 && ua.indexOf('edge/') === -1) {
                    detections.push({ name: 'Chrome', confidence: 20 }); // Increased from 10
                }
            }
        }
        // Chrome-specific performance timing features
        if (typeof window.chrome !== 'undefined' &&
            typeof window.chrome.loadTimes === 'function') {
            try {
                const chromeLoad = window.chrome.loadTimes();
                if (chromeLoad &&
                    typeof chromeLoad.firstPaintTime === 'number' &&
                    typeof chromeLoad.requestTime === 'number') {
                    detections.push({ name: 'Chrome', confidence: 30 });
                }
            }
            catch (e) {
                // Performance timing check failed
            }
        }
    }
    /**
     * Detects browser by JavaScript behavior patterns
     */
    function detectByJsBehavior(detections) {
        // Firefox specific behavior with error stack
        try {
            throw new Error();
        }
        catch (err) {
            if (err.stack && err.stack.indexOf('()@') >= 0) {
                detections.push({ name: 'Firefox', confidence: 15 });
            }
            // Chrome-specific stack trace format
            if (err.stack && err.stack.indexOf('at new') >= 0) {
                // Check if it's not actually Edge
                const ua = navigator.userAgent.toLowerCase();
                if (ua.indexOf('edg/') === -1 && ua.indexOf('edge/') === -1) {
                    detections.push({ name: 'Chrome', confidence: 20 }); // Increased from 10
                }
            }
            // Safari-specific stack trace format
            if (err.stack && err.stack.indexOf('@') === -1 && err.stack.indexOf('at ') === -1) {
                detections.push({ name: 'Safari', confidence: 15 });
            }
        }
        // Brave shields detection
        if (document.createElement('canvas').toDataURL().length > 15 &&
            navigator.brave === undefined &&
            typeof window.chrome !== 'undefined') {
            // Try to detect if Brave shields are on
            const img = new Image();
            let loadCount = 0;
            img.onload = () => {
                loadCount++;
                if (loadCount === 0) {
                    detections.push({ name: 'Brave', confidence: 20 });
                }
            };
            img.onerror = () => {
                detections.push({ name: 'Brave', confidence: 10 });
            };
            // Try loading a tracking pixel
            img.src = "https://www.facebook.com/tr?id=1234567890&ev=PageView";
        }
        // Additional Chrome-specific behavior check (Chrome DevTools Protocol)
        try {
            // Check if __JQUERY_OBJECT__ is defined (used in Chrome Developer Tools)
            // This will throw an error in most other browsers
            const hasDevTools = !!window.__JQUERY_OBJECT__;
            if (hasDevTools) {
                detections.push({ name: 'Chrome', confidence: 15 });
            }
        }
        catch (e) {
            // DevTools check failed
        }
        // Check Chrome user agent pattern more directly when combined with other Chrome features
        if (navigator.userAgent.indexOf('Chrome') !== -1 &&
            navigator.userAgent.indexOf('Edg') === -1 &&
            navigator.userAgent.indexOf('OPR') === -1 &&
            navigator.userAgent.indexOf('Brave') === -1 &&
            typeof window.chrome !== 'undefined' &&
            window.chrome.runtime) {
            detections.push({ name: 'Chrome', confidence: 35 });
        }
    }
    /**
     * Specialized Edge browser detection to differentiate it from Chrome
     */
    function detectEdgeBrowser(detections) {
        // Check for Edge in User Agent as a supplementary signal (still useful)
        const ua = navigator.userAgent.toLowerCase();
        if (ua.indexOf('edg/') !== -1 || ua.indexOf('edge/') !== -1) {
            detections.push({ name: 'Edge', confidence: 80 }); // Increased from 30 to 80
        }
        // Check for Edge-specific objects
        try {
            // Check for CSS.supports method with -ms vendor prefix
            if (CSS.supports('-ms-ime-align', 'auto')) {
                detections.push({ name: 'Edge', confidence: 70 }); // Increased confidence
            }
        }
        catch (e) {
            // CSS.supports might not be available
        }
        // Check for Edge-specific behaviors
        try {
            // Test if msLaunchUri is available (Edge-specific)
            if (typeof navigator.msLaunchUri === 'function') {
                detections.push({ name: 'Edge', confidence: 85 }); // Increased confidence
            }
            // Test if MS-specific APIs are available
            if (typeof window.MSInputMethodContext !== 'undefined') {
                detections.push({ name: 'Edge', confidence: 80 }); // Increased confidence
            }
            // Check for Edge-specific storage behavior
            if (document.documentMode || /edge/i.test(navigator.userAgent)) {
                detections.push({ name: 'Edge', confidence: 75 }); // Increased confidence
            }
            // Check window.chrome properties patterns specific to Edge
            if (typeof window.chrome !== 'undefined' &&
                window.chrome.runtime &&
                !window.chrome.webstore) {
                // This combination is more common in Edge than Chrome
                detections.push({ name: 'Edge', confidence: 60 }); // Increased confidence
            }
        }
        catch (e) {
            // Ignore errors in detection
        }
        // Get text rendering metrics - Edge and Chrome render text differently
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (ctx) {
                canvas.width = 200;
                canvas.height = 50;
                ctx.font = '20px Arial';
                ctx.textBaseline = 'top';
                ctx.fillText('EdgeBrowserTest', 0, 0);
                // Get image data to analyze text rendering
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
                // Create a simple hash of the first few pixels
                let hash = 0;
                for (let i = 0; i < 400; i += 4) {
                    hash = ((hash << 5) - hash) + imageData[i];
                }
                // Edge typically has different text rendering than Chrome
                if (hash < 0) { // Just an example threshold, would need calibration
                    detections.push({ name: 'Edge', confidence: 50 }); // Increased confidence
                }
            }
        }
        catch (e) {
            // Canvas access might be restricted
        }
    }
    /**
     * Enhanced detection for Chrome browser
     */
    function detectChromeBrowser(detections) {
        // Complex feature combination check specific to Chrome but not other Chromium browsers
        if (
        // Must have Chrome in user agent but not be Edge or Opera
        navigator.userAgent.indexOf('Chrome') !== -1 &&
            navigator.userAgent.indexOf('Edg') === -1 &&
            navigator.userAgent.indexOf('OPR') === -1 &&
            // Must have chrome object with specific properties
            typeof window.chrome !== 'undefined' &&
            window.chrome.runtime &&
            // Check for Chrome-exclusive features
            typeof window.chrome.loadTimes === 'function' &&
            typeof window.chrome.csi === 'function' &&
            // Ensure not Brave
            typeof navigator.brave === 'undefined') {
            detections.push({ name: 'Chrome', confidence: 75 });
        }
        // Check for Chrome PDF viewer plugin (generally not present in other Chromium browsers)
        try {
            const hasPdfViewer = Array.from(navigator.plugins)
                .some(plugin => plugin.name === 'Chrome PDF Viewer');
            if (hasPdfViewer &&
                navigator.userAgent.indexOf('Chrome') !== -1 &&
                navigator.userAgent.indexOf('Edg') === -1) {
                detections.push({ name: 'Chrome', confidence: 60 });
            }
        }
        catch (e) {
            // Plugin check failed
        }
        // Check Chrome version consistency in User Agent
        // This helps differentiate from browsers that modify the Chrome version string
        try {
            const chromeMatch = navigator.userAgent.match(/Chrome\/([0-9.]+)/);
            if (chromeMatch) {
                const chromeVersion = chromeMatch[1];
                // If app version contains the Chrome version and doesn't have Edg
                if (navigator.appVersion.indexOf(chromeVersion) !== -1 &&
                    navigator.userAgent.indexOf('Edg') === -1 &&
                    navigator.userAgent.indexOf('OPR') === -1) {
                    detections.push({ name: 'Chrome', confidence: 30 });
                }
            }
        }
        catch (e) {
            // Version check failed
        }
    }
    /**
     * Attempts to get the browser version
     */
    function getBrowserVersion(browserName) {
        const userAgent = navigator.userAgent;
        let version = 'Unknown';
        try {
            if (browserName === 'Chrome') {
                const match = userAgent.match(/Chrome\/([0-9.]+)/);
                if (match) {
                    version = match[1];
                }
            }
            else if (browserName === 'Firefox') {
                const match = userAgent.match(/Firefox\/([0-9.]+)/);
                if (match) {
                    version = match[1];
                }
            }
            else if (browserName === 'Safari') {
                const match = userAgent.match(/Version\/([0-9.]+)/);
                if (match) {
                    version = match[1];
                }
            }
            else if (browserName === 'Edge') {
                // Modern Edge (Chromium-based)
                const edgeMatch = userAgent.match(/Edg(?:e)?\/([0-9.]+)/);
                if (edgeMatch) {
                    version = edgeMatch[1];
                }
            }
            else if (browserName === 'Opera') {
                const match = userAgent.match(/OPR\/([0-9.]+)/);
                if (match) {
                    version = match[1];
                }
            }
            else if (browserName === 'Brave') {
                // First try to get version through Brave API if available
                if (navigator.brave && navigator.brave.version) {
                    version = navigator.brave.version;
                }
                else {
                    // Otherwise extract from user agent like Chrome
                    // Brave uses the same Chrome version string but with Brave/[version]
                    const braveMatch = userAgent.match(/Brave\/([0-9.]+)/);
                    if (braveMatch) {
                        version = braveMatch[1];
                    }
                    else {
                        // Fall back to Chrome version
                        const chromeMatch = userAgent.match(/Chrome\/([0-9.]+)/);
                        if (chromeMatch) {
                            version = chromeMatch[1];
                        }
                    }
                    // Try to access the Brave browser version via JavaScript API if available
                    if (typeof navigator.brave !== 'undefined') {
                        try {
                            // Request brave version info
                            navigator.brave.isBrave().then((isBrave) => {
                                if (isBrave) {
                                    // Remove console log
                                }
                            });
                        }
                        catch (e) {
                            // API access failed
                        }
                    }
                }
            }
        }
        catch (e) {
            // Keep default 'Unknown' value
        }
        return version;
    }

    // Generated ESM version of ua-parser-js
    // DO NOT EDIT THIS FILE!
    // Source: /src/main/ua-parser.js

    /////////////////////////////////////////////////////////////////////////////////
    /* UAParser.js v2.0.3
       Copyright © 2012-2025 Faisal Salman <f@faisalman.com>
       AGPLv3 License *//*
       Detect Browser, Engine, OS, CPU, and Device type/model from User-Agent data.
       Supports browser & node.js environment. 
       Demo   : https://uaparser.dev
       Source : https://github.com/faisalman/ua-parser-js */
    /////////////////////////////////////////////////////////////////////////////////

    /* jshint esversion: 6 */ 
    /* globals window */


        
        //////////////
        // Constants
        /////////////

        var LIBVERSION  = '2.0.3',
            UA_MAX_LENGTH = 500,
            USER_AGENT  = 'user-agent',
            EMPTY       = '',
            UNKNOWN     = '?',

            // typeof
            FUNC_TYPE   = 'function',
            UNDEF_TYPE  = 'undefined',
            OBJ_TYPE    = 'object',
            STR_TYPE    = 'string',

            // properties
            UA_BROWSER  = 'browser',
            UA_CPU      = 'cpu',
            UA_DEVICE   = 'device',
            UA_ENGINE   = 'engine',
            UA_OS       = 'os',
            UA_RESULT   = 'result',
            
            NAME        = 'name',
            TYPE        = 'type',
            VENDOR      = 'vendor',
            VERSION     = 'version',
            ARCHITECTURE= 'architecture',
            MAJOR       = 'major',
            MODEL       = 'model',

            // device types
            CONSOLE     = 'console',
            MOBILE      = 'mobile',
            TABLET      = 'tablet',
            SMARTTV     = 'smarttv',
            WEARABLE    = 'wearable',
            XR          = 'xr',
            EMBEDDED    = 'embedded',

            // browser types
            INAPP       = 'inapp',

            // client hints
            BRANDS      = 'brands',
            FORMFACTORS = 'formFactors',
            FULLVERLIST = 'fullVersionList',
            PLATFORM    = 'platform',
            PLATFORMVER = 'platformVersion',
            BITNESS     = 'bitness',
            CH_HEADER   = 'sec-ch-ua',
            CH_HEADER_FULL_VER_LIST = CH_HEADER + '-full-version-list',
            CH_HEADER_ARCH      = CH_HEADER + '-arch',
            CH_HEADER_BITNESS   = CH_HEADER + '-' + BITNESS,
            CH_HEADER_FORM_FACTORS = CH_HEADER + '-form-factors',
            CH_HEADER_MOBILE    = CH_HEADER + '-' + MOBILE,
            CH_HEADER_MODEL     = CH_HEADER + '-' + MODEL,
            CH_HEADER_PLATFORM  = CH_HEADER + '-' + PLATFORM,
            CH_HEADER_PLATFORM_VER = CH_HEADER_PLATFORM + '-version',
            CH_ALL_VALUES       = [BRANDS, FULLVERLIST, MOBILE, MODEL, PLATFORM, PLATFORMVER, ARCHITECTURE, FORMFACTORS, BITNESS],

            // device vendors
            AMAZON      = 'Amazon',
            APPLE       = 'Apple',
            ASUS        = 'ASUS',
            BLACKBERRY  = 'BlackBerry',
            GOOGLE      = 'Google',
            HUAWEI      = 'Huawei',
            LENOVO      = 'Lenovo',
            HONOR       = 'Honor',
            LG          = 'LG',
            MICROSOFT   = 'Microsoft',
            MOTOROLA    = 'Motorola',
            NVIDIA      = 'Nvidia',
            ONEPLUS     = 'OnePlus',
            OPPO        = 'OPPO',
            SAMSUNG     = 'Samsung',
            SHARP       = 'Sharp',
            SONY        = 'Sony',
            XIAOMI      = 'Xiaomi',
            ZEBRA       = 'Zebra',

            // browsers
            CHROME      = 'Chrome',
            CHROMIUM    = 'Chromium',
            CHROMECAST  = 'Chromecast',
            EDGE        = 'Edge',
            FIREFOX     = 'Firefox',
            OPERA       = 'Opera',
            FACEBOOK    = 'Facebook',
            SOGOU       = 'Sogou',

            PREFIX_MOBILE  = 'Mobile ',
            SUFFIX_BROWSER = ' Browser',

            // os
            WINDOWS     = 'Windows';
       
        var isWindow            = typeof window !== UNDEF_TYPE,
            NAVIGATOR           = (isWindow && window.navigator) ? 
                                    window.navigator : 
                                    undefined,
            NAVIGATOR_UADATA    = (NAVIGATOR && NAVIGATOR.userAgentData) ? 
                                    NAVIGATOR.userAgentData : 
                                    undefined;

        ///////////
        // Helper
        //////////

        var extend = function (defaultRgx, extensions) {
                var mergedRgx = {};
                var extraRgx = extensions;
                if (!isExtensions(extensions)) {
                    extraRgx = {};
                    for (var i in extensions) {
                        for (var j in extensions[i]) {
                            extraRgx[j] = extensions[i][j].concat(extraRgx[j] ? extraRgx[j] : []);
                        }
                    }
                }
                for (var k in defaultRgx) {
                    mergedRgx[k] = extraRgx[k] && extraRgx[k].length % 2 === 0 ? extraRgx[k].concat(defaultRgx[k]) : defaultRgx[k];
                }
                return mergedRgx;
            },
            enumerize = function (arr) {
                var enums = {};
                for (var i=0; i<arr.length; i++) {
                    enums[arr[i].toUpperCase()] = arr[i];
                }
                return enums;
            },
            has = function (str1, str2) {
                if (typeof str1 === OBJ_TYPE && str1.length > 0) {
                    for (var i in str1) {
                        if (lowerize(str1[i]) == lowerize(str2)) return true;
                    }
                    return false;
                }
                return isString(str1) ? lowerize(str2).indexOf(lowerize(str1)) !== -1 : false;
            },
            isExtensions = function (obj, deep) {
                for (var prop in obj) {
                    return /^(browser|cpu|device|engine|os)$/.test(prop) || (deep ? isExtensions(obj[prop]) : false);
                }
            },
            isString = function (val) {
                return typeof val === STR_TYPE;
            },
            itemListToArray = function (header) {
                if (!header) return undefined;
                var arr = [];
                var tokens = strip(/\\?\"/g, header).split(',');
                for (var i = 0; i < tokens.length; i++) {
                    if (tokens[i].indexOf(';') > -1) {
                        var token = trim(tokens[i]).split(';v=');
                        arr[i] = { brand : token[0], version : token[1] };
                    } else {
                        arr[i] = trim(tokens[i]);
                    }
                }
                return arr;
            },
            lowerize = function (str) {
                return isString(str) ? str.toLowerCase() : str;
            },
            majorize = function (version) {
                return isString(version) ? strip(/[^\d\.]/g, version).split('.')[0] : undefined;
            },
            setProps = function (arr) {
                for (var i in arr) {
                    var propName = arr[i];
                    if (typeof propName == OBJ_TYPE && propName.length == 2) {
                        this[propName[0]] = propName[1];
                    } else {
                        this[propName] = undefined;
                    }
                }
                return this;
            },
            strip = function (pattern, str) {
                return isString(str) ? str.replace(pattern, EMPTY) : str;
            },
            stripQuotes = function (str) {
                return strip(/\\?\"/g, str); 
            },
            trim = function (str, len) {
                if (isString(str)) {
                    str = strip(/^\s\s*/, str);
                    return typeof len === UNDEF_TYPE ? str : str.substring(0, UA_MAX_LENGTH);
                }
        };

        ///////////////
        // Map helper
        //////////////

        var rgxMapper = function (ua, arrays) {

                if(!ua || !arrays) return;

                var i = 0, j, k, p, q, matches, match;

                // loop through all regexes maps
                while (i < arrays.length && !matches) {

                    var regex = arrays[i],       // even sequence (0,2,4,..)
                        props = arrays[i + 1];   // odd sequence (1,3,5,..)
                    j = k = 0;

                    // try matching uastring with regexes
                    while (j < regex.length && !matches) {

                        if (!regex[j]) { break; }
                        matches = regex[j++].exec(ua);

                        if (!!matches) {
                            for (p = 0; p < props.length; p++) {
                                match = matches[++k];
                                q = props[p];
                                // check if given property is actually array
                                if (typeof q === OBJ_TYPE && q.length > 0) {
                                    if (q.length === 2) {
                                        if (typeof q[1] == FUNC_TYPE) {
                                            // assign modified match
                                            this[q[0]] = q[1].call(this, match);
                                        } else {
                                            // assign given value, ignore regex match
                                            this[q[0]] = q[1];
                                        }
                                    } else if (q.length === 3) {
                                        // check whether function or regex
                                        if (typeof q[1] === FUNC_TYPE && !(q[1].exec && q[1].test)) {
                                            // call function (usually string mapper)
                                            this[q[0]] = match ? q[1].call(this, match, q[2]) : undefined;
                                        } else {
                                            // sanitize match using given regex
                                            this[q[0]] = match ? match.replace(q[1], q[2]) : undefined;
                                        }
                                    } else if (q.length === 4) {
                                            this[q[0]] = match ? q[3].call(this, match.replace(q[1], q[2])) : undefined;
                                    }
                                } else {
                                    this[q] = match ? match : undefined;
                                }
                            }
                        }
                    }
                    i += 2;
                }
            },

            strMapper = function (str, map) {

                for (var i in map) {
                    // check if current value is array
                    if (typeof map[i] === OBJ_TYPE && map[i].length > 0) {
                        for (var j = 0; j < map[i].length; j++) {
                            if (has(map[i][j], str)) {
                                return (i === UNKNOWN) ? undefined : i;
                            }
                        }
                    } else if (has(map[i], str)) {
                        return (i === UNKNOWN) ? undefined : i;
                    }
                }
                return map.hasOwnProperty('*') ? map['*'] : str;
        };

        ///////////////
        // String map
        //////////////

        var windowsVersionMap = {
                'ME'        : '4.90',
                'NT 3.11'   : 'NT3.51',
                'NT 4.0'    : 'NT4.0',
                '2000'      : 'NT 5.0',
                'XP'        : ['NT 5.1', 'NT 5.2'],
                'Vista'     : 'NT 6.0',
                '7'         : 'NT 6.1',
                '8'         : 'NT 6.2',
                '8.1'       : 'NT 6.3',
                '10'        : ['NT 6.4', 'NT 10.0'],
                'RT'        : 'ARM'
            },
            
            formFactorsMap = {
                'embedded'  : 'Automotive',
                'mobile'    : 'Mobile',
                'tablet'    : ['Tablet', 'EInk'],
                'smarttv'   : 'TV',
                'wearable'  : 'Watch',
                'xr'        : ['VR', 'XR'],
                '?'         : ['Desktop', 'Unknown'],
                '*'         : undefined
        };

        //////////////
        // Regex map
        /////////////

        var defaultRegexes = {

            browser : [[

                // Most common regardless engine
                /\b(?:crmo|crios)\/([\w\.]+)/i                                      // Chrome for Android/iOS
                ], [VERSION, [NAME, PREFIX_MOBILE + 'Chrome']], [
                /edg(?:e|ios|a)?\/([\w\.]+)/i                                       // Microsoft Edge
                ], [VERSION, [NAME, 'Edge']], [

                // Presto based
                /(opera mini)\/([-\w\.]+)/i,                                        // Opera Mini
                /(opera [mobiletab]{3,6})\b.+version\/([-\w\.]+)/i,                 // Opera Mobi/Tablet
                /(opera)(?:.+version\/|[\/ ]+)([\w\.]+)/i                           // Opera
                ], [NAME, VERSION], [
                /opios[\/ ]+([\w\.]+)/i                                             // Opera mini on iphone >= 8.0
                ], [VERSION, [NAME, OPERA+' Mini']], [
                /\bop(?:rg)?x\/([\w\.]+)/i                                          // Opera GX
                ], [VERSION, [NAME, OPERA+' GX']], [
                /\bopr\/([\w\.]+)/i                                                 // Opera Webkit
                ], [VERSION, [NAME, OPERA]], [

                // Mixed
                /\bb[ai]*d(?:uhd|[ub]*[aekoprswx]{5,6})[\/ ]?([\w\.]+)/i            // Baidu
                ], [VERSION, [NAME, 'Baidu']], [
                /\b(?:mxbrowser|mxios|myie2)\/?([-\w\.]*)\b/i                       // Maxthon
                ], [VERSION, [NAME, 'Maxthon']], [
                /(kindle)\/([\w\.]+)/i,                                             // Kindle
                /(lunascape|maxthon|netfront|jasmine|blazer|sleipnir)[\/ ]?([\w\.]*)/i,      
                                                                                    // Lunascape/Maxthon/Netfront/Jasmine/Blazer/Sleipnir
                // Trident based
                /(avant|iemobile|slim(?:browser|boat|jet))[\/ ]?([\d\.]*)/i,        // Avant/IEMobile/SlimBrowser/SlimBoat/Slimjet
                /(?:ms|\()(ie) ([\w\.]+)/i,                                         // Internet Explorer

                // Blink/Webkit/KHTML based                                         // Flock/RockMelt/Midori/Epiphany/Silk/Skyfire/Bolt/Iron/Iridium/PhantomJS/Bowser/QupZilla/Falkon/LG Browser/Otter/qutebrowser/Dooble
                /(flock|rockmelt|midori|epiphany|silk|skyfire|ovibrowser|bolt|iron|vivaldi|iridium|phantomjs|bowser|qupzilla|falkon|rekonq|puffin|brave|whale(?!.+naver)|qqbrowserlite|duckduckgo|klar|helio|(?=comodo_)?dragon|otter|dooble|(?:lg |qute)browser)\/([-\w\.]+)/i,
                                                                                    // Rekonq/Puffin/Brave/Whale/QQBrowserLite/QQ//Vivaldi/DuckDuckGo/Klar/Helio/Dragon
                /(heytap|ovi|115|surf)browser\/([\d\.]+)/i,                         // HeyTap/Ovi/115/Surf
                /(ecosia|weibo)(?:__| \w+@)([\d\.]+)/i                              // Ecosia/Weibo
                ], [NAME, VERSION], [
                /quark(?:pc)?\/([-\w\.]+)/i                                         // Quark
                ], [VERSION, [NAME, 'Quark']], [
                /\bddg\/([\w\.]+)/i                                                 // DuckDuckGo
                ], [VERSION, [NAME, 'DuckDuckGo']], [
                /(?:\buc? ?browser|(?:juc.+)ucweb)[\/ ]?([\w\.]+)/i                 // UCBrowser
                ], [VERSION, [NAME, 'UCBrowser']], [
                /microm.+\bqbcore\/([\w\.]+)/i,                                     // WeChat Desktop for Windows Built-in Browser
                /\bqbcore\/([\w\.]+).+microm/i,
                /micromessenger\/([\w\.]+)/i                                        // WeChat
                ], [VERSION, [NAME, 'WeChat']], [
                /konqueror\/([\w\.]+)/i                                             // Konqueror
                ], [VERSION, [NAME, 'Konqueror']], [
                /trident.+rv[: ]([\w\.]{1,9})\b.+like gecko/i                       // IE11
                ], [VERSION, [NAME, 'IE']], [
                /ya(?:search)?browser\/([\w\.]+)/i                                  // Yandex
                ], [VERSION, [NAME, 'Yandex']], [
                /slbrowser\/([\w\.]+)/i                                             // Smart Lenovo Browser
                ], [VERSION, [NAME, 'Smart ' + LENOVO + SUFFIX_BROWSER]], [
                /(avast|avg)\/([\w\.]+)/i                                           // Avast/AVG Secure Browser
                ], [[NAME, /(.+)/, '$1 Secure' + SUFFIX_BROWSER], VERSION], [
                /\bfocus\/([\w\.]+)/i                                               // Firefox Focus
                ], [VERSION, [NAME, FIREFOX+' Focus']], [
                /\bopt\/([\w\.]+)/i                                                 // Opera Touch
                ], [VERSION, [NAME, OPERA+' Touch']], [
                /coc_coc\w+\/([\w\.]+)/i                                            // Coc Coc Browser
                ], [VERSION, [NAME, 'Coc Coc']], [
                /dolfin\/([\w\.]+)/i                                                // Dolphin
                ], [VERSION, [NAME, 'Dolphin']], [
                /coast\/([\w\.]+)/i                                                 // Opera Coast
                ], [VERSION, [NAME, OPERA+' Coast']], [
                /miuibrowser\/([\w\.]+)/i                                           // MIUI Browser
                ], [VERSION, [NAME, 'MIUI' + SUFFIX_BROWSER]], [
                /fxios\/([\w\.-]+)/i                                                // Firefox for iOS
                ], [VERSION, [NAME, PREFIX_MOBILE + FIREFOX]], [
                /\bqihoobrowser\/?([\w\.]*)/i                                       // 360
                ], [VERSION, [NAME, '360']], [
                /\b(qq)\/([\w\.]+)/i                                                // QQ
                ], [[NAME, /(.+)/, '$1Browser'], VERSION], [
                /(oculus|sailfish|huawei|vivo|pico)browser\/([\w\.]+)/i
                ], [[NAME, /(.+)/, '$1' + SUFFIX_BROWSER], VERSION], [              // Oculus/Sailfish/HuaweiBrowser/VivoBrowser/PicoBrowser
                /samsungbrowser\/([\w\.]+)/i                                        // Samsung Internet
                ], [VERSION, [NAME, SAMSUNG + ' Internet']], [
                /metasr[\/ ]?([\d\.]+)/i                                            // Sogou Explorer
                ], [VERSION, [NAME, SOGOU + ' Explorer']], [
                /(sogou)mo\w+\/([\d\.]+)/i                                          // Sogou Mobile
                ], [[NAME, SOGOU + ' Mobile'], VERSION], [
                /(electron)\/([\w\.]+) safari/i,                                    // Electron-based App
                /(tesla)(?: qtcarbrowser|\/(20\d\d\.[-\w\.]+))/i,                   // Tesla
                /m?(qqbrowser|2345(?=browser|chrome|explorer))\w*[\/ ]?v?([\w\.]+)/i   // QQ/2345
                ], [NAME, VERSION], [
                /(lbbrowser|rekonq)/i                                               // LieBao Browser/Rekonq
                ], [NAME], [
                /ome\/([\w\.]+) \w* ?(iron) saf/i,                                  // Iron
                /ome\/([\w\.]+).+qihu (360)[es]e/i                                  // 360
                ], [VERSION, NAME], [

                // WebView
                /((?:fban\/fbios|fb_iab\/fb4a)(?!.+fbav)|;fbav\/([\w\.]+);)/i       // Facebook App for iOS & Android
                ], [[NAME, FACEBOOK], VERSION, [TYPE, INAPP]], [
                /(Klarna)\/([\w\.]+)/i,                                             // Klarna Shopping Browser for iOS & Android
                /(kakao(?:talk|story))[\/ ]([\w\.]+)/i,                             // Kakao App
                /(naver)\(.*?(\d+\.[\w\.]+).*\)/i,                                  // Naver InApp
                /(daum)apps[\/ ]([\w\.]+)/i,                                        // Daum App
                /safari (line)\/([\w\.]+)/i,                                        // Line App for iOS
                /\b(line)\/([\w\.]+)\/iab/i,                                        // Line App for Android
                /(alipay)client\/([\w\.]+)/i,                                       // Alipay
                /(twitter)(?:and| f.+e\/([\w\.]+))/i,                               // Twitter
                /(instagram|snapchat)[\/ ]([-\w\.]+)/i                              // Instagram/Snapchat
                ], [NAME, VERSION, [TYPE, INAPP]], [
                /\bgsa\/([\w\.]+) .*safari\//i                                      // Google Search Appliance on iOS
                ], [VERSION, [NAME, 'GSA'], [TYPE, INAPP]], [
                /musical_ly(?:.+app_?version\/|_)([\w\.]+)/i                        // TikTok
                ], [VERSION, [NAME, 'TikTok'], [TYPE, INAPP]], [
                /\[(linkedin)app\]/i                                                // LinkedIn App for iOS & Android
                ], [NAME, [TYPE, INAPP]], [

                /(chromium)[\/ ]([-\w\.]+)/i                                        // Chromium
                ], [NAME, VERSION], [

                /headlesschrome(?:\/([\w\.]+)| )/i                                  // Chrome Headless
                ], [VERSION, [NAME, CHROME+' Headless']], [

                / wv\).+(chrome)\/([\w\.]+)/i                                       // Chrome WebView
                ], [[NAME, CHROME+' WebView'], VERSION], [

                /droid.+ version\/([\w\.]+)\b.+(?:mobile safari|safari)/i           // Android Browser
                ], [VERSION, [NAME, 'Android' + SUFFIX_BROWSER]], [

                /chrome\/([\w\.]+) mobile/i                                         // Chrome Mobile
                ], [VERSION, [NAME, PREFIX_MOBILE + 'Chrome']], [

                /(chrome|omniweb|arora|[tizenoka]{5} ?browser)\/v?([\w\.]+)/i       // Chrome/OmniWeb/Arora/Tizen/Nokia
                ], [NAME, VERSION], [

                /version\/([\w\.\,]+) .*mobile(?:\/\w+ | ?)safari/i                 // Safari Mobile
                ], [VERSION, [NAME, PREFIX_MOBILE + 'Safari']], [
                /iphone .*mobile(?:\/\w+ | ?)safari/i
                ], [[NAME, PREFIX_MOBILE + 'Safari']], [
                /version\/([\w\.\,]+) .*(safari)/i                                  // Safari
                ], [VERSION, NAME], [
                /webkit.+?(mobile ?safari|safari)(\/[\w\.]+)/i                      // Safari < 3.0
                ], [NAME, [VERSION, '1']], [

                /(webkit|khtml)\/([\w\.]+)/i
                ], [NAME, VERSION], [

                // Gecko based
                /(?:mobile|tablet);.*(firefox)\/([\w\.-]+)/i                        // Firefox Mobile
                ], [[NAME, PREFIX_MOBILE + FIREFOX], VERSION], [
                /(navigator|netscape\d?)\/([-\w\.]+)/i                              // Netscape
                ], [[NAME, 'Netscape'], VERSION], [
                /(wolvic|librewolf)\/([\w\.]+)/i                                    // Wolvic/LibreWolf
                ], [NAME, VERSION], [
                /mobile vr; rv:([\w\.]+)\).+firefox/i                               // Firefox Reality
                ], [VERSION, [NAME, FIREFOX+' Reality']], [
                /ekiohf.+(flow)\/([\w\.]+)/i,                                       // Flow
                /(swiftfox)/i,                                                      // Swiftfox
                /(icedragon|iceweasel|camino|chimera|fennec|maemo browser|minimo|conkeror)[\/ ]?([\w\.\+]+)/i,
                                                                                    // IceDragon/Iceweasel/Camino/Chimera/Fennec/Maemo/Minimo/Conkeror
                /(seamonkey|k-meleon|icecat|iceape|firebird|phoenix|palemoon|basilisk|waterfox)\/([-\w\.]+)$/i,
                                                                                    // Firefox/SeaMonkey/K-Meleon/IceCat/IceApe/Firebird/Phoenix
                /(firefox)\/([\w\.]+)/i,                                            // Other Firefox-based
                /(mozilla)\/([\w\.]+) .+rv\:.+gecko\/\d+/i,                         // Mozilla

                // Other
                /(amaya|dillo|doris|icab|ladybird|lynx|mosaic|netsurf|obigo|polaris|w3m|(?:go|ice|up)[\. ]?browser)[-\/ ]?v?([\w\.]+)/i,
                                                                                    // Polaris/Lynx/Dillo/iCab/Doris/Amaya/w3m/NetSurf/Obigo/Mosaic/Go/ICE/UP.Browser/Ladybird
                /\b(links) \(([\w\.]+)/i                                            // Links
                ], [NAME, [VERSION, /_/g, '.']], [
                
                /(cobalt)\/([\w\.]+)/i                                              // Cobalt
                ], [NAME, [VERSION, /[^\d\.]+./, EMPTY]]
            ],

            cpu : [[

                /\b((amd|x|x86[-_]?|wow|win)64)\b/i                                 // AMD64 (x64)
                ], [[ARCHITECTURE, 'amd64']], [

                /(ia32(?=;))/i,                                                     // IA32 (quicktime)
                /\b((i[346]|x)86)(pc)?\b/i                                          // IA32 (x86)
                ], [[ARCHITECTURE, 'ia32']], [

                /\b(aarch64|arm(v?[89]e?l?|_?64))\b/i                               // ARM64
                ], [[ARCHITECTURE, 'arm64']], [

                /\b(arm(v[67])?ht?n?[fl]p?)\b/i                                     // ARMHF
                ], [[ARCHITECTURE, 'armhf']], [

                // PocketPC mistakenly identified as PowerPC
                /( (ce|mobile); ppc;|\/[\w\.]+arm\b)/i
                ], [[ARCHITECTURE, 'arm']], [

                /((ppc|powerpc)(64)?)( mac|;|\))/i                                  // PowerPC
                ], [[ARCHITECTURE, /ower/, EMPTY, lowerize]], [

                / sun4\w[;\)]/i                                                     // SPARC
                ], [[ARCHITECTURE, 'sparc']], [

                /\b(avr32|ia64(?=;)|68k(?=\))|\barm(?=v([1-7]|[5-7]1)l?|;|eabi)|(irix|mips|sparc)(64)?\b|pa-risc)/i
                                                                                    // IA64, 68K, ARM/64, AVR/32, IRIX/64, MIPS/64, SPARC/64, PA-RISC
                ], [[ARCHITECTURE, lowerize]]
            ],

            device : [[

                //////////////////////////
                // MOBILES & TABLETS
                /////////////////////////

                // Samsung
                /\b(sch-i[89]0\d|shw-m380s|sm-[ptx]\w{2,4}|gt-[pn]\d{2,4}|sgh-t8[56]9|nexus 10)/i
                ], [MODEL, [VENDOR, SAMSUNG], [TYPE, TABLET]], [
                /\b((?:s[cgp]h|gt|sm)-(?![lr])\w+|sc[g-]?[\d]+a?|galaxy nexus)/i,
                /samsung[- ]((?!sm-[lr])[-\w]+)/i,
                /sec-(sgh\w+)/i
                ], [MODEL, [VENDOR, SAMSUNG], [TYPE, MOBILE]], [

                // Apple
                /(?:\/|\()(ip(?:hone|od)[\w, ]*)(?:\/|;)/i                          // iPod/iPhone
                ], [MODEL, [VENDOR, APPLE], [TYPE, MOBILE]], [
                /\((ipad);[-\w\),; ]+apple/i,                                       // iPad
                /applecoremedia\/[\w\.]+ \((ipad)/i,
                /\b(ipad)\d\d?,\d\d?[;\]].+ios/i
                ], [MODEL, [VENDOR, APPLE], [TYPE, TABLET]], [
                /(macintosh);/i
                ], [MODEL, [VENDOR, APPLE]], [

                // Sharp
                /\b(sh-?[altvz]?\d\d[a-ekm]?)/i
                ], [MODEL, [VENDOR, SHARP], [TYPE, MOBILE]], [

                // Honor
                /\b((?:brt|eln|hey2?|gdi|jdn)-a?[lnw]09|(?:ag[rm]3?|jdn2|kob2)-a?[lw]0[09]hn)(?: bui|\)|;)/i
                ], [MODEL, [VENDOR, HONOR], [TYPE, TABLET]], [
                /honor([-\w ]+)[;\)]/i
                ], [MODEL, [VENDOR, HONOR], [TYPE, MOBILE]], [

                // Huawei
                /\b((?:ag[rs][2356]?k?|bah[234]?|bg[2o]|bt[kv]|cmr|cpn|db[ry]2?|jdn2|got|kob2?k?|mon|pce|scm|sht?|[tw]gr|vrd)-[ad]?[lw][0125][09]b?|605hw|bg2-u03|(?:gem|fdr|m2|ple|t1)-[7a]0[1-4][lu]|t1-a2[13][lw]|mediapad[\w\. ]*(?= bui|\)))\b(?!.+d\/s)/i
                ], [MODEL, [VENDOR, HUAWEI], [TYPE, TABLET]], [
                /(?:huawei)([-\w ]+)[;\)]/i,
                /\b(nexus 6p|\w{2,4}e?-[atu]?[ln][\dx][012359c][adn]?)\b(?!.+d\/s)/i
                ], [MODEL, [VENDOR, HUAWEI], [TYPE, MOBILE]], [

                // Xiaomi
                /oid[^\)]+; (2[\dbc]{4}(182|283|rp\w{2})[cgl]|m2105k81a?c)(?: bui|\))/i,
                /\b((?:red)?mi[-_ ]?pad[\w- ]*)(?: bui|\))/i                                // Mi Pad tablets
                ],[[MODEL, /_/g, ' '], [VENDOR, XIAOMI], [TYPE, TABLET]], [

                /\b(poco[\w ]+|m2\d{3}j\d\d[a-z]{2})(?: bui|\))/i,                  // Xiaomi POCO
                /\b; (\w+) build\/hm\1/i,                                           // Xiaomi Hongmi 'numeric' models
                /\b(hm[-_ ]?note?[_ ]?(?:\d\w)?) bui/i,                             // Xiaomi Hongmi
                /\b(redmi[\-_ ]?(?:note|k)?[\w_ ]+)(?: bui|\))/i,                   // Xiaomi Redmi
                /oid[^\)]+; (m?[12][0-389][01]\w{3,6}[c-y])( bui|; wv|\))/i,        // Xiaomi Redmi 'numeric' models
                /\b(mi[-_ ]?(?:a\d|one|one[_ ]plus|note lte|max|cc)?[_ ]?(?:\d?\w?)[_ ]?(?:plus|se|lite|pro)?)(?: bui|\))/i, // Xiaomi Mi
                / ([\w ]+) miui\/v?\d/i
                ], [[MODEL, /_/g, ' '], [VENDOR, XIAOMI], [TYPE, MOBILE]], [

                // OPPO
                /; (\w+) bui.+ oppo/i,
                /\b(cph[12]\d{3}|p(?:af|c[al]|d\w|e[ar])[mt]\d0|x9007|a101op)\b/i
                ], [MODEL, [VENDOR, OPPO], [TYPE, MOBILE]], [
                /\b(opd2(\d{3}a?))(?: bui|\))/i
                ], [MODEL, [VENDOR, strMapper, { 'OnePlus' : ['304', '403', '203'], '*' : OPPO }], [TYPE, TABLET]], [

                // BLU Vivo Series
                /(vivo (5r?|6|8l?|go|one|s|x[il]?[2-4]?)[\w\+ ]*)(?: bui|\))/i
                ], [MODEL, [VENDOR, 'BLU'], [TYPE, MOBILE]], [            
                // Vivo
                /; vivo (\w+)(?: bui|\))/i,
                /\b(v[12]\d{3}\w?[at])(?: bui|;)/i
                ], [MODEL, [VENDOR, 'Vivo'], [TYPE, MOBILE]], [

                // Realme
                /\b(rmx[1-3]\d{3})(?: bui|;|\))/i
                ], [MODEL, [VENDOR, 'Realme'], [TYPE, MOBILE]], [

                // Motorola
                /\b(milestone|droid(?:[2-4x]| (?:bionic|x2|pro|razr))?:?( 4g)?)\b[\w ]+build\//i,
                /\bmot(?:orola)?[- ](\w*)/i,
                /((?:moto(?! 360)[\w\(\) ]+|xt\d{3,4}|nexus 6)(?= bui|\)))/i
                ], [MODEL, [VENDOR, MOTOROLA], [TYPE, MOBILE]], [
                /\b(mz60\d|xoom[2 ]{0,2}) build\//i
                ], [MODEL, [VENDOR, MOTOROLA], [TYPE, TABLET]], [

                // LG
                /((?=lg)?[vl]k\-?\d{3}) bui| 3\.[-\w; ]{10}lg?-([06cv9]{3,4})/i
                ], [MODEL, [VENDOR, LG], [TYPE, TABLET]], [
                /(lm(?:-?f100[nv]?|-[\w\.]+)(?= bui|\))|nexus [45])/i,
                /\blg[-e;\/ ]+(?!.*(?:browser|netcast|android tv|watch))(\w+)/i,
                /\blg-?([\d\w]+) bui/i
                ], [MODEL, [VENDOR, LG], [TYPE, MOBILE]], [

                // Lenovo
                /(ideatab[-\w ]+|602lv|d-42a|a101lv|a2109a|a3500-hv|s[56]000|pb-6505[my]|tb-?x?\d{3,4}(?:f[cu]|xu|[av])|yt\d?-[jx]?\d+[lfmx])( bui|;|\)|\/)/i,
                /lenovo ?(b[68]0[08]0-?[hf]?|tab(?:[\w- ]+?)|tb[\w-]{6,7})( bui|;|\)|\/)/i
                ], [MODEL, [VENDOR, LENOVO], [TYPE, TABLET]], [

                // Nokia
                /(nokia) (t[12][01])/i
                ], [VENDOR, MODEL, [TYPE, TABLET]], [
                /(?:maemo|nokia).*(n900|lumia \d+|rm-\d+)/i,
                /nokia[-_ ]?(([-\w\. ]*))/i
                ], [[MODEL, /_/g, ' '], [TYPE, MOBILE], [VENDOR, 'Nokia']], [

                // Google
                /(pixel (c|tablet))\b/i                                             // Google Pixel C/Tablet
                ], [MODEL, [VENDOR, GOOGLE], [TYPE, TABLET]], [
                /droid.+; (pixel[\daxl ]{0,6})(?: bui|\))/i                         // Google Pixel
                ], [MODEL, [VENDOR, GOOGLE], [TYPE, MOBILE]], [

                // Sony
                /droid.+; (a?\d[0-2]{2}so|[c-g]\d{4}|so[-gl]\w+|xq-a\w[4-7][12])(?= bui|\).+chrome\/(?![1-6]{0,1}\d\.))/i
                ], [MODEL, [VENDOR, SONY], [TYPE, MOBILE]], [
                /sony tablet [ps]/i,
                /\b(?:sony)?sgp\w+(?: bui|\))/i
                ], [[MODEL, 'Xperia Tablet'], [VENDOR, SONY], [TYPE, TABLET]], [

                // OnePlus
                / (kb2005|in20[12]5|be20[12][59])\b/i,
                /(?:one)?(?:plus)? (a\d0\d\d)(?: b|\))/i
                ], [MODEL, [VENDOR, ONEPLUS], [TYPE, MOBILE]], [

                // Amazon
                /(alexa)webm/i,
                /(kf[a-z]{2}wi|aeo(?!bc)\w\w)( bui|\))/i,                           // Kindle Fire without Silk / Echo Show
                /(kf[a-z]+)( bui|\)).+silk\//i                                      // Kindle Fire HD
                ], [MODEL, [VENDOR, AMAZON], [TYPE, TABLET]], [
                /((?:sd|kf)[0349hijorstuw]+)( bui|\)).+silk\//i                     // Fire Phone
                ], [[MODEL, /(.+)/g, 'Fire Phone $1'], [VENDOR, AMAZON], [TYPE, MOBILE]], [

                // BlackBerry
                /(playbook);[-\w\),; ]+(rim)/i                                      // BlackBerry PlayBook
                ], [MODEL, VENDOR, [TYPE, TABLET]], [
                /\b((?:bb[a-f]|st[hv])100-\d)/i,
                /\(bb10; (\w+)/i                                                    // BlackBerry 10
                ], [MODEL, [VENDOR, BLACKBERRY], [TYPE, MOBILE]], [

                // Asus
                /(?:\b|asus_)(transfo[prime ]{4,10} \w+|eeepc|slider \w+|nexus 7|padfone|p00[cj])/i
                ], [MODEL, [VENDOR, ASUS], [TYPE, TABLET]], [
                / (z[bes]6[027][012][km][ls]|zenfone \d\w?)\b/i
                ], [MODEL, [VENDOR, ASUS], [TYPE, MOBILE]], [

                // HTC
                /(nexus 9)/i                                                        // HTC Nexus 9
                ], [MODEL, [VENDOR, 'HTC'], [TYPE, TABLET]], [
                /(htc)[-;_ ]{1,2}([\w ]+(?=\)| bui)|\w+)/i,                         // HTC

                // ZTE
                /(zte)[- ]([\w ]+?)(?: bui|\/|\))/i,
                /(alcatel|geeksphone|nexian|panasonic(?!(?:;|\.))|sony(?!-bra))[-_ ]?([-\w]*)/i         // Alcatel/GeeksPhone/Nexian/Panasonic/Sony
                ], [VENDOR, [MODEL, /_/g, ' '], [TYPE, MOBILE]], [

                // TCL
                /tcl (xess p17aa)/i,
                /droid [\w\.]+; ((?:8[14]9[16]|9(?:0(?:48|60|8[01])|1(?:3[27]|66)|2(?:6[69]|9[56])|466))[gqswx])(_\w(\w|\w\w))?(\)| bui)/i
                ], [MODEL, [VENDOR, 'TCL'], [TYPE, TABLET]], [
                /droid [\w\.]+; (418(?:7d|8v)|5087z|5102l|61(?:02[dh]|25[adfh]|27[ai]|56[dh]|59k|65[ah])|a509dl|t(?:43(?:0w|1[adepqu])|50(?:6d|7[adju])|6(?:09dl|10k|12b|71[efho]|76[hjk])|7(?:66[ahju]|67[hw]|7[045][bh]|71[hk]|73o|76[ho]|79w|81[hks]?|82h|90[bhsy]|99b)|810[hs]))(_\w(\w|\w\w))?(\)| bui)/i
                ], [MODEL, [VENDOR, 'TCL'], [TYPE, MOBILE]], [

                // itel
                /(itel) ((\w+))/i
                ], [[VENDOR, lowerize], MODEL, [TYPE, strMapper, { 'tablet' : ['p10001l', 'w7001'], '*' : 'mobile' }]], [

                // Acer
                /droid.+; ([ab][1-7]-?[0178a]\d\d?)/i
                ], [MODEL, [VENDOR, 'Acer'], [TYPE, TABLET]], [

                // Meizu
                /droid.+; (m[1-5] note) bui/i,
                /\bmz-([-\w]{2,})/i
                ], [MODEL, [VENDOR, 'Meizu'], [TYPE, MOBILE]], [
                    
                // Ulefone
                /; ((?:power )?armor(?:[\w ]{0,8}))(?: bui|\))/i
                ], [MODEL, [VENDOR, 'Ulefone'], [TYPE, MOBILE]], [

                // Energizer
                /; (energy ?\w+)(?: bui|\))/i,
                /; energizer ([\w ]+)(?: bui|\))/i
                ], [MODEL, [VENDOR, 'Energizer'], [TYPE, MOBILE]], [

                // Cat
                /; cat (b35);/i,
                /; (b15q?|s22 flip|s48c|s62 pro)(?: bui|\))/i
                ], [MODEL, [VENDOR, 'Cat'], [TYPE, MOBILE]], [

                // Smartfren
                /((?:new )?andromax[\w- ]+)(?: bui|\))/i
                ], [MODEL, [VENDOR, 'Smartfren'], [TYPE, MOBILE]], [

                // Nothing
                /droid.+; (a(?:015|06[35]|142p?))/i
                ], [MODEL, [VENDOR, 'Nothing'], [TYPE, MOBILE]], [

                // Archos
                /; (x67 5g|tikeasy \w+|ac[1789]\d\w+)( b|\))/i,
                /archos ?(5|gamepad2?|([\w ]*[t1789]|hello) ?\d+[\w ]*)( b|\))/i
                ], [MODEL, [VENDOR, 'Archos'], [TYPE, TABLET]], [
                /archos ([\w ]+)( b|\))/i,
                /; (ac[3-6]\d\w{2,8})( b|\))/i 
                ], [MODEL, [VENDOR, 'Archos'], [TYPE, MOBILE]], [

                // MIXED
                /(imo) (tab \w+)/i,                                                 // IMO
                /(infinix) (x1101b?)/i                                              // Infinix XPad
                ], [VENDOR, MODEL, [TYPE, TABLET]], [

                /(blackberry|benq|palm(?=\-)|sonyericsson|acer|asus(?! zenw)|dell|jolla|meizu|motorola|polytron|infinix|tecno|micromax|advan)[-_ ]?([-\w]*)/i,
                                                                                    // BlackBerry/BenQ/Palm/Sony-Ericsson/Acer/Asus/Dell/Meizu/Motorola/Polytron/Infinix/Tecno/Micromax/Advan
                /; (blu|hmd|imo|tcl)[_ ]([\w\+ ]+?)(?: bui|\)|; r)/i,               // BLU/HMD/IMO/TCL
                /(hp) ([\w ]+\w)/i,                                                 // HP iPAQ
                /(microsoft); (lumia[\w ]+)/i,                                      // Microsoft Lumia
                /(lenovo)[-_ ]?([-\w ]+?)(?: bui|\)|\/)/i,                          // Lenovo
                /(oppo) ?([\w ]+) bui/i                                             // OPPO
                ], [VENDOR, MODEL, [TYPE, MOBILE]], [

                /(kobo)\s(ereader|touch)/i,                                         // Kobo
                /(hp).+(touchpad(?!.+tablet)|tablet)/i,                             // HP TouchPad
                /(kindle)\/([\w\.]+)/i                                              // Kindle
                ], [VENDOR, MODEL, [TYPE, TABLET]], [

                /(surface duo)/i                                                    // Surface Duo
                ], [MODEL, [VENDOR, MICROSOFT], [TYPE, TABLET]], [
                /droid [\d\.]+; (fp\du?)(?: b|\))/i                                 // Fairphone
                ], [MODEL, [VENDOR, 'Fairphone'], [TYPE, MOBILE]], [
                /((?:tegranote|shield t(?!.+d tv))[\w- ]*?)(?: b|\))/i              // Nvidia Tablets
                ], [MODEL, [VENDOR, NVIDIA], [TYPE, TABLET]], [
                /(sprint) (\w+)/i                                                   // Sprint Phones
                ], [VENDOR, MODEL, [TYPE, MOBILE]], [
                /(kin\.[onetw]{3})/i                                                // Microsoft Kin
                ], [[MODEL, /\./g, ' '], [VENDOR, MICROSOFT], [TYPE, MOBILE]], [
                /droid.+; ([c6]+|et5[16]|mc[239][23]x?|vc8[03]x?)\)/i               // Zebra
                ], [MODEL, [VENDOR, ZEBRA], [TYPE, TABLET]], [
                /droid.+; (ec30|ps20|tc[2-8]\d[kx])\)/i
                ], [MODEL, [VENDOR, ZEBRA], [TYPE, MOBILE]], [

                ///////////////////
                // SMARTTVS
                ///////////////////

                /smart-tv.+(samsung)/i                                              // Samsung
                ], [VENDOR, [TYPE, SMARTTV]], [
                /hbbtv.+maple;(\d+)/i
                ], [[MODEL, /^/, 'SmartTV'], [VENDOR, SAMSUNG], [TYPE, SMARTTV]], [
                /tcast.+(lg)e?. ([-\w]+)/i                                          // LG SmartTV
                ], [VENDOR, MODEL, [TYPE, SMARTTV]], [
                /(nux; netcast.+smarttv|lg (netcast\.tv-201\d|android tv))/i
                ], [[VENDOR, LG], [TYPE, SMARTTV]], [
                /(apple) ?tv/i                                                      // Apple TV
                ], [VENDOR, [MODEL, APPLE+' TV'], [TYPE, SMARTTV]], [
                /crkey.*devicetype\/chromecast/i                                    // Google Chromecast Third Generation
                ], [[MODEL, CHROMECAST+' Third Generation'], [VENDOR, GOOGLE], [TYPE, SMARTTV]], [
                /crkey.*devicetype\/([^/]*)/i                                       // Google Chromecast with specific device type
                ], [[MODEL, /^/, 'Chromecast '], [VENDOR, GOOGLE], [TYPE, SMARTTV]], [
                /fuchsia.*crkey/i                                                   // Google Chromecast Nest Hub
                ], [[MODEL, CHROMECAST+' Nest Hub'], [VENDOR, GOOGLE], [TYPE, SMARTTV]], [
                /crkey/i                                                            // Google Chromecast, Linux-based or unknown
                ], [[MODEL, CHROMECAST], [VENDOR, GOOGLE], [TYPE, SMARTTV]], [
                /(portaltv)/i                                                       // Facebook Portal TV
                ], [MODEL, [VENDOR, FACEBOOK], [TYPE, SMARTTV]], [
                /droid.+aft(\w+)( bui|\))/i                                         // Fire TV
                ], [MODEL, [VENDOR, AMAZON], [TYPE, SMARTTV]], [
                /(shield \w+ tv)/i                                                  // Nvidia Shield TV
                ], [MODEL, [VENDOR, NVIDIA], [TYPE, SMARTTV]], [
                /\(dtv[\);].+(aquos)/i,
                /(aquos-tv[\w ]+)\)/i                                               // Sharp
                ], [MODEL, [VENDOR, SHARP], [TYPE, SMARTTV]],[
                /(bravia[\w ]+)( bui|\))/i                                          // Sony
                ], [MODEL, [VENDOR, SONY], [TYPE, SMARTTV]], [
                /(mi(tv|box)-?\w+) bui/i                                            // Xiaomi
                ], [MODEL, [VENDOR, XIAOMI], [TYPE, SMARTTV]], [
                /Hbbtv.*(technisat) (.*);/i                                         // TechniSAT
                ], [VENDOR, MODEL, [TYPE, SMARTTV]], [
                /\b(roku)[\dx]*[\)\/]((?:dvp-)?[\d\.]*)/i,                          // Roku
                /hbbtv\/\d+\.\d+\.\d+ +\([\w\+ ]*; *([\w\d][^;]*);([^;]*)/i         // HbbTV devices
                ], [[VENDOR, trim], [MODEL, trim], [TYPE, SMARTTV]], [
                                                                                    // SmartTV from Unidentified Vendors
                /droid.+; ([\w- ]+) (?:android tv|smart[- ]?tv)/i
                ], [MODEL, [TYPE, SMARTTV]], [
                /\b(android tv|smart[- ]?tv|opera tv|tv; rv:)\b/i
                ], [[TYPE, SMARTTV]], [

                ///////////////////
                // CONSOLES
                ///////////////////

                /(ouya)/i,                                                          // Ouya
                /(nintendo) (\w+)/i                                                 // Nintendo
                ], [VENDOR, MODEL, [TYPE, CONSOLE]], [
                /droid.+; (shield)( bui|\))/i                                       // Nvidia Portable
                ], [MODEL, [VENDOR, NVIDIA], [TYPE, CONSOLE]], [
                /(playstation \w+)/i                                                // Playstation
                ], [MODEL, [VENDOR, SONY], [TYPE, CONSOLE]], [
                /\b(xbox(?: one)?(?!; xbox))[\); ]/i                                // Microsoft Xbox
                ], [MODEL, [VENDOR, MICROSOFT], [TYPE, CONSOLE]], [

                ///////////////////
                // WEARABLES
                ///////////////////

                /\b(sm-[lr]\d\d[0156][fnuw]?s?|gear live)\b/i                       // Samsung Galaxy Watch
                ], [MODEL, [VENDOR, SAMSUNG], [TYPE, WEARABLE]], [
                /((pebble))app/i,                                                   // Pebble
                /(asus|google|lg|oppo) ((pixel |zen)?watch[\w ]*)( bui|\))/i        // Asus ZenWatch / LG Watch / Pixel Watch
                ], [VENDOR, MODEL, [TYPE, WEARABLE]], [
                /(ow(?:19|20)?we?[1-3]{1,3})/i                                      // Oppo Watch
                ], [MODEL, [VENDOR, OPPO], [TYPE, WEARABLE]], [
                /(watch)(?: ?os[,\/]|\d,\d\/)[\d\.]+/i                              // Apple Watch
                ], [MODEL, [VENDOR, APPLE], [TYPE, WEARABLE]], [
                /(opwwe\d{3})/i                                                     // OnePlus Watch
                ], [MODEL, [VENDOR, ONEPLUS], [TYPE, WEARABLE]], [
                /(moto 360)/i                                                       // Motorola 360
                ], [MODEL, [VENDOR, MOTOROLA], [TYPE, WEARABLE]], [
                /(smartwatch 3)/i                                                   // Sony SmartWatch
                ], [MODEL, [VENDOR, SONY], [TYPE, WEARABLE]], [
                /(g watch r)/i                                                      // LG G Watch R
                ], [MODEL, [VENDOR, LG], [TYPE, WEARABLE]], [
                /droid.+; (wt63?0{2,3})\)/i
                ], [MODEL, [VENDOR, ZEBRA], [TYPE, WEARABLE]], [

                ///////////////////
                // XR
                ///////////////////

                /droid.+; (glass) \d/i                                              // Google Glass
                ], [MODEL, [VENDOR, GOOGLE], [TYPE, XR]], [
                /(pico) (4|neo3(?: link|pro)?)/i                                    // Pico
                ], [VENDOR, MODEL, [TYPE, XR]], [
                /(quest( \d| pro)?s?).+vr/i                                         // Meta Quest
                ], [MODEL, [VENDOR, FACEBOOK], [TYPE, XR]], [

                ///////////////////
                // EMBEDDED
                ///////////////////

                /(tesla)(?: qtcarbrowser|\/[-\w\.]+)/i                              // Tesla
                ], [VENDOR, [TYPE, EMBEDDED]], [
                /(aeobc)\b/i                                                        // Echo Dot
                ], [MODEL, [VENDOR, AMAZON], [TYPE, EMBEDDED]], [
                /(homepod).+mac os/i                                                // Apple HomePod
                ], [MODEL, [VENDOR, APPLE], [TYPE, EMBEDDED]], [
                /windows iot/i
                ], [[TYPE, EMBEDDED]], [

                ////////////////////
                // MIXED (GENERIC)
                ///////////////////

                /droid .+?; ([^;]+?)(?: bui|; wv\)|\) applew).+?(mobile|vr|\d) safari/i
                ], [MODEL, [TYPE, strMapper, { 'mobile' : 'Mobile', 'xr' : 'VR', '*' : TABLET }]], [
                /\b((tablet|tab)[;\/]|focus\/\d(?!.+mobile))/i                      // Unidentifiable Tablet
                ], [[TYPE, TABLET]], [
                /(phone|mobile(?:[;\/]| [ \w\/\.]*safari)|pda(?=.+windows ce))/i    // Unidentifiable Mobile
                ], [[TYPE, MOBILE]], [
                /droid .+?; ([\w\. -]+)( bui|\))/i                                  // Generic Android Device
                ], [MODEL, [VENDOR, 'Generic']]
            ],

            engine : [[

                /windows.+ edge\/([\w\.]+)/i                                       // EdgeHTML
                ], [VERSION, [NAME, EDGE+'HTML']], [

                /(arkweb)\/([\w\.]+)/i                                              // ArkWeb
                ], [NAME, VERSION], [

                /webkit\/537\.36.+chrome\/(?!27)([\w\.]+)/i                         // Blink
                ], [VERSION, [NAME, 'Blink']], [

                /(presto)\/([\w\.]+)/i,                                             // Presto
                /(webkit|trident|netfront|netsurf|amaya|lynx|w3m|goanna|servo)\/([\w\.]+)/i, // WebKit/Trident/NetFront/NetSurf/Amaya/Lynx/w3m/Goanna/Servo
                /ekioh(flow)\/([\w\.]+)/i,                                          // Flow
                /(khtml|tasman|links)[\/ ]\(?([\w\.]+)/i,                           // KHTML/Tasman/Links
                /(icab)[\/ ]([23]\.[\d\.]+)/i,                                      // iCab

                /\b(libweb)/i                                                       // LibWeb
                ], [NAME, VERSION], [
                /ladybird\//i
                ], [[NAME, 'LibWeb']], [

                /rv\:([\w\.]{1,9})\b.+(gecko)/i                                     // Gecko
                ], [VERSION, NAME]
            ],

            os : [[

                // Windows
                /microsoft (windows) (vista|xp)/i                                   // Windows (iTunes)
                ], [NAME, VERSION], [
                /(windows (?:phone(?: os)?|mobile|iot))[\/ ]?([\d\.\w ]*)/i         // Windows Phone
                ], [NAME, [VERSION, strMapper, windowsVersionMap]], [
                /windows nt 6\.2; (arm)/i,                                          // Windows RT
                /windows[\/ ]([ntce\d\. ]+\w)(?!.+xbox)/i,
                /(?:win(?=3|9|n)|win 9x )([nt\d\.]+)/i
                ], [[VERSION, strMapper, windowsVersionMap], [NAME, WINDOWS]], [

                // iOS/macOS
                /[adehimnop]{4,7}\b(?:.*os ([\w]+) like mac|; opera)/i,             // iOS
                /(?:ios;fbsv\/|iphone.+ios[\/ ])([\d\.]+)/i,
                /cfnetwork\/.+darwin/i
                ], [[VERSION, /_/g, '.'], [NAME, 'iOS']], [
                /(mac os x) ?([\w\. ]*)/i,
                /(macintosh|mac_powerpc\b)(?!.+haiku)/i                             // Mac OS
                ], [[NAME, 'macOS'], [VERSION, /_/g, '.']], [

                // Google Chromecast
                /android ([\d\.]+).*crkey/i                                         // Google Chromecast, Android-based
                ], [VERSION, [NAME, CHROMECAST + ' Android']], [
                /fuchsia.*crkey\/([\d\.]+)/i                                        // Google Chromecast, Fuchsia-based
                ], [VERSION, [NAME, CHROMECAST + ' Fuchsia']], [
                /crkey\/([\d\.]+).*devicetype\/smartspeaker/i                       // Google Chromecast, Linux-based Smart Speaker
                ], [VERSION, [NAME, CHROMECAST + ' SmartSpeaker']], [
                /linux.*crkey\/([\d\.]+)/i                                          // Google Chromecast, Legacy Linux-based
                ], [VERSION, [NAME, CHROMECAST + ' Linux']], [
                /crkey\/([\d\.]+)/i                                                 // Google Chromecast, unknown
                ], [VERSION, [NAME, CHROMECAST]], [

                // Mobile OSes
                /droid ([\w\.]+)\b.+(android[- ]x86|harmonyos)/i                    // Android-x86/HarmonyOS
                ], [VERSION, NAME], [                                               
                /(ubuntu) ([\w\.]+) like android/i                                  // Ubuntu Touch
                ], [[NAME, /(.+)/, '$1 Touch'], VERSION], [
                                                                                    // Android/Blackberry/WebOS/QNX/Bada/RIM/KaiOS/Maemo/MeeGo/S40/Sailfish OS/OpenHarmony/Tizen
                /(android|bada|blackberry|kaios|maemo|meego|openharmony|qnx|rim tablet os|sailfish|series40|symbian|tizen|webos)\w*[-\/\.; ]?([\d\.]*)/i
                ], [NAME, VERSION], [
                /\(bb(10);/i                                                        // BlackBerry 10
                ], [VERSION, [NAME, BLACKBERRY]], [
                /(?:symbian ?os|symbos|s60(?=;)|series ?60)[-\/ ]?([\w\.]*)/i       // Symbian
                ], [VERSION, [NAME, 'Symbian']], [
                /mozilla\/[\d\.]+ \((?:mobile|tablet|tv|mobile; [\w ]+); rv:.+ gecko\/([\w\.]+)/i // Firefox OS
                ], [VERSION, [NAME, FIREFOX+' OS']], [
                /web0s;.+rt(tv)/i,
                /\b(?:hp)?wos(?:browser)?\/([\w\.]+)/i                              // WebOS
                ], [VERSION, [NAME, 'webOS']], [
                /watch(?: ?os[,\/]|\d,\d\/)([\d\.]+)/i                              // watchOS
                ], [VERSION, [NAME, 'watchOS']], [

                // Google ChromeOS
                /(cros) [\w]+(?:\)| ([\w\.]+)\b)/i                                  // Chromium OS
                ], [[NAME, "Chrome OS"], VERSION],[

                // Smart TVs
                /panasonic;(viera)/i,                                               // Panasonic Viera
                /(netrange)mmh/i,                                                   // Netrange
                /(nettv)\/(\d+\.[\w\.]+)/i,                                         // NetTV

                // Console
                /(nintendo|playstation) (\w+)/i,                                    // Nintendo/Playstation
                /(xbox); +xbox ([^\);]+)/i,                                         // Microsoft Xbox (360, One, X, S, Series X, Series S)
                /(pico) .+os([\w\.]+)/i,                                            // Pico

                // Other
                /\b(joli|palm)\b ?(?:os)?\/?([\w\.]*)/i,                            // Joli/Palm
                /(mint)[\/\(\) ]?(\w*)/i,                                           // Mint
                /(mageia|vectorlinux)[; ]/i,                                        // Mageia/VectorLinux
                /([kxln]?ubuntu|debian|suse|opensuse|gentoo|arch(?= linux)|slackware|fedora|mandriva|centos|pclinuxos|red ?hat|zenwalk|linpus|raspbian|plan 9|minix|risc os|contiki|deepin|manjaro|elementary os|sabayon|linspire)(?: gnu\/linux)?(?: enterprise)?(?:[- ]linux)?(?:-gnu)?[-\/ ]?(?!chrom|package)([-\w\.]*)/i,
                                                                                    // Ubuntu/Debian/SUSE/Gentoo/Arch/Slackware/Fedora/Mandriva/CentOS/PCLinuxOS/RedHat/Zenwalk/Linpus/Raspbian/Plan9/Minix/RISCOS/Contiki/Deepin/Manjaro/elementary/Sabayon/Linspire
                /(hurd|linux)(?: arm\w*| x86\w*| ?)([\w\.]*)/i,                     // Hurd/Linux
                /(gnu) ?([\w\.]*)/i,                                                // GNU
                /\b([-frentopcghs]{0,5}bsd|dragonfly)[\/ ]?(?!amd|[ix346]{1,2}86)([\w\.]*)/i, // FreeBSD/NetBSD/OpenBSD/PC-BSD/GhostBSD/DragonFly
                /(haiku) (\w+)/i                                                    // Haiku
                ], [NAME, VERSION], [
                /(sunos) ?([\w\.\d]*)/i                                             // Solaris
                ], [[NAME, 'Solaris'], VERSION], [
                /((?:open)?solaris)[-\/ ]?([\w\.]*)/i,                              // Solaris
                /(aix) ((\d)(?=\.|\)| )[\w\.])*/i,                                  // AIX
                /\b(beos|os\/2|amigaos|morphos|openvms|fuchsia|hp-ux|serenityos)/i, // BeOS/OS2/AmigaOS/MorphOS/OpenVMS/Fuchsia/HP-UX/SerenityOS
                /(unix) ?([\w\.]*)/i                                                // UNIX
                ], [NAME, VERSION]
            ]
        };

        /////////////////
        // Factories
        ////////////////

        var defaultProps = (function () {
                var props = { init : {}, isIgnore : {}, isIgnoreRgx : {}, toString : {}};
                setProps.call(props.init, [
                    [UA_BROWSER, [NAME, VERSION, MAJOR, TYPE]],
                    [UA_CPU, [ARCHITECTURE]],
                    [UA_DEVICE, [TYPE, MODEL, VENDOR]],
                    [UA_ENGINE, [NAME, VERSION]],
                    [UA_OS, [NAME, VERSION]]
                ]);
                setProps.call(props.isIgnore, [
                    [UA_BROWSER, [VERSION, MAJOR]],
                    [UA_ENGINE, [VERSION]],
                    [UA_OS, [VERSION]]
                ]);
                setProps.call(props.isIgnoreRgx, [
                    [UA_BROWSER, / ?browser$/i],
                    [UA_OS, / ?os$/i]
                ]);
                setProps.call(props.toString, [
                    [UA_BROWSER, [NAME, VERSION]],
                    [UA_CPU, [ARCHITECTURE]],
                    [UA_DEVICE, [VENDOR, MODEL]],
                    [UA_ENGINE, [NAME, VERSION]],
                    [UA_OS, [NAME, VERSION]]
                ]);
                return props;
        })();

        var createIData = function (item, itemType) {

            var init_props = defaultProps.init[itemType],
                is_ignoreProps = defaultProps.isIgnore[itemType] || 0,
                is_ignoreRgx = defaultProps.isIgnoreRgx[itemType] || 0,
                toString_props = defaultProps.toString[itemType] || 0;

            function IData () {
                setProps.call(this, init_props);
            }

            IData.prototype.getItem = function () {
                return item;
            };

            IData.prototype.withClientHints = function () {

                // nodejs / non-client-hints browsers
                if (!NAVIGATOR_UADATA) {
                    return item
                            .parseCH()
                            .get();
                }

                // browsers based on chromium 85+
                return NAVIGATOR_UADATA
                        .getHighEntropyValues(CH_ALL_VALUES)
                        .then(function (res) {
                            return item
                                    .setCH(new UACHData(res, false))
                                    .parseCH()
                                    .get();
                });
            };

            IData.prototype.withFeatureCheck = function () {
                return item.detectFeature().get();
            };

            if (itemType != UA_RESULT) {
                IData.prototype.is = function (strToCheck) {
                    var is = false;
                    for (var i in this) {
                        if (this.hasOwnProperty(i) && !has(is_ignoreProps, i) && lowerize(is_ignoreRgx ? strip(is_ignoreRgx, this[i]) : this[i]) == lowerize(is_ignoreRgx ? strip(is_ignoreRgx, strToCheck) : strToCheck)) {
                            is = true;
                            if (strToCheck != UNDEF_TYPE) break;
                        } else if (strToCheck == UNDEF_TYPE && is) {
                            is = !is;
                            break;
                        }
                    }
                    return is;
                };
                IData.prototype.toString = function () {
                    var str = EMPTY;
                    for (var i in toString_props) {
                        if (typeof(this[toString_props[i]]) !== UNDEF_TYPE) {
                            str += (str ? ' ' : EMPTY) + this[toString_props[i]];
                        }
                    }
                    return str || UNDEF_TYPE;
                };
            }

            if (!NAVIGATOR_UADATA) {
                IData.prototype.then = function (cb) { 
                    var that = this;
                    var IDataResolve = function () {
                        for (var prop in that) {
                            if (that.hasOwnProperty(prop)) {
                                this[prop] = that[prop];
                            }
                        }
                    };
                    IDataResolve.prototype = {
                        is : IData.prototype.is,
                        toString : IData.prototype.toString
                    };
                    var resolveData = new IDataResolve();
                    cb(resolveData);
                    return resolveData;
                };
            }

            return new IData();
        };

        /////////////////
        // Constructor
        ////////////////

        function UACHData (uach, isHttpUACH) {
            uach = uach || {};
            setProps.call(this, CH_ALL_VALUES);
            if (isHttpUACH) {
                setProps.call(this, [
                    [BRANDS, itemListToArray(uach[CH_HEADER])],
                    [FULLVERLIST, itemListToArray(uach[CH_HEADER_FULL_VER_LIST])],
                    [MOBILE, /\?1/.test(uach[CH_HEADER_MOBILE])],
                    [MODEL, stripQuotes(uach[CH_HEADER_MODEL])],
                    [PLATFORM, stripQuotes(uach[CH_HEADER_PLATFORM])],
                    [PLATFORMVER, stripQuotes(uach[CH_HEADER_PLATFORM_VER])],
                    [ARCHITECTURE, stripQuotes(uach[CH_HEADER_ARCH])],
                    [FORMFACTORS, itemListToArray(uach[CH_HEADER_FORM_FACTORS])],
                    [BITNESS, stripQuotes(uach[CH_HEADER_BITNESS])]
                ]);
            } else {
                for (var prop in uach) {
                    if(this.hasOwnProperty(prop) && typeof uach[prop] !== UNDEF_TYPE) this[prop] = uach[prop];
                }
            }
        }

        function UAItem (itemType, ua, rgxMap, uaCH) {

            this.get = function (prop) {
                if (!prop) return this.data;
                return this.data.hasOwnProperty(prop) ? this.data[prop] : undefined;
            };

            this.set = function (prop, val) {
                this.data[prop] = val;
                return this;
            };

            this.setCH = function (ch) {
                this.uaCH = ch;
                return this;
            };

            this.detectFeature = function () {
                if (NAVIGATOR && NAVIGATOR.userAgent == this.ua) {
                    switch (this.itemType) {
                        case UA_BROWSER:
                            // Brave-specific detection
                            if (NAVIGATOR.brave && typeof NAVIGATOR.brave.isBrave == FUNC_TYPE) {
                                this.set(NAME, 'Brave');
                            }
                            break;
                        case UA_DEVICE:
                            // Chrome-specific detection: check for 'mobile' value of navigator.userAgentData
                            if (!this.get(TYPE) && NAVIGATOR_UADATA && NAVIGATOR_UADATA[MOBILE]) {
                                this.set(TYPE, MOBILE);
                            }
                            // iPadOS-specific detection: identified as Mac, but has some iOS-only properties
                            if (this.get(MODEL) == 'Macintosh' && NAVIGATOR && typeof NAVIGATOR.standalone !== UNDEF_TYPE && NAVIGATOR.maxTouchPoints && NAVIGATOR.maxTouchPoints > 2) {
                                this.set(MODEL, 'iPad')
                                    .set(TYPE, TABLET);
                            }
                            break;
                        case UA_OS:
                            // Chrome-specific detection: check for 'platform' value of navigator.userAgentData
                            if (!this.get(NAME) && NAVIGATOR_UADATA && NAVIGATOR_UADATA[PLATFORM]) {
                                this.set(NAME, NAVIGATOR_UADATA[PLATFORM]);
                            }
                            break;
                        case UA_RESULT:
                            var data = this.data;
                            var detect = function (itemType) {
                                return data[itemType]
                                        .getItem()
                                        .detectFeature()
                                        .get();
                            };
                            this.set(UA_BROWSER, detect(UA_BROWSER))
                                .set(UA_CPU, detect(UA_CPU))
                                .set(UA_DEVICE, detect(UA_DEVICE))
                                .set(UA_ENGINE, detect(UA_ENGINE))
                                .set(UA_OS, detect(UA_OS));
                    }
                }
                return this;
            };

            this.parseUA = function () {
                if (this.itemType != UA_RESULT) {
                    rgxMapper.call(this.data, this.ua, this.rgxMap);
                }
                if (this.itemType == UA_BROWSER) {
                    this.set(MAJOR, majorize(this.get(VERSION)));
                }
                return this;
            };

            this.parseCH = function () {
                var uaCH = this.uaCH,
                    rgxMap = this.rgxMap;
        
                switch (this.itemType) {
                    case UA_BROWSER:
                    case UA_ENGINE:
                        var brands = uaCH[FULLVERLIST] || uaCH[BRANDS], prevName;
                        if (brands) {
                            for (var i in brands) {
                                var brandName = brands[i].brand || brands[i],
                                    brandVersion = brands[i].version;
                                if (this.itemType == UA_BROWSER && !/not.a.brand/i.test(brandName) && (!prevName || (/chrom/i.test(prevName) && brandName != CHROMIUM))) {
                                    brandName = strMapper(brandName, {
                                        'Chrome' : 'Google Chrome',
                                        'Edge' : 'Microsoft Edge',
                                        'Chrome WebView' : 'Android WebView',
                                        'Chrome Headless' : 'HeadlessChrome',
                                        'Huawei Browser' : 'HuaweiBrowser',
                                        'MIUI Browser' : 'Miui Browser',
                                        'Opera Mobi' : 'OperaMobile',
                                        'Yandex' : 'YaBrowser'
                                    });
                                    this.set(NAME, brandName)
                                        .set(VERSION, brandVersion)
                                        .set(MAJOR, majorize(brandVersion));
                                    prevName = brandName;
                                }
                                if (this.itemType == UA_ENGINE && brandName == CHROMIUM) {
                                    this.set(VERSION, brandVersion);
                                }
                            }
                        }
                        break;
                    case UA_CPU:
                        var archName = uaCH[ARCHITECTURE];
                        if (archName) {
                            if (archName && uaCH[BITNESS] == '64') archName += '64';
                            rgxMapper.call(this.data, archName + ';', rgxMap);
                        }
                        break;
                    case UA_DEVICE:
                        if (uaCH[MOBILE]) {
                            this.set(TYPE, MOBILE);
                        }
                        if (uaCH[MODEL]) {
                            this.set(MODEL, uaCH[MODEL]);
                            if (!this.get(TYPE) || !this.get(VENDOR)) {
                                var reParse = {};
                                rgxMapper.call(reParse, 'droid 9; ' + uaCH[MODEL] + ')', rgxMap);
                                if (!this.get(TYPE) && !!reParse.type) {
                                    this.set(TYPE, reParse.type);
                                }
                                if (!this.get(VENDOR) && !!reParse.vendor) {
                                    this.set(VENDOR, reParse.vendor);
                                }
                            }
                        }
                        if (uaCH[FORMFACTORS]) {
                            var ff;
                            if (typeof uaCH[FORMFACTORS] !== 'string') {
                                var idx = 0;
                                while (!ff && idx < uaCH[FORMFACTORS].length) {
                                    ff = strMapper(uaCH[FORMFACTORS][idx++], formFactorsMap);
                                }
                            } else {
                                ff = strMapper(uaCH[FORMFACTORS], formFactorsMap);
                            }
                            this.set(TYPE, ff);
                        }
                        break;
                    case UA_OS:
                        var osName = uaCH[PLATFORM];
                        if(osName) {
                            var osVersion = uaCH[PLATFORMVER];
                            if (osName == WINDOWS) osVersion = (parseInt(majorize(osVersion), 10) >= 13 ? '11' : '10');
                            this.set(NAME, osName)
                                .set(VERSION, osVersion);
                        }
                        // Xbox-Specific Detection
                        if (this.get(NAME) == WINDOWS && uaCH[MODEL] == 'Xbox') {
                            this.set(NAME, 'Xbox')
                                .set(VERSION, undefined);
                        }           
                        break;
                    case UA_RESULT:
                        var data = this.data;
                        var parse = function (itemType) {
                            return data[itemType]
                                    .getItem()
                                    .setCH(uaCH)
                                    .parseCH()
                                    .get();
                        };
                        this.set(UA_BROWSER, parse(UA_BROWSER))
                            .set(UA_CPU, parse(UA_CPU))
                            .set(UA_DEVICE, parse(UA_DEVICE))
                            .set(UA_ENGINE, parse(UA_ENGINE))
                            .set(UA_OS, parse(UA_OS));
                }
                return this;
            };

            setProps.call(this, [
                ['itemType', itemType],
                ['ua', ua],
                ['uaCH', uaCH],
                ['rgxMap', rgxMap],
                ['data', createIData(this, itemType)]
            ]);

            return this;
        }

        function UAParser (ua, extensions, headers) {

            if (typeof ua === OBJ_TYPE) {
                if (isExtensions(ua, true)) {
                    if (typeof extensions === OBJ_TYPE) {
                        headers = extensions;               // case UAParser(extensions, headers)           
                    }
                    extensions = ua;                        // case UAParser(extensions)
                } else {
                    headers = ua;                           // case UAParser(headers)
                    extensions = undefined;
                }
                ua = undefined;
            } else if (typeof ua === STR_TYPE && !isExtensions(extensions, true)) {
                headers = extensions;                       // case UAParser(ua, headers)
                extensions = undefined;
            }

            // Convert Headers object into a plain object
            if (headers && typeof headers.append === FUNC_TYPE) {
                var kv = {};
                headers.forEach(function (v, k) { kv[k] = v; });
                headers = kv;
            }
            
            if (!(this instanceof UAParser)) {
                return new UAParser(ua, extensions, headers).getResult();
            }

            var userAgent = typeof ua === STR_TYPE ? ua :                                       // Passed user-agent string
                                    (headers && headers[USER_AGENT] ? headers[USER_AGENT] :     // User-Agent from passed headers
                                    ((NAVIGATOR && NAVIGATOR.userAgent) ? NAVIGATOR.userAgent : // navigator.userAgent
                                        EMPTY)),                                                // empty string

                httpUACH = new UACHData(headers, true),
                regexMap = extensions ? 
                            extend(defaultRegexes, extensions) : 
                            defaultRegexes,

                createItemFunc = function (itemType) {
                    if (itemType == UA_RESULT) {
                        return function () {
                            return new UAItem(itemType, userAgent, regexMap, httpUACH)
                                        .set('ua', userAgent)
                                        .set(UA_BROWSER, this.getBrowser())
                                        .set(UA_CPU, this.getCPU())
                                        .set(UA_DEVICE, this.getDevice())
                                        .set(UA_ENGINE, this.getEngine())
                                        .set(UA_OS, this.getOS())
                                        .get();
                        };
                    } else {
                        return function () {
                            return new UAItem(itemType, userAgent, regexMap[itemType], httpUACH)
                                        .parseUA()
                                        .get();
                        };
                    }
                };
                
            // public methods
            setProps.call(this, [
                ['getBrowser', createItemFunc(UA_BROWSER)],
                ['getCPU', createItemFunc(UA_CPU)],
                ['getDevice', createItemFunc(UA_DEVICE)],
                ['getEngine', createItemFunc(UA_ENGINE)],
                ['getOS', createItemFunc(UA_OS)],
                ['getResult', createItemFunc(UA_RESULT)],
                ['getUA', function () { return userAgent; }],
                ['setUA', function (ua) {
                    if (isString(ua))
                        userAgent = ua.length > UA_MAX_LENGTH ? trim(ua, UA_MAX_LENGTH) : ua;
                    return this;
                }]
            ])
            .setUA(userAgent);

            return this;
        }

        UAParser.VERSION = LIBVERSION;
        UAParser.BROWSER =  enumerize([NAME, VERSION, MAJOR, TYPE]);
        UAParser.CPU = enumerize([ARCHITECTURE]);
        UAParser.DEVICE = enumerize([MODEL, VENDOR, TYPE, CONSOLE, MOBILE, SMARTTV, TABLET, WEARABLE, EMBEDDED]);
        UAParser.ENGINE = UAParser.OS = enumerize([NAME, VERSION]);

    const getOs = async () => {
        const parser = new UAParser(navigator.userAgent);
        const result = parser.getResult();
        return { ...result.os, device_type: getDeviceType() };
    };
    const getDeviceType = () => {
        const w = window.innerWidth;
        if (w <= 767)
            return 'mobile';
        if (w <= 1024)
            return 'tablet';
        return 'desktop';
    };

    const ALLOWED_DEVICE_TYPES = ["mobile", "desktop", "tablet"];

    // Normalize the gueesed Os
    const normalizeOs = (platform) => {
        if (!platform)
            return null;
        const lowerPlatform = platform.toLowerCase();
        if (lowerPlatform.includes("android"))
            return "android";
        if (lowerPlatform.includes("iphone") ||
            lowerPlatform.includes("ipad") ||
            lowerPlatform === "ios")
            return "ios";
        if (lowerPlatform.includes("win"))
            return "windows";
        if (lowerPlatform.includes("mac") || lowerPlatform.includes("macos"))
            return "macos";
        if (lowerPlatform.includes("linux"))
            return "linux";
        // if (lowerPlatform.includes("cros")) return "linux"; // Example extension
        return null;
    };
    const patterns = {
        ios: [/apple a\d+ gpu/i],
        macos: [/apple m\d+/i, /opengl engine/i],
        windows: [/angle.*direct3d/i],
        android: [/adreno|mali|powervr/i],
        linux: [/mesa|x11/i],
    };
    // Detect the actual OS from the GPU vendor and renderer if available
    const detectActualOs = (renderer) => {
        if (patterns.ios.some((pattern) => pattern.test(renderer))) {
            return "ios";
        }
        else if (patterns.macos.some((pattern) => pattern.test(renderer))) {
            return "macos";
        }
        else if (patterns.windows.some((pattern) => pattern.test(renderer))) {
            return "windows";
        }
        else if (patterns.android.some((pattern) => pattern.test(renderer))) {
            return "android";
        }
        else if (patterns.linux.some((pattern) => pattern.test(renderer)) ||
            /NVIDIA|AMD|Intel/i.test(renderer)) {
            return "linux";
        }
        else {
            return null;
        }
    };
    const determineDeviceType = (claimedMobile, hasTouch, screenWidth, realOs) => {
        // Determine the real device type from the os
        if (realOs === "ios" || realOs === "android") {
            return screenWidth > 768 ? "tablet" : "mobile";
        }
        if (realOs === "windows" || realOs === "macos" || realOs === "linux") {
            return 'desktop';
        }
        // check using touch attributes if the os couldn't determine device type
        if (hasTouch) {
            if (screenWidth < 600)
                return "mobile";
            if (screenWidth <= 1024)
                return "tablet";
            if (claimedMobile === false)
                return "desktop"; // Likely touch laptop
            return "tablet"; // Default large touch to tablet
        }
        if (!hasTouch) {
            return "desktop";
        }
        return null;
    };
    const guessDeviceTypeFromUA = (ua) => {
        const lowerUa = ua.toLowerCase();
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(lowerUa)) {
            return "tablet";
        }
        if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|hpwos|Opera M(obi|ini)/i.test(lowerUa)) {
            return "mobile";
        }
        if (lowerUa.includes("windows nt") ||
            lowerUa.includes("macintosh") ||
            lowerUa.includes("x11")) {
            return "desktop";
        }
        return null;
    };
    const convertToTwoDP = (num) => {
        return parseFloat(num.toFixed(2));
    };
    const isAllowedDeviceType = (type) => {
        return !!type && ALLOWED_DEVICE_TYPES.includes(type);
    };

    const analyzeSpoofing = (claimed, signals) => {
        var _a;
        const MAX_CONFIDENCE_SCORE = 1.0;
        let score = MAX_CONFIDENCE_SCORE;
        const conflicts = [];
        const analysis = {
            confidence: MAX_CONFIDENCE_SCORE,
            spoofingConfidence: 0.0,
            isSpoofed: false,
            detectionConflicts: [],
            realPlatform: null,
            realDeviceType: null,
        };
        const hasTouch = signals.touchPoints > 0;
        const screenWidth = signals.screen.width;
        const claimedOs = normalizeOs(claimed.platform);
        const gpuOs = detectActualOs(((_a = signals.webGL.renderer) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || '');
        const platformOs = normalizeOs(signals.actualPlatform);
        const actualOs = gpuOs || platformOs;
        let suspectedOs = claimedOs;
        // --- Apply Rules ---
        // Rule 1: Os Mismatch
        if (claimedOs && actualOs && claimedOs !== actualOs) {
            score -= 0.3;
            conflicts.push(`Claimed OS "${claimedOs}" disagrees with actual OS signal "${actualOs}".`);
            suspectedOs = actualOs; // Trust actual signal more initially
        }
        else if (claimedOs && !actualOs && claimed.platform !== '') {
            score -= 0.2;
            conflicts.push(`Actual OS signal "${signals.actualPlatform}" is unrecognized.`);
            suspectedOs = claimedOs;
        }
        else if (!claimedOs && actualOs) {
            score -= 0.2;
            conflicts.push(`Claimed OS signal "${claimed.platform}" is unrecognized.`);
            suspectedOs = actualOs;
        }
        // Rule 2: GPU Vendor vs Determined Preliminary OS
        const gpuVendor = (signals.webGL.vendor || "").toLowerCase();
        const gpuRenderer = (signals.webGL.renderer || "").toLowerCase();
        if (gpuVendor && gpuVendor !== 'n/a' && gpuVendor !== 'n/a (masked)') {
            let gpuConflict = false;
            let gpuSuggestedOs = null;
            if (suspectedOs === 'android' && (gpuVendor.includes('apple') || gpuRenderer.includes('apple'))) {
                gpuConflict = true;
                gpuSuggestedOs = 'ios';
            }
            else if (suspectedOs === 'ios' && !gpuVendor.includes('apple') && !gpuRenderer.includes('apple')) {
                gpuConflict = true;
                if (gpuVendor.includes('qualcomm') || gpuVendor.includes('adreno') || gpuVendor.includes('mali') || gpuVendor.includes('powervr') || gpuVendor.includes('arm')) {
                    gpuSuggestedOs = 'android';
                }
                else if (gpuVendor.includes('intel') || gpuRenderer.includes('intel') || gpuVendor.includes('nvidia') || gpuRenderer.includes('nvidia') || gpuVendor.includes('amd') || gpuRenderer.includes('amd') || gpuRenderer.includes('radeon')) {
                    gpuSuggestedOs = 'windows';
                }
                else {
                    gpuSuggestedOs = 'android';
                }
            }
            else if (suspectedOs === 'windows' && (gpuVendor.includes('apple') || gpuRenderer.includes('apple'))) {
                gpuConflict = true;
                gpuSuggestedOs = 'macos';
            }
            else if (suspectedOs === 'macos' && !(gpuVendor.includes('apple') || gpuRenderer.includes('apple') || gpuVendor.includes('intel') || gpuRenderer.includes('intel') || gpuVendor.includes('amd') || gpuRenderer.includes('amd') || gpuRenderer.includes('radeon'))) {
                gpuConflict = true;
                if (gpuVendor.includes('qualcomm') || gpuVendor.includes('adreno') || gpuVendor.includes('mali') || gpuVendor.includes('powervr') || gpuVendor.includes('arm')) {
                    gpuSuggestedOs = 'android';
                }
                else {
                    gpuSuggestedOs = 'windows';
                }
            }
            if (gpuConflict) {
                score -= 0.5;
                conflicts.push(`OS "${suspectedOs}" conflicts with GPU "${signals.webGL.vendor} / ${signals.webGL.renderer}". GPU suggests "${gpuSuggestedOs || 'unknown'}".`);
                if (gpuSuggestedOs) {
                    suspectedOs = gpuSuggestedOs;
                }
            }
            // Add logic here for suspicious but not conflicting GPUs if desired (e.g., Intel GPU on Android)
        }
        else if (signals.webGL.error) {
            score -= 0.1;
            conflicts.push(`WebGL info unavailable (${signals.webGL.error}).`);
        }
        // Rule 3: Claimed Device Type vs Touch Support
        let preliminaryRealDeviceType = null;
        const normalizedClaimedType = isAllowedDeviceType(claimed.guessedDeviceType) ? claimed.guessedDeviceType : null;
        if (claimed.mobile === true && !hasTouch) {
            score -= 0.3;
            conflicts.push(`Claimed mobile=true but no touch points detected.`);
            preliminaryRealDeviceType = 'desktop';
        }
        else if (claimed.mobile === false && hasTouch) {
            score -= 0.15;
            conflicts.push(`Claimed mobile=false but touch points detected.`);
            preliminaryRealDeviceType = determineDeviceType(claimed.mobile, hasTouch, screenWidth, suspectedOs);
        }
        else if (normalizedClaimedType) {
            // If claimed type exists and doesn't conflict strongly with touch, use it as preliminary
            preliminaryRealDeviceType = normalizedClaimedType;
        }
        // Rule 4: Screen Size vs Preliminary Device Type Sanity Check
        const typicalMobileWidth = 768;
        const typicalTabletWidth = 1024;
        if (preliminaryRealDeviceType === 'mobile' && screenWidth > typicalTabletWidth) {
            score -= 0.15;
            conflicts.push(`Device type 'mobile', but screen width (${screenWidth}px) is large.`);
            preliminaryRealDeviceType = 'tablet';
        }
        else if (preliminaryRealDeviceType === 'desktop' && screenWidth < typicalMobileWidth) {
            score -= 0.15;
            conflicts.push(`Preliminary type 'desktop', but screen width (${screenWidth}px) is small.`);
            preliminaryRealDeviceType = hasTouch ? 'mobile' : 'desktop';
        }
        // --- Finalize Analysis ---
        // We use the suspected Os but fallback to the claimed os of the ua if null
        analysis.realPlatform = suspectedOs || claimedOs;
        // Determine final device type
        const determinedType = determineDeviceType(claimed.mobile, hasTouch, screenWidth, analysis.realPlatform);
        if (!preliminaryRealDeviceType) {
            analysis.realDeviceType = determinedType;
        }
        else {
            // Check if the determined type based on final signals contradicts the preliminary one
            if (determinedType && determinedType !== preliminaryRealDeviceType) {
                score -= 0.12; // Small penalty for internal inconsistency
                conflicts.push(`Initial device type guess (${preliminaryRealDeviceType}) adjusted to ${determinedType} based on final signals.`);
                analysis.realDeviceType = determinedType;
            }
            else {
                analysis.realDeviceType = preliminaryRealDeviceType;
            }
        }
        // Ensure device type is populated based on OS if still null
        if (!analysis.realDeviceType) {
            if (analysis.realPlatform === 'ios' || analysis.realPlatform === 'android') {
                analysis.realDeviceType = determinedType || 'mobile';
            }
            else if (analysis.realPlatform) { // windows, macos, linux
                analysis.realDeviceType = determinedType || 'desktop';
            }
            else { // OS unknown
                analysis.realDeviceType = hasTouch ? (screenWidth > 768 ? 'tablet' : 'mobile') : 'desktop';
            }
        }
        analysis.confidence = convertToTwoDP(Math.max(0, score));
        analysis.spoofingConfidence = convertToTwoDP(MAX_CONFIDENCE_SCORE - analysis.confidence);
        analysis.isSpoofed = analysis.spoofingConfidence > 0.1;
        analysis.detectionConflicts = conflicts;
        return analysis;
    };

    // What the device claims to be is gotten from the useragent string
    const getClaimedData = async (userAgentString) => {
        var _a;
        const claimed = {
            platform: "unknown",
            mobile: null,
            brands: [],
            guessedDeviceType: null,
        };
        try {
            if (navigator.userAgentData) {
                const uaData = await navigator.userAgentData.getHighEntropyValues([
                    "platform", "platformVersion", "architecture", "model", "uaFullVersion", "brands", "mobile",
                ]);
                claimed.platform = uaData.platform;
                claimed.mobile = (_a = uaData.mobile) !== null && _a !== void 0 ? _a : null;
                claimed.brands = uaData.brands || [];
                // Initial guess - will be refined later using signals if needed
                if (claimed.mobile === true) {
                    claimed.guessedDeviceType = screen.width > 768 ? "tablet" : "mobile";
                }
                else if (claimed.mobile === false) {
                    claimed.guessedDeviceType = "desktop";
                }
            }
            else {
                const ua = userAgentString;
                const lowerUa = ua.toLowerCase();
                // Determine the device platform from user agent string
                if (lowerUa.includes("android"))
                    claimed.platform = "Android";
                else if (lowerUa.includes("iphone") || lowerUa.includes("ipad"))
                    claimed.platform = "iOS";
                else if (lowerUa.includes("windows nt"))
                    claimed.platform = "Windows";
                else if (lowerUa.includes("mac os x") || lowerUa.includes("macintosh"))
                    claimed.platform = "macOS";
                else if (lowerUa.includes("linux"))
                    claimed.platform = "Linux";
                const guessedType = guessDeviceTypeFromUA(ua);
                claimed.guessedDeviceType = guessedType;
                claimed.mobile = guessedType === 'mobile' || guessedType === 'tablet';
                const brandMatch = ua.match(/(Apple|Samsung|Google|Microsoft|Sony|LG|HTC|Nokia|Motorola|Huawei|Xiaomi|Pixel|Firefox|Safari|Edge|Chrome)/i);
                if (brandMatch) {
                    const versionMatch = ua.match(new RegExp(brandMatch[0] + "[ /]([\\d._]+)"));
                    claimed.brands.push({ brand: brandMatch[0], version: versionMatch ? versionMatch[1] : "unknown" });
                }
            }
        }
        catch (e) {
            console.error("Error getting User Agent Data:", e);
        }
        return claimed;
    };
    // What we actually think the device could be achieved from some of this signals
    const getSignalData = () => {
        var _a;
        const signals = {
            actualPlatform: ((_a = navigator.userAgentData) === null || _a === void 0 ? void 0 : _a.platform) || navigator.platform,
            touchPoints: navigator.maxTouchPoints || 0,
            screen: {
                width: screen.width,
                height: screen.height,
                pixelRatio: window.devicePixelRatio || 1,
            },
            webGL: { vendor: null, renderer: null, error: "" },
            userAgentString: navigator.userAgent,
        };
        try {
            const canvas = document.createElement("canvas");
            const gl = canvas.getContext("webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
            if (gl && 'getParameter' in gl) {
                const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
                if (debugInfo) {
                    signals.webGL.vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || "n/a";
                    signals.webGL.renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || "n/a";
                }
                else {
                    signals.webGL.vendor = gl.getParameter(gl.VENDOR) || "n/a (masked)";
                    signals.webGL.renderer = gl.getParameter(gl.RENDERER) || "n/a (masked)";
                    if (!signals.webGL.vendor || signals.webGL.vendor === "n/a (masked)") {
                        signals.webGL.error = "Debug info extension unavailable or vendor masked";
                    }
                }
            }
            else {
                signals.webGL.error = "WebGL context unavailable";
            }
        }
        catch (error) {
            console.error("Error getting WebGL data:", error);
            signals.webGL.error = error instanceof Error ? error.message : "Unknown WebGL error";
        }
        return signals;
    };

    const getDeviceDetails = async () => {
        // 1. Initialize structure
        const initialResults = {
            claimed: {
                platform: null,
                mobile: null,
                brands: [],
                guessedDeviceType: null,
            },
            signals: {
                actualPlatform: null,
                touchPoints: 0,
                screen: { width: 0, height: 0, pixelRatio: 1 },
                webGL: { vendor: null, renderer: null, error: "" },
                userAgentString: "",
            },
            analysis: {
                confidence: 1.0,
                spoofingConfidence: 0.0,
                isSpoofed: false,
                detectionConflicts: [],
                realPlatform: null,
                realDeviceType: null,
            },
        };
        // 2. Gather Signals (Sync first)
        const signals = getSignalData();
        initialResults.signals = signals;
        // 3. Gather Claimed Data (Async) - Pass UA string from signals
        const claimed = await getClaimedData(signals.userAgentString);
        initialResults.claimed = claimed;
        // 4. Analyze Data
        const analysis = analyzeSpoofing(claimed, signals);
        initialResults.analysis = analysis;
        // 5. Format Final Output
        const tamperingResult = () => {
            if (analysis.isSpoofed) {
                return { status: true, confidence: analysis.spoofingConfidence };
            }
            else {
                return { status: false };
            }
        };
        const finalResults = {
            ...initialResults,
            deviceOs: analysis.realPlatform,
            deviceType: analysis.realDeviceType,
            tampering: tamperingResult(),
        };
        return finalResults;
    };

    async function getBrowserDetails() {
        const { name, version } = detectBrowser$1();
        return {
            name,
            version,
            userAgent: navigator.userAgent,
        };
    }

    async function createAudioFingerprint() {
        const resultPromise = new Promise((resolve, reject) => {
            try {
                // Set up audio parameters
                const sampleRate = 44100;
                const numSamples = 5000;
                const audioContext = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, numSamples, sampleRate);
                const audioBuffer = audioContext.createBufferSource();
                const analyser = audioContext.createAnalyser();
                const frequencyData = new Float32Array(analyser.frequencyBinCount);
                analyser.getFloatFrequencyData(frequencyData);
                const oscillator = audioContext.createOscillator();
                oscillator.frequency.value = 1000;
                const compressor = audioContext.createDynamicsCompressor();
                compressor.threshold.value = -50;
                compressor.knee.value = 40;
                compressor.ratio.value = 12;
                compressor.attack.value = 0;
                compressor.release.value = 0.2;
                oscillator.connect(compressor);
                compressor.connect(audioContext.destination);
                oscillator.start();
                audioContext.oncomplete = () => {
                    resolve({
                        'oscillator': oscillator.type,
                        'maxChannels': audioContext.destination.maxChannelCount,
                        'channelCountMode': audioBuffer.channelCountMode,
                        'frequencyBinCount': analyser.frequencyBinCount,
                    });
                };
                audioContext.startRendering();
                // audioContext.close();
            }
            catch (error) {
                console.error('Error creating audio fingerprint:', error);
                reject(error);
            }
        });
        return resultPromise;
    }
    includeComponent('audio', createAudioFingerprint);

    function getCommonPixels(images, width, height) {
        let finalData = [];
        for (let i = 0; i < images[0].data.length; i++) {
            let indice = [];
            for (let u = 0; u < images.length; u++) {
                indice.push(images[u].data[i]);
            }
            finalData.push(getMostFrequent(indice));
        }
        const pixelData = finalData;
        const pixelArray = new Uint8ClampedArray(pixelData);
        return new ImageData(pixelArray, width, height);
    }
    function getMostFrequent(arr) {
        if (arr.length === 0) {
            return 0; // Handle empty array case
        }
        const frequencyMap = {};
        // Count occurrences of each number in the array
        for (const num of arr) {
            frequencyMap[num] = (frequencyMap[num] || 0) + 1;
        }
        let mostFrequent = arr[0];
        // Find the number with the highest frequency
        for (const num in frequencyMap) {
            if (frequencyMap[num] > frequencyMap[mostFrequent]) {
                mostFrequent = parseInt(num, 10);
            }
        }
        return mostFrequent;
    }

    const _RUNS = (getBrowserName() !== 'SamsungBrowser') ? 1 : 3;
    /**
     * A simple canvas finger printing function
     *
     * @returns a CanvasInfo JSON object
     */
    const _WIDTH = 280;
    const _HEIGHT = 20;
    function generateCanvasFingerprint() {
        return new Promise((resolve) => {
            /**
             * Since some browsers fudge with the canvas pixels to prevent fingerprinting, the following
             * creates the canvas three times and getCommonPixels picks the most common byte for each
             * channel of each pixel.
             */
            const imageDatas = Array.from({ length: _RUNS }, () => generateCanvasImageData());
            const commonImageData = getCommonPixels(imageDatas, _WIDTH, _HEIGHT);
            resolve({
                'commonImageDataHash': hash(commonImageData.data.toString()).toString(),
            });
        });
    }
    function generateCanvasImageData() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return new ImageData(1, 1);
        }
        // Set canvas dimensions
        canvas.width = _WIDTH;
        canvas.height = _HEIGHT;
        // Create rainbow gradient for the background rectangle
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, "red");
        gradient.addColorStop(1 / 6, "orange");
        gradient.addColorStop(2 / 6, "yellow");
        gradient.addColorStop(3 / 6, "green");
        gradient.addColorStop(4 / 6, "blue");
        gradient.addColorStop(5 / 6, "indigo");
        gradient.addColorStop(1, "violet");
        // Draw background rectangle with the rainbow gradient
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Draw some random text
        const randomText = 'Random Text WMwmil10Oo';
        ctx.font = '23.123px Arial';
        ctx.fillStyle = 'black';
        ctx.fillText(randomText, -5, 15);
        // Draw the same text with an offset, different color, and slight transparency
        ctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
        ctx.fillText(randomText, -3.3, 17.7);
        // Draw a line crossing the image at an arbitrary angle
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(canvas.width * 2 / 7, canvas.height);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        // Return data URL of the canvas
        return imageData;
    }
    if (getBrowserName() != 'Firefox')
        includeComponent('canvas', generateCanvasFingerprint);

    async function ephemeralIFrame(callback) {
        var _a;
        while (!document.body) {
            await wait$1(50);
        }
        const iframe = document.createElement('iframe');
        iframe.setAttribute('frameBorder', '0');
        const style = iframe.style;
        style.setProperty('position', 'fixed');
        style.setProperty('display', 'block', 'important');
        style.setProperty('visibility', 'visible');
        style.setProperty('border', '0');
        style.setProperty('opacity', '0');
        iframe.src = 'about:blank';
        document.body.appendChild(iframe);
        const iframeDocument = iframe.contentDocument || ((_a = iframe.contentWindow) === null || _a === void 0 ? void 0 : _a.document);
        if (!iframeDocument) {
            throw new Error('Iframe document is not accessible');
        }
        // Execute the callback function with access to the iframe's document
        callback({ iframe: iframeDocument });
        // Clean up after running the callback
        setTimeout(() => {
            document.body.removeChild(iframe);
        }, 0);
    }
    function wait$1(durationMs, resolveWith) {
        return new Promise((resolve) => setTimeout(resolve, durationMs, resolveWith));
    }

    const availableFonts = [
        'Arial',
        'Arial Black',
        'Arial Narrow',
        'Arial Rounded MT',
        'Arimo',
        'Archivo',
        'Barlow',
        'Bebas Neue',
        'Bitter',
        'Bookman',
        'Calibri',
        'Cabin',
        'Candara',
        'Century',
        'Century Gothic',
        'Comic Sans MS',
        'Constantia',
        'Courier',
        'Courier New',
        'Crimson Text',
        'DM Mono',
        'DM Sans',
        'DM Serif Display',
        'DM Serif Text',
        'Dosis',
        'Droid Sans',
        'Exo',
        'Fira Code',
        'Fira Sans',
        'Franklin Gothic Medium',
        'Garamond',
        'Geneva',
        'Georgia',
        'Gill Sans',
        'Helvetica',
        'Impact',
        'Inconsolata',
        'Indie Flower',
        'Inter',
        'Josefin Sans',
        'Karla',
        'Lato',
        'Lexend',
        'Lucida Bright',
        'Lucida Console',
        'Lucida Sans Unicode',
        'Manrope',
        'Merriweather',
        'Merriweather Sans',
        'Montserrat',
        'Myriad',
        'Noto Sans',
        'Nunito',
        'Nunito Sans',
        'Open Sans',
        'Optima',
        'Orbitron',
        'Oswald',
        'Pacifico',
        'Palatino',
        'Perpetua',
        'PT Sans',
        'PT Serif',
        'Poppins',
        'Prompt',
        'Public Sans',
        'Quicksand',
        'Rajdhani',
        'Recursive',
        'Roboto',
        'Roboto Condensed',
        'Rockwell',
        'Rubik',
        'Segoe Print',
        'Segoe Script',
        'Segoe UI',
        'Sora',
        'Source Sans Pro',
        'Space Mono',
        'Tahoma',
        'Taviraj',
        'Times',
        'Times New Roman',
        'Titillium Web',
        'Trebuchet MS',
        'Ubuntu',
        'Varela Round',
        'Verdana',
        'Work Sans',
    ];
    const baseFonts = ['monospace', 'sans-serif', 'serif'];
    function getFontMetrics() {
        return new Promise((resolve, reject) => {
            try {
                ephemeralIFrame(async ({ iframe }) => {
                    const canvas = iframe.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const defaultWidths = baseFonts.map((font) => {
                        return measureSingleFont(ctx, font);
                    });
                    let results = {};
                    availableFonts.forEach((font) => {
                        const fontWidth = measureSingleFont(ctx, font);
                        if (!defaultWidths.includes(fontWidth))
                            results[font] = fontWidth;
                    });
                    resolve(results);
                });
            }
            catch (error) {
                reject({ 'error': 'unsupported' });
            }
        });
    }
    function measureSingleFont(ctx, font) {
        if (!ctx) {
            throw new Error('Canvas context not supported');
        }
        const text = "WwMmLli0Oo";
        ctx.font = `72px ${font}`; // Set a default font size
        return ctx.measureText(text).width;
    }
    if (getBrowserName() != 'Firefox')
        includeComponent('fonts', getFontMetrics);

    function getHardwareInfo() {
        return new Promise((resolve) => {
            const memoryInfo = (window.performance && window.performance.memory) ? window.performance.memory : 0;
            resolve({
                'videocard': getVideoCard(),
                'architecture': getArchitecture(),
                'jsHeapSizeLimit': memoryInfo.jsHeapSizeLimit || 0
            });
        });
    }
    function getVideoCard() {
        var _a;
        const canvas = document.createElement('canvas');
        const gl = (_a = canvas.getContext('webgl')) !== null && _a !== void 0 ? _a : canvas.getContext('experimental-webgl');
        if (gl && 'getParameter' in gl) {
            try {
                // Try standard parameters first
                const vendor = (gl.getParameter(gl.VENDOR) || '').toString();
                const renderer = (gl.getParameter(gl.RENDERER) || '').toString();
                let result = {
                    vendor: vendor,
                    renderer: renderer,
                    version: (gl.getParameter(gl.VERSION) || '').toString(),
                    shadingLanguageVersion: (gl.getParameter(gl.SHADING_LANGUAGE_VERSION) || '').toString(),
                };
                // Only try debug info if needed and available
                const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
                if (debugInfo) {
                    const vendorUnmasked = (gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '').toString();
                    const rendererUnmasked = (gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '').toString();
                    // Only add unmasked values if they exist
                    if (vendorUnmasked) {
                        result.vendorUnmasked = vendorUnmasked;
                    }
                    if (rendererUnmasked) {
                        result.rendererUnmasked = rendererUnmasked;
                    }
                }
                return result;
            }
            catch (error) {
                // fail silently
            }
        }
        return "undefined";
    }
    function getArchitecture() {
        const f = new Float32Array(1);
        const u8 = new Uint8Array(f.buffer);
        f[0] = Infinity;
        f[0] = f[0] - f[0];
        return u8[3];
    }
    includeComponent('hardware', getHardwareInfo);

    function getLocales() {
        return new Promise((resolve) => {
            resolve({
                'languages': getUserLanguage(),
                'timezone': getUserTimezone()
            });
        });
    }
    function getUserLanguage() {
        return navigator.language;
    }
    function getUserTimezone() {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    includeComponent('locales', getLocales);

    function mostFrequentValue(arr) {
        if (arr.length === 0) {
            return null; // Return null for an empty array
        }
        const frequencyMap = {};
        // Count occurrences of each element in the array
        arr.forEach((element) => {
            const key = String(element);
            frequencyMap[key] = (frequencyMap[key] || 0) + 1;
        });
        let mostFrequent = arr[0]; // Assume the first element is the most frequent
        let highestFrequency = 1; // Frequency of the assumed most frequent element
        // Find the element with the highest frequency
        Object.keys(frequencyMap).forEach((key) => {
            if (frequencyMap[key] > highestFrequency) {
                mostFrequent = key;
                highestFrequency = frequencyMap[key];
            }
        });
        return mostFrequent;
    }
    function mostFrequentValuesInArrayOfDictionaries(arr, keys) {
        const result = {};
        keys.forEach((key) => {
            const valuesForKey = arr.map((obj) => (key in obj ? obj[key] : undefined)).filter((val) => val !== undefined);
            const mostFrequentValueForKey = mostFrequentValue(valuesForKey);
            if (mostFrequentValueForKey)
                result[key] = mostFrequentValueForKey;
        });
        return result;
    }

    let permission_keys;
    function initializePermissionKeys() {
        permission_keys = (options === null || options === void 0 ? void 0 : options.permissions_to_check) || [
            'accelerometer',
            'accessibility', 'accessibility-events',
            'ambient-light-sensor',
            'background-fetch',
            'background-sync',
            'bluetooth',
            'clipboard-read',
            'clipboard-write',
            'device-info',
            'display-capture',
            'gyroscope',
            'local-fonts',
            'magnetometer',
            'midi',
            'nfc', 'notifications',
            'payment-handler',
            'persistent-storage',
            'speaker', 'storage-access',
            'top-level-storage-access',
            'window-management',
            'query',
        ];
    }
    async function getBrowserPermissions() {
        initializePermissionKeys();
        const permissionPromises = Array.from({ length: (options === null || options === void 0 ? void 0 : options.retries) || 3 }, () => getBrowserPermissionsOnce());
        return Promise.all(permissionPromises).then((resolvedPermissions) => {
            const permission = mostFrequentValuesInArrayOfDictionaries(resolvedPermissions, permission_keys);
            return permission;
        });
    }
    async function getBrowserPermissionsOnce() {
        const permissionStatus = {};
        for (const feature of permission_keys) {
            try {
                // Request permission status for each feature
                const status = await navigator.permissions.query({ name: feature });
                // Assign permission status to the object
                permissionStatus[feature] = status.state.toString();
            }
            catch (error) {
                // In case of errors (unsupported features, etc.), do nothing. Not listing them is the same as not supported
            }
        }
        return permissionStatus;
    }
    includeComponent("permissions", getBrowserPermissions);

    function screenDetails() {
        return new Promise((resolve) => {
            resolve({
                'colorDepth': screen.colorDepth,
            });
        });
    }
    includeComponent('screen', screenDetails);

    /*
     * This file contains functions to work with pure data only (no browser features, DOM, side effects, etc).
     */
    /**
     * Does the same as Array.prototype.includes but has better typing
     */
    /**
     * Be careful, NaN can return
     */
    function toInt(value) {
        return parseInt(value);
    }
    function replaceNaN(value, replacement) {
        return typeof value === 'number' && isNaN(value) ? replacement : value;
    }
    function countTruthy(values) {
        return values.reduce((sum, value) => sum + (value ? 1 : 0), 0);
    }
    /**
     * Parses a CSS selector into tag name with HTML attributes.
     * Only single element selector are supported (without operators like space, +, >, etc).
     *
     * Multiple values can be returned for each attribute. You decide how to handle them.
     */
    function parseSimpleCssSelector(selector) {
        var _a, _b;
        const errorMessage = `Unexpected syntax '${selector}'`;
        const tagMatch = /^\s*([a-z-]*)(.*)$/i.exec(selector);
        const tag = tagMatch[1] || undefined;
        const attributes = {};
        const partsRegex = /([.:#][\w-]+|\[.+?\])/gi;
        const addAttribute = (name, value) => {
            attributes[name] = attributes[name] || [];
            attributes[name].push(value);
        };
        for (;;) {
            const match = partsRegex.exec(tagMatch[2]);
            if (!match) {
                break;
            }
            const part = match[0];
            switch (part[0]) {
                case '.':
                    addAttribute('class', part.slice(1));
                    break;
                case '#':
                    addAttribute('id', part.slice(1));
                    break;
                case '[': {
                    const attributeMatch = /^\[([\w-]+)([~|^$*]?=("(.*?)"|([\w-]+)))?(\s+[is])?\]$/.exec(part);
                    if (attributeMatch) {
                        addAttribute(attributeMatch[1], (_b = (_a = attributeMatch[4]) !== null && _a !== void 0 ? _a : attributeMatch[5]) !== null && _b !== void 0 ? _b : '');
                    }
                    else {
                        throw new Error(errorMessage);
                    }
                    break;
                }
                default:
                    throw new Error(errorMessage);
            }
        }
        return [tag, attributes];
    }

    /**
     * Converts an error object to a plain object that can be used with `JSON.stringify`.
     * If you just run `JSON.stringify(error)`, you'll get `'{}'`.
     */
    function isFunctionNative(func) {
        return /^function\s.*?\{\s*\[native code]\s*}$/.test(String(func));
    }

    /**
     * Checks whether the browser is based on Chromium without using user-agent.
     *
     * Warning for package users:
     * This function is out of Semantic Versioning, i.e. can change unexpectedly. Usage is at your own risk.
     */
    function isChromium() {
        // Based on research in October 2020. Tested to detect Chromium 42-86.
        const w = window;
        const n = navigator;
        return (countTruthy([
            'webkitPersistentStorage' in n,
            'webkitTemporaryStorage' in n,
            (n.vendor || '').indexOf('Google') === 0,
            'webkitResolveLocalFileSystemURL' in w,
            'BatteryManager' in w,
            'webkitMediaStream' in w,
            'webkitSpeechGrammar' in w,
        ]) >= 5);
    }
    /**
     * Checks whether the browser is based on mobile or desktop Safari without using user-agent.
     * All iOS browsers use WebKit (the Safari engine).
     *
     * Warning for package users:
     * This function is out of Semantic Versioning, i.e. can change unexpectedly. Usage is at your own risk.
     */
    function isWebKit() {
        // Based on research in August 2024
        const w = window;
        const n = navigator;
        return (countTruthy([
            'ApplePayError' in w,
            'CSSPrimitiveValue' in w,
            'Counter' in w,
            n.vendor.indexOf('Apple') === 0,
            'RGBColor' in w,
            'WebKitMediaKeys' in w,
        ]) >= 4);
    }
    /**
     * Checks whether this WebKit browser is Safari.
     * It doesn't check that the browser is based on WebKit, there is a separate function for this.
     *
     * Warning! The function works properly only for Safari version 15.4 and newer.
     */
    function isSafariWebKit() {
        // Checked in Safari, Chrome, Firefox, Yandex, UC Browser, Opera, Edge and DuckDuckGo.
        // iOS Safari and Chrome were checked on iOS 11-18. DuckDuckGo was checked on iOS 17-18 and macOS 14-15.
        // Desktop Safari versions 12-18 were checked.
        // The other browsers were checked on iOS 17 and 18; there was no chance to check them on the other OS versions.
        const w = window;
        return (
        // Filters-out Chrome, Yandex, DuckDuckGo (macOS and iOS), Edge
        isFunctionNative(w.print) &&
            // Doesn't work in Safari < 15.4
            String(w.browser) === '[object WebPageNamespace]');
    }
    /**
     * Checks whether the browser is based on Gecko (Firefox engine) without using user-agent.
     *
     * Warning for package users:
     * This function is out of Semantic Versioning, i.e. can change unexpectedly. Usage is at your own risk.
     */
    function isGecko() {
        var _a, _b;
        const w = window;
        // Based on research in September 2020
        return (countTruthy([
            'buildID' in navigator,
            'MozAppearance' in ((_b = (_a = document.documentElement) === null || _a === void 0 ? void 0 : _a.style) !== null && _b !== void 0 ? _b : {}),
            'onmozfullscreenchange' in w,
            'mozInnerScreenX' in w,
            'CSSMozDocumentRule' in w,
            'CanvasCaptureMediaStream' in w,
        ]) >= 4);
    }
    /**
     * Checks whether the browser is based on WebKit version ≥616 (Safari ≥17) without using user-agent.
     * It doesn't check that the browser is based on WebKit, there is a separate function for this.
     *
     * @see https://developer.apple.com/documentation/safari-release-notes/safari-17-release-notes Safari 17 release notes
     * @see https://tauri.app/v1/references/webview-versions/#webkit-versions-in-safari Safari-WebKit versions map
     */
    function isWebKit616OrNewer() {
        const w = window;
        const n = navigator;
        const { CSS, HTMLButtonElement } = w;
        return (countTruthy([
            !('getStorageUpdates' in n),
            HTMLButtonElement && 'popover' in HTMLButtonElement.prototype,
            'CSSCounterStyleRule' in w,
            CSS.supports('font-size-adjust: ex-height 0.5'),
            CSS.supports('text-transform: full-width'),
        ]) >= 4);
    }
    /**
     * Checks whether the device runs on Android without using user-agent.
     *
     * Warning for package users:
     * This function is out of Semantic Versioning, i.e. can change unexpectedly. Usage is at your own risk.
     */
    function isAndroid() {
        const isItChromium = isChromium();
        const isItGecko = isGecko();
        const w = window;
        const n = navigator;
        // Chrome removes all words "Android" from `navigator` when desktop version is requested
        // Firefox keeps "Android" in `navigator.appVersion` when desktop version is requested
        if (isItChromium) {
            return (countTruthy([
                !('SharedWorker' in w),
                // `typechange` is deprecated, but it's still present on Android (tested on Chrome Mobile 117)
                // Removal proposal https://bugs.chromium.org/p/chromium/issues/detail?id=699892
                // Note: this expression returns true on ChromeOS, so additional detectors are required to avoid false-positives
                // n[c] && 'ontypechange' in n[c],
                !('sinkId' in new Audio()),
            ]) >= 2);
        }
        else if (isItGecko) {
            return countTruthy(['onorientationchange' in w, 'orientation' in w, /android/i.test(n.appVersion)]) >= 2;
        }
        else {
            // Only 2 browser engines are presented on Android.
            // Actually, there is also Android 4.1 browser, but it's not worth detecting it at the moment.
            return false;
        }
    }

    /**
     * A version of the entropy source with stabilization to make it suitable for static fingerprinting.
     * The window resolution is always the document size in private mode of Safari 17,
     * so the window resolution is not used in Safari 17.
     */
    async function getScreenResolution() {
        if (isWebKit() && isWebKit616OrNewer() && isSafariWebKit()) {
            return [];
        }
        return getUnstableScreenResolution();
    }
    /**
     * A version of the entropy source without stabilization.
     *
     * Warning for package users:
     * This function is out of Semantic Versioning, i.e. can change unexpectedly. Usage is at your own risk.
     */
    function getUnstableScreenResolution() {
        const s = screen;
        // Some browsers return screen resolution as strings, e.g. "1200", instead of a number, e.g. 1200.
        // I suspect it's done by certain plugins that randomize browser properties to prevent fingerprinting.
        // Some browsers even return  screen resolution as not numbers.
        const parseDimension = (value) => replaceNaN(toInt(value), null);
        const dimensions = [
            parseDimension(s.width),
            parseDimension(s.height),
        ];
        dimensions.sort().reverse();
        return dimensions;
    }
    includeComponent("screenResolution", getScreenResolution);

    /** WebGl context is not available */
    const STATUS_NO_GL_CONTEXT = -1;
    /** WebGL context `getParameter` method is not a function */
    const STATUS_GET_PARAMETER_NOT_A_FUNCTION = -2;
    const rendererInfoExtensionName = "WEBGL_debug_renderer_info";
    /**
     * Gets the basic and simple WebGL parameters
     */
    async function getWebGlBasics({ cache = {} } = { cache: {} }) {
        var _a, _b, _c, _d, _e, _f;
        const gl = getWebGLContext(cache);
        if (!gl) {
            return STATUS_NO_GL_CONTEXT;
        }
        if (!isValidParameterGetter(gl)) {
            return STATUS_GET_PARAMETER_NOT_A_FUNCTION;
        }
        const debugExtension = shouldAvoidDebugRendererInfo()
            ? null
            : gl.getExtension(rendererInfoExtensionName);
        return {
            version: ((_a = gl.getParameter(gl.VERSION)) === null || _a === void 0 ? void 0 : _a.toString()) || "",
            vendor: ((_b = gl.getParameter(gl.VENDOR)) === null || _b === void 0 ? void 0 : _b.toString()) || "",
            vendorUnmasked: debugExtension
                ? (_c = gl.getParameter(debugExtension.UNMASKED_VENDOR_WEBGL)) === null || _c === void 0 ? void 0 : _c.toString()
                : "",
            renderer: ((_d = gl.getParameter(gl.RENDERER)) === null || _d === void 0 ? void 0 : _d.toString()) || "",
            rendererUnmasked: debugExtension
                ? (_e = gl.getParameter(debugExtension.UNMASKED_RENDERER_WEBGL)) === null || _e === void 0 ? void 0 : _e.toString()
                : "",
            shadingLanguageVersion: ((_f = gl.getParameter(gl.SHADING_LANGUAGE_VERSION)) === null || _f === void 0 ? void 0 : _f.toString()) || "",
        };
    }
    /**
     * This function usually takes the most time to execute in all the sources, therefore we cache its result.
     *
     * Warning for package users:
     * This function is out of Semantic Versioning, i.e. can change unexpectedly. Usage is at your own risk.
     */
    function getWebGLContext(cache) {
        if (cache.webgl) {
            return cache.webgl.context;
        }
        const canvas = document.createElement("canvas");
        let context;
        canvas.addEventListener("webglCreateContextError", () => (context = undefined));
        for (const type of ["webgl", "experimental-webgl"]) {
            try {
                context = canvas.getContext(type);
            }
            catch (_a) {
                // Ok, continue
            }
            if (context) {
                break;
            }
        }
        cache.webgl = { context };
        return context;
    }
    /**
     * Some browsers print a console warning when the WEBGL_debug_renderer_info extension is requested.
     * JS Agent aims to avoid printing messages to console, so we avoid this extension in that browsers.
     */
    function shouldAvoidDebugRendererInfo() {
        return isGecko();
    }
    /**
     * Some unknown browsers have no `getParameter` method
     */
    function isValidParameterGetter(gl) {
        return typeof gl.getParameter === "function";
    }
    includeComponent("webGlBasics", getWebGlBasics);
    // includeComponent("webGlExtensions", getWebGlExtensions as any);

    function getInstalledPlugins() {
        const plugins = [];
        if (navigator.plugins) {
            for (let i = 0; i < navigator.plugins.length; i++) {
                const plugin = navigator.plugins[i];
                plugins.push([plugin.name, plugin.filename, plugin.description].join("|"));
            }
        }
        return new Promise((resolve) => {
            resolve({
                'plugins': plugins
            });
        });
    }
    includeComponent('plugins', getInstalledPlugins);

    async function getSystemDetails() {
        return new Promise((resolve) => {
            // Get detailed browser information
            const browserDetails = detectBrowser$1();
            resolve({
                'platform': window.navigator.platform,
                'cookieEnabled': window.navigator.cookieEnabled,
                'productSub': navigator.productSub,
                'product': navigator.product,
                'browser': {
                    'name': browserDetails.name,
                },
                'applePayVersion': getApplePayVersion(),
            });
        });
    }
    /**
     * Generates a unique browser hash based on various browser characteristics
     * that can be used for fingerprinting
     */
    // function generateBrowserHash(): string {
    //     const characteristics = [
    //         navigator.userAgent,
    //         navigator.language,
    //         navigator.hardwareConcurrency,
    //         navigator.deviceMemory,
    //         navigator.platform,
    //         screen.colorDepth,
    //         navigator.maxTouchPoints,
    //         'chrome' in window ? 'chrome' : 'no-chrome',
    //         'opr' in window ? 'opera' : 'no-opera',
    //         'safari' in window ? 'safari' : 'no-safari',
    //         new Date().getTimezoneOffset(),
    //         screen.width + 'x' + screen.height
    //     ];
    //     // Use simple hashing algorithm
    //     let hash = 0;
    //     const str = characteristics.join('||');
    //     for (let i = 0; i < str.length; i++) {
    //         const char = str.charCodeAt(i);
    //         hash = ((hash << 5) - hash) + char;
    //         hash = hash & hash; // Convert to 32bit integer
    //     }
    //     // Convert to hex string
    //     return (hash >>> 0).toString(16).padStart(8, '0');
    // }
    /**
     * @returns applePayCanMakePayments: boolean, applePayMaxSupportedVersion: number
     */
    function getApplePayVersion() {
        if (window.location.protocol === 'https:' && typeof window.ApplePaySession === 'function') {
            try {
                const versionCheck = window.ApplePaySession.supportsVersion;
                for (let i = 15; i > 0; i--) {
                    if (versionCheck(i)) {
                        return i;
                    }
                }
            }
            catch (error) {
                return 0;
            }
        }
        return 0;
    }
    includeComponent('system', getSystemDetails);

    /**
     * Set of emojis to sample for fingerprinting
     * These emojis are chosen because they have significant rendering differences across platforms
     */
    const TEST_EMOJIS = [
        '😀', // Basic smiling face - varies significantly
        '👨‍👩‍👧‍👦', // Family emoji - complex with multiple characters
        '🇺🇸', // Flag - rendered differently across platforms
        '🍎', // Apple - varies in color and style
        '🐼', // Panda - good variation in details
        '🚀', // Rocket - complex shape with details
        '🏳️‍🌈', // Rainbow flag - combination character
        '👍🏽', // Thumbs up with skin tone - tests skin tone rendering
        '❤️', // Heart with variation selector
        '🤦‍♂️', // Facepalm with gender - complex combination
    ];
    /**
     * Font families to test for emoji rendering variations
     */
    const TEST_FONTS = [
        'Apple Color Emoji',
        'Segoe UI Emoji',
        'Segoe UI Symbol',
        'Noto Color Emoji',
        'Android Emoji',
        'EmojiOne',
        'Twemoji Mozilla',
        'sans-serif' // Fallback
    ];
    /**
     * Renders an emoji to a canvas and returns its pixel data
     * @param emoji The emoji to render
     * @param fontFamily Font family to use
     * @returns Uint8ClampedArray of pixels or null if rendering fails
     */
    function renderEmojiToCanvas(emoji, fontFamily) {
        try {
            // Create canvas and context
            const canvas = document.createElement('canvas');
            const size = 20; // Small size is enough for fingerprinting
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            if (!ctx)
                return null;
            // Clear background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, size, size);
            // Draw emoji
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';
            ctx.fillStyle = 'black';
            ctx.font = `16px "${fontFamily}"`;
            ctx.fillText(emoji, size / 2, size / 2);
            // Get pixel data
            return ctx.getImageData(0, 0, size, size).data;
        }
        catch (e) {
            return null;
        }
    }
    /**
     * Creates a simplified fingerprint from pixel data by sampling
     * @param pixels Canvas pixel data
     * @returns Simplified representation for fingerprinting
     */
    function simplifyPixelData(pixels) {
        // Sample every 8th pixel for efficiency
        const simplified = [];
        for (let i = 0; i < pixels.length; i += 32) {
            // Use only RGB values (skip alpha)
            simplified.push(pixels[i], pixels[i + 1], pixels[i + 2]);
        }
        return simplified;
    }
    /**
     * Generates a fingerprint based on emoji rendering
     * @returns Promise that resolves to emoji fingerprint data
     */
    async function getEmojiFingerprint() {
        return new Promise((resolve) => {
            try {
                const results = {};
                let combinedData = [];
                // Test each emoji with the first available font
                TEST_EMOJIS.forEach((emoji, index) => {
                    // Try each font until one works
                    for (const font of TEST_FONTS) {
                        const pixelData = renderEmojiToCanvas(emoji, font);
                        if (pixelData) {
                            const simplified = simplifyPixelData(pixelData);
                            combinedData = [...combinedData, ...simplified];
                            // Store individual emoji hash for detailed fingerprinting
                            results[`emoji_${index}`] = hash(new Uint8Array(simplified).buffer).slice(0, 16);
                            break; // Use first successful font
                        }
                    }
                });
                // Generate a combined hash for all emoji data
                const combinedHash = hash(new Uint8Array(combinedData).buffer);
                resolve({
                    emojiFingerprintHash: combinedHash,
                    emojiDetails: results,
                    uniqueEmojisRendered: Object.keys(results).length
                });
            }
            catch (e) {
                // Fallback in case of any errors
                resolve({
                    emojiFingerprintHash: 'unsupported',
                    emojiDetails: {},
                    uniqueEmojisRendered: 0
                });
            }
        });
    }
    // Register the component
    includeComponent('emojiFingerprint', getEmojiFingerprint);

    const getMathInfo = async () => {
        return {
            acos: Math.acos(0.5),
            asin: integrate(Math.asin, -1, 1, 97),
            atan: integrate(Math.atan, -1, 1, 97),
            cos: integrate(Math.cos, 0, Math.PI, 97),
            cosh: Math.cosh(9 / 7),
            e: Math.E,
            largeCos: Math.cos(1e20),
            largeSin: Math.sin(1e20),
            largeTan: Math.tan(1e20),
            log: Math.log(1000),
            pi: Math.PI,
            sin: integrate(Math.sin, -Math.PI, Math.PI, 97),
            sinh: integrate(Math.sinh, -9 / 7, 7 / 9, 97),
            sqrt: Math.sqrt(2),
            tan: integrate(Math.tan, 0, 2 * Math.PI, 97),
            tanh: integrate(Math.tanh, -9 / 7, 7 / 9, 97),
        };
    };
    /** This might be a little excessive, but I wasn't sure what number to pick for some of the
     * trigonometric functions. Using an integral here, so a few numbers are calculated. However,
     * I do this mainly for those integrals that sum up to a small value, otherwise there's no point.
    */
    const integrate = (f, a, b, n) => {
        const h = (b - a) / n;
        let sum = 0;
        for (let i = 0; i < n; i++) {
            const x = a + (i + 0.5) * h;
            sum += f(x);
        }
        return sum * h;
    };
    includeComponent('math', getMathInfo);

    function wait(durationMs, resolveWith) {
        return new Promise((resolve) => setTimeout(resolve, durationMs, resolveWith));
    }

    /**
     * Creates a DOM element that matches the given selector.
     * Only single element selector are supported (without operators like space, +, >, etc).
     */
    function selectorToElement(selector) {
        const [tag, attributes] = parseSimpleCssSelector(selector);
        const element = document.createElement(tag !== null && tag !== void 0 ? tag : 'div');
        for (const name of Object.keys(attributes)) {
            const value = attributes[name].join(' ');
            // Changing the `style` attribute can cause a CSP error, therefore we change the `style.cssText` property.
            // https://github.com/fingerprintjs/fingerprintjs/issues/733
            if (name === 'style') {
                addStyleString(element.style, value);
            }
            else {
                element.setAttribute(name, value);
            }
        }
        return element;
    }
    /**
     * Adds CSS styles from a string in such a way that doesn't trigger a CSP warning (unsafe-inline or unsafe-eval)
     */
    function addStyleString(style, source) {
        // We don't use `style.cssText` because browsers must block it when no `unsafe-eval` CSP is presented: https://csplite.com/csp145/#w3c_note
        // Even though the browsers ignore this standard, we don't use `cssText` just in case.
        for (const property of source.split(';')) {
            const match = /^\s*([\w-]+)\s*:\s*(.+?)(\s*!([\w-]+))?\s*$/.exec(property);
            if (match) {
                const [, name, value, , priority] = match;
                style.setProperty(name, value, priority || ''); // The last argument can't be undefined in IE11
            }
        }
    }

    // Floating-point calculations (Math.sin(), Math.log()) produce slightly different results across CPUs due to:
    // Extremely hard to spoof without emulating a different CPU.
    // function getCPUFingerprint(): any {
    //     return {
    //       sin1: Math.sin(1),
    //       log10: Math.log(10),
    //       tanh05: Math.tanh(0.5),
    //     };
    // }
    var SpecialFingerprint;
    (function (SpecialFingerprint) {
        /** The browser doesn't support AudioContext or baseLatency */
        SpecialFingerprint[SpecialFingerprint["NotSupported"] = -1] = "NotSupported";
        /** Entropy source is disabled because of console warnings */
        SpecialFingerprint[SpecialFingerprint["Disabled"] = -2] = "Disabled";
    })(SpecialFingerprint || (SpecialFingerprint = {}));
    function getAudioContextBaseLatency() {
        var _a;
        // The signal emits warning in Chrome and Firefox, therefore it is enabled on Safari where it doesn't produce warning
        // and on Android where it's less visible
        const isAllowedPlatform = isAndroid() || isWebKit();
        if (!isAllowedPlatform) {
            return SpecialFingerprint.Disabled;
        }
        if (!window.AudioContext) {
            return SpecialFingerprint.NotSupported;
        }
        return (_a = new AudioContext().baseLatency) !== null && _a !== void 0 ? _a : SpecialFingerprint.NotSupported;
    }
    /**
     * @see https://developer.mozilla.org/en-US/docs/Web/CSS/@media/color-gamut
     */
    function getColorGamut() {
        // rec2020 includes p3 and p3 includes srgb
        for (const gamut of ["rec2020", "p3", "srgb"]) {
            if (matchMedia(`(color-gamut: ${gamut})`).matches) {
                return gamut;
            }
        }
        return undefined;
    }
    function areColorsForced() {
        if (doesMatch("active")) {
            return true;
        }
        if (doesMatch("none")) {
            return false;
        }
        return undefined;
    }
    function doesMatch(value) {
        return matchMedia(`(forced-colors: ${value})`).matches;
    }
    const maxValueToCheck = 100;
    /**
     * If the display is monochrome (e.g. black&white), the value will be ≥0 and will mean the number of bits per pixel.
     * If the display is not monochrome, the returned value will be 0.
     * If the browser doesn't support this feature, the returned value will be undefined.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/CSS/@media/monochrome
     */
    function getMonochromeDepth() {
        if (!matchMedia("(min-monochrome: 0)").matches) {
            // The media feature isn't supported by the browser
            return undefined;
        }
        // A variation of binary search algorithm can be used here.
        // But since expected values are very small (≤10), there is no sense in adding the complexity.
        for (let i = 0; i <= maxValueToCheck; ++i) {
            if (matchMedia(`(max-monochrome: ${i})`).matches) {
                return i;
            }
        }
        throw new Error("Too high value");
    }
    function getOsCpu() {
        return navigator.oscpu;
    }
    /**
     * Checks for browser-specific (not engine specific) global variables to tell browsers with the same engine apart.
     * Only somewhat popular browsers are considered.
     */
    function getVendorFlavors() {
        const flavors = [];
        for (const key of [
            // Blink and some browsers on iOS
            "chrome",
            // Safari on macOS
            "safari",
            // Chrome on iOS (checked in 85 on 13 and 87 on 14)
            "__crWeb",
            "__gCrWeb",
            // Yandex Browser on iOS, macOS and Android (checked in 21.2 on iOS 14, macOS and Android)
            "yandex",
            // Yandex Browser on iOS (checked in 21.2 on 14)
            "__yb",
            "__ybro",
            // Firefox on iOS (checked in 32 on 14)
            "__firefox__",
            // Edge on iOS (checked in 46 on 14)
            "__edgeTrackingPreventionStatistics",
            "webkit",
            // Opera Touch on iOS (checked in 2.6 on 14)
            "oprt",
            // Samsung Internet on Android (checked in 11.1)
            "samsungAr",
            // UC Browser on Android (checked in 12.10 and 13.0)
            "ucweb",
            "UCShellJava",
            // Puffin on Android (checked in 9.0)
            "puffinDevice",
            // UC on iOS and Opera on Android have no specific global variables
            // Edge for Android isn't checked
        ]) {
            const value = window[key];
            if (value && typeof value === "object") {
                flavors.push(key);
            }
        }
        const sortedVendorFlavors = flavors.sort();
        // If no vendor flavor is detected, default to use the browser name
        if (sortedVendorFlavors.length > 0) {
            return sortedVendorFlavors;
        }
        else {
            const { name: browsername } = detectBrowser$1();
            return [browsername];
        }
    }
    /**
     * Only single element selector are supported (no operators like space, +, >, etc).
     * `embed` and `position: fixed;` will be considered as blocked anyway because it always has no offsetParent.
     * Avoid `iframe` and anything with `[src=]` because they produce excess HTTP requests.
     *
     * The "inappropriate" selectors are obfuscated. See https://github.com/fingerprintjs/fingerprintjs/issues/734.
     * A function is used instead of a plain object to help tree-shaking.
     *
     * The function code is generated automatically. See docs/content_blockers.md to learn how to make the list.
     */
    function getFilters() {
        const fromB64 = atob; // Just for better minification
        return {
            abpIndo: [
                "#Iklan-Melayang",
                "#Kolom-Iklan-728",
                "#SidebarIklan-wrapper",
                '[title="ALIENBOLA" i]',
                fromB64("I0JveC1CYW5uZXItYWRz"),
            ],
            abpvn: [
                ".quangcao",
                "#mobileCatfish",
                fromB64("LmNsb3NlLWFkcw=="),
                '[id^="bn_bottom_fixed_"]',
                "#pmadv",
            ],
            adBlockFinland: [
                ".mainostila",
                fromB64("LnNwb25zb3JpdA=="),
                ".ylamainos",
                fromB64("YVtocmVmKj0iL2NsaWNrdGhyZ2guYXNwPyJd"),
                fromB64("YVtocmVmXj0iaHR0cHM6Ly9hcHAucmVhZHBlYWsuY29tL2FkcyJd"),
            ],
            adBlockPersian: [
                "#navbar_notice_50",
                ".kadr",
                'TABLE[width="140px"]',
                "#divAgahi",
                fromB64("YVtocmVmXj0iaHR0cDovL2cxLnYuZndtcm0ubmV0L2FkLyJd"),
            ],
            adBlockWarningRemoval: [
                "#adblock-honeypot",
                ".adblocker-root",
                ".wp_adblock_detect",
                fromB64("LmhlYWRlci1ibG9ja2VkLWFk"),
                fromB64("I2FkX2Jsb2NrZXI="),
            ],
            adGuardAnnoyances: [
                ".hs-sosyal",
                "#cookieconsentdiv",
                'div[class^="app_gdpr"]',
                ".as-oil",
                '[data-cypress="soft-push-notification-modal"]',
            ],
            adGuardBase: [
                ".BetterJsPopOverlay",
                fromB64("I2FkXzMwMFgyNTA="),
                fromB64("I2Jhbm5lcmZsb2F0MjI="),
                fromB64("I2NhbXBhaWduLWJhbm5lcg=="),
                fromB64("I0FkLUNvbnRlbnQ="),
            ],
            adGuardChinese: [
                fromB64("LlppX2FkX2FfSA=="),
                fromB64("YVtocmVmKj0iLmh0aGJldDM0LmNvbSJd"),
                "#widget-quan",
                fromB64("YVtocmVmKj0iLzg0OTkyMDIwLnh5eiJd"),
                fromB64("YVtocmVmKj0iLjE5NTZobC5jb20vIl0="),
            ],
            adGuardFrench: [
                "#pavePub",
                fromB64("LmFkLWRlc2t0b3AtcmVjdGFuZ2xl"),
                ".mobile_adhesion",
                ".widgetadv",
                fromB64("LmFkc19iYW4="),
            ],
            adGuardGerman: ['aside[data-portal-id="leaderboard"]'],
            adGuardJapanese: [
                "#kauli_yad_1",
                fromB64("YVtocmVmXj0iaHR0cDovL2FkMi50cmFmZmljZ2F0ZS5uZXQvIl0="),
                fromB64("Ll9wb3BJbl9pbmZpbml0ZV9hZA=="),
                fromB64("LmFkZ29vZ2xl"),
                fromB64("Ll9faXNib29zdFJldHVybkFk"),
            ],
            adGuardMobile: [
                fromB64("YW1wLWF1dG8tYWRz"),
                fromB64("LmFtcF9hZA=="),
                'amp-embed[type="24smi"]',
                "#mgid_iframe1",
                fromB64("I2FkX2ludmlld19hcmVh"),
            ],
            adGuardRussian: [
                fromB64("YVtocmVmXj0iaHR0cHM6Ly9hZC5sZXRtZWFkcy5jb20vIl0="),
                fromB64("LnJlY2xhbWE="),
                'div[id^="smi2adblock"]',
                fromB64("ZGl2W2lkXj0iQWRGb3hfYmFubmVyXyJd"),
                "#psyduckpockeball",
            ],
            adGuardSocial: [
                fromB64("YVtocmVmXj0iLy93d3cuc3R1bWJsZXVwb24uY29tL3N1Ym1pdD91cmw9Il0="),
                fromB64("YVtocmVmXj0iLy90ZWxlZ3JhbS5tZS9zaGFyZS91cmw/Il0="),
                ".etsy-tweet",
                "#inlineShare",
                ".popup-social",
            ],
            adGuardSpanishPortuguese: [
                "#barraPublicidade",
                "#Publicidade",
                "#publiEspecial",
                "#queTooltip",
                ".cnt-publi",
            ],
            adGuardTrackingProtection: [
                "#qoo-counter",
                fromB64("YVtocmVmXj0iaHR0cDovL2NsaWNrLmhvdGxvZy5ydS8iXQ=="),
                fromB64("YVtocmVmXj0iaHR0cDovL2hpdGNvdW50ZXIucnUvdG9wL3N0YXQucGhwIl0="),
                fromB64("YVtocmVmXj0iaHR0cDovL3RvcC5tYWlsLnJ1L2p1bXAiXQ=="),
                "#top100counter",
            ],
            adGuardTurkish: [
                "#backkapat",
                fromB64("I3Jla2xhbWk="),
                fromB64("YVtocmVmXj0iaHR0cDovL2Fkc2Vydi5vbnRlay5jb20udHIvIl0="),
                fromB64("YVtocmVmXj0iaHR0cDovL2l6bGVuemkuY29tL2NhbXBhaWduLyJd"),
                fromB64("YVtocmVmXj0iaHR0cDovL3d3dy5pbnN0YWxsYWRzLm5ldC8iXQ=="),
            ],
            bulgarian: [
                fromB64("dGQjZnJlZW5ldF90YWJsZV9hZHM="),
                "#ea_intext_div",
                ".lapni-pop-over",
                "#xenium_hot_offers",
            ],
            easyList: [
                ".yb-floorad",
                fromB64("LndpZGdldF9wb19hZHNfd2lkZ2V0"),
                fromB64("LnRyYWZmaWNqdW5reS1hZA=="),
                ".textad_headline",
                fromB64("LnNwb25zb3JlZC10ZXh0LWxpbmtz"),
            ],
            easyListChina: [
                fromB64("LmFwcGd1aWRlLXdyYXBbb25jbGljayo9ImJjZWJvcy5jb20iXQ=="),
                fromB64("LmZyb250cGFnZUFkdk0="),
                "#taotaole",
                "#aafoot.top_box",
                ".cfa_popup",
            ],
            easyListCookie: [
                ".ezmob-footer",
                ".cc-CookieWarning",
                "[data-cookie-number]",
                fromB64("LmF3LWNvb2tpZS1iYW5uZXI="),
                ".sygnal24-gdpr-modal-wrap",
            ],
            easyListCzechSlovak: [
                "#onlajny-stickers",
                fromB64("I3Jla2xhbW5pLWJveA=="),
                fromB64("LnJla2xhbWEtbWVnYWJvYXJk"),
                ".sklik",
                fromB64("W2lkXj0ic2tsaWtSZWtsYW1hIl0="),
            ],
            easyListDutch: [
                fromB64("I2FkdmVydGVudGll"),
                fromB64("I3ZpcEFkbWFya3RCYW5uZXJCbG9jaw=="),
                ".adstekst",
                fromB64("YVtocmVmXj0iaHR0cHM6Ly94bHR1YmUubmwvY2xpY2svIl0="),
                "#semilo-lrectangle",
            ],
            easyListGermany: [
                "#SSpotIMPopSlider",
                fromB64("LnNwb25zb3JsaW5rZ3J1ZW4="),
                fromB64("I3dlcmJ1bmdza3k="),
                fromB64("I3Jla2xhbWUtcmVjaHRzLW1pdHRl"),
                fromB64("YVtocmVmXj0iaHR0cHM6Ly9iZDc0Mi5jb20vIl0="),
            ],
            easyListItaly: [
                fromB64("LmJveF9hZHZfYW5udW5jaQ=="),
                ".sb-box-pubbliredazionale",
                fromB64("YVtocmVmXj0iaHR0cDovL2FmZmlsaWF6aW9uaWFkcy5zbmFpLml0LyJd"),
                fromB64("YVtocmVmXj0iaHR0cHM6Ly9hZHNlcnZlci5odG1sLml0LyJd"),
                fromB64("YVtocmVmXj0iaHR0cHM6Ly9hZmZpbGlhemlvbmlhZHMuc25haS5pdC8iXQ=="),
            ],
            easyListLithuania: [
                fromB64("LnJla2xhbW9zX3RhcnBhcw=="),
                fromB64("LnJla2xhbW9zX251b3JvZG9z"),
                fromB64("aW1nW2FsdD0iUmVrbGFtaW5pcyBza3lkZWxpcyJd"),
                fromB64("aW1nW2FsdD0iRGVkaWt1b3RpLmx0IHNlcnZlcmlhaSJd"),
                fromB64("aW1nW2FsdD0iSG9zdGluZ2FzIFNlcnZlcmlhaS5sdCJd"),
            ],
            estonian: [fromB64("QVtocmVmKj0iaHR0cDovL3BheTRyZXN1bHRzMjQuZXUiXQ==")],
            fanboyAnnoyances: [
                "#ac-lre-player",
                ".navigate-to-top",
                "#subscribe_popup",
                ".newsletter_holder",
                "#back-top",
            ],
            fanboyAntiFacebook: [".util-bar-module-firefly-visible"],
            fanboyEnhancedTrackers: [
                ".open.pushModal",
                "#issuem-leaky-paywall-articles-zero-remaining-nag",
                "#sovrn_container",
                'div[class$="-hide"][zoompage-fontsize][style="display: block;"]',
                ".BlockNag__Card",
            ],
            fanboySocial: [
                "#FollowUs",
                "#meteored_share",
                "#social_follow",
                ".article-sharer",
                ".community__social-desc",
            ],
            frellwitSwedish: [
                fromB64("YVtocmVmKj0iY2FzaW5vcHJvLnNlIl1bdGFyZ2V0PSJfYmxhbmsiXQ=="),
                fromB64("YVtocmVmKj0iZG9rdG9yLXNlLm9uZWxpbmsubWUiXQ=="),
                "article.category-samarbete",
                fromB64("ZGl2LmhvbGlkQWRz"),
                "ul.adsmodern",
            ],
            greekAdBlock: [
                fromB64("QVtocmVmKj0iYWRtYW4ub3RlbmV0LmdyL2NsaWNrPyJd"),
                fromB64("QVtocmVmKj0iaHR0cDovL2F4aWFiYW5uZXJzLmV4b2R1cy5nci8iXQ=="),
                fromB64("QVtocmVmKj0iaHR0cDovL2ludGVyYWN0aXZlLmZvcnRobmV0LmdyL2NsaWNrPyJd"),
                "DIV.agores300",
                "TABLE.advright",
            ],
            hungarian: [
                "#cemp_doboz",
                ".optimonk-iframe-container",
                fromB64("LmFkX19tYWlu"),
                fromB64("W2NsYXNzKj0iR29vZ2xlQWRzIl0="),
                "#hirdetesek_box",
            ],
            iDontCareAboutCookies: [
                '.alert-info[data-block-track*="CookieNotice"]',
                ".ModuleTemplateCookieIndicator",
                ".o--cookies--container",
                "#cookies-policy-sticky",
                "#stickyCookieBar",
            ],
            icelandicAbp: [
                fromB64("QVtocmVmXj0iL2ZyYW1ld29yay9yZXNvdXJjZXMvZm9ybXMvYWRzLmFzcHgiXQ=="),
            ],
            latvian: [
                fromB64("YVtocmVmPSJodHRwOi8vd3d3LnNhbGlkemluaS5sdi8iXVtzdHlsZT0iZGlzcGxheTogYmxvY2s7IHdpZHRoOiAxMjBweDsgaGVpZ2h0O" +
                    "iA0MHB4OyBvdmVyZmxvdzogaGlkZGVuOyBwb3NpdGlvbjogcmVsYXRpdmU7Il0="),
                fromB64("YVtocmVmPSJodHRwOi8vd3d3LnNhbGlkemluaS5sdi8iXVtzdHlsZT0iZGlzcGxheTogYmxvY2s7IHdpZHRoOiA4OHB4OyBoZWlnaHQ6I" +
                    "DMxcHg7IG92ZXJmbG93OiBoaWRkZW47IHBvc2l0aW9uOiByZWxhdGl2ZTsiXQ=="),
            ],
            listKr: [
                fromB64("YVtocmVmKj0iLy9hZC5wbGFuYnBsdXMuY28ua3IvIl0="),
                fromB64("I2xpdmVyZUFkV3JhcHBlcg=="),
                fromB64("YVtocmVmKj0iLy9hZHYuaW1hZHJlcC5jby5rci8iXQ=="),
                fromB64("aW5zLmZhc3R2aWV3LWFk"),
                ".revenue_unit_item.dable",
            ],
            listeAr: [
                fromB64("LmdlbWluaUxCMUFk"),
                ".right-and-left-sponsers",
                fromB64("YVtocmVmKj0iLmFmbGFtLmluZm8iXQ=="),
                fromB64("YVtocmVmKj0iYm9vcmFxLm9yZyJd"),
                fromB64("YVtocmVmKj0iZHViaXp6bGUuY29tL2FyLz91dG1fc291cmNlPSJd"),
            ],
            listeFr: [
                fromB64("YVtocmVmXj0iaHR0cDovL3Byb21vLnZhZG9yLmNvbS8iXQ=="),
                fromB64("I2FkY29udGFpbmVyX3JlY2hlcmNoZQ=="),
                fromB64("YVtocmVmKj0id2Vib3JhbWEuZnIvZmNnaS1iaW4vIl0="),
                ".site-pub-interstitiel",
                'div[id^="crt-"][data-criteo-id]',
            ],
            officialPolish: [
                "#ceneo-placeholder-ceneo-12",
                fromB64("W2hyZWZePSJodHRwczovL2FmZi5zZW5kaHViLnBsLyJd"),
                fromB64("YVtocmVmXj0iaHR0cDovL2Fkdm1hbmFnZXIudGVjaGZ1bi5wbC9yZWRpcmVjdC8iXQ=="),
                fromB64("YVtocmVmXj0iaHR0cDovL3d3dy50cml6ZXIucGwvP3V0bV9zb3VyY2UiXQ=="),
                fromB64("ZGl2I3NrYXBpZWNfYWQ="),
            ],
            ro: [
                fromB64("YVtocmVmXj0iLy9hZmZ0cmsuYWx0ZXgucm8vQ291bnRlci9DbGljayJd"),
                fromB64("YVtocmVmXj0iaHR0cHM6Ly9ibGFja2ZyaWRheXNhbGVzLnJvL3Ryay9zaG9wLyJd"),
                fromB64("YVtocmVmXj0iaHR0cHM6Ly9ldmVudC4ycGVyZm9ybWFudC5jb20vZXZlbnRzL2NsaWNrIl0="),
                fromB64("YVtocmVmXj0iaHR0cHM6Ly9sLnByb2ZpdHNoYXJlLnJvLyJd"),
                'a[href^="/url/"]',
            ],
            ruAd: [
                fromB64("YVtocmVmKj0iLy9mZWJyYXJlLnJ1LyJd"),
                fromB64("YVtocmVmKj0iLy91dGltZy5ydS8iXQ=="),
                fromB64("YVtocmVmKj0iOi8vY2hpa2lkaWtpLnJ1Il0="),
                "#pgeldiz",
                ".yandex-rtb-block",
            ],
            thaiAds: [
                "a[href*=macau-uta-popup]",
                fromB64("I2Fkcy1nb29nbGUtbWlkZGxlX3JlY3RhbmdsZS1ncm91cA=="),
                fromB64("LmFkczMwMHM="),
                ".bumq",
                ".img-kosana",
            ],
            webAnnoyancesUltralist: [
                "#mod-social-share-2",
                "#social-tools",
                fromB64("LmN0cGwtZnVsbGJhbm5lcg=="),
                ".zergnet-recommend",
                ".yt.btn-link.btn-md.btn",
            ],
        };
    }
    /**
     * The order of the returned array means nothing (it's always sorted alphabetically).
     *
     * Notice that the source is slightly unstable.
     * Safari provides a 2-taps way to disable all content blockers on a page temporarily.
     * Also content blockers can be disabled permanently for a domain, but it requires 4 taps.
     * So empty array shouldn't be treated as "no blockers", it should be treated as "no signal".
     * If you are a website owner, don't make your visitors want to disable content blockers.
     */
    async function getDomBlockers() {
        if (!isApplicable()) {
            return undefined;
        }
        const filters = getFilters();
        const filterNames = Object.keys(filters);
        const allSelectors = [].concat(...filterNames.map((filterName) => filters[filterName]));
        const blockedSelectors = await getBlockedSelectors(allSelectors);
        const activeBlockers = filterNames.filter((filterName) => {
            const selectors = filters[filterName];
            const blockedCount = countTruthy(selectors.map((selector) => blockedSelectors[selector]));
            return blockedCount > selectors.length * 0.6;
        });
        activeBlockers.sort();
        return activeBlockers;
    }
    function isApplicable() {
        // Safari (desktop and mobile) and all Android browsers keep content blockers in both regular and private mode
        return isWebKit() || isAndroid();
    }
    async function getBlockedSelectors(selectors) {
        var _a;
        const d = document;
        const root = d.createElement("div");
        const elements = new Array(selectors.length);
        const blockedSelectors = {}; // Set() isn't used just in case somebody need older browser support
        forceShow(root);
        // First create all elements that can be blocked. If the DOM steps below are done in a single cycle,
        // browser will alternate tree modification and layout reading, that is very slow.
        for (let i = 0; i < selectors.length; ++i) {
            const element = selectorToElement(selectors[i]);
            if (element.tagName === "DIALOG") {
                element.show();
            }
            const holder = d.createElement("div"); // Protects from unwanted effects of `+` and `~` selectors of filters
            forceShow(holder);
            holder.appendChild(element);
            root.appendChild(holder);
            elements[i] = element;
        }
        // document.body can be null while the page is loading
        while (!d.body) {
            await wait(50);
        }
        d.body.appendChild(root);
        try {
            // Then check which of the elements are blocked
            for (let i = 0; i < selectors.length; ++i) {
                if (!elements[i].offsetParent) {
                    blockedSelectors[selectors[i]] = true;
                }
            }
        }
        finally {
            // Then remove the elements
            (_a = root.parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(root);
        }
        return blockedSelectors;
    }
    function forceShow(element) {
        element.style.setProperty("visibility", "hidden", "important");
        element.style.setProperty("display", "block", "important");
    }
    includeComponent("domBlockers", getDomBlockers);
    includeComponent("vendorFlavour", getVendorFlavors);
    includeComponent("monochrome", getMonochromeDepth);
    includeComponent("forcedColors", areColorsForced);
    includeComponent("colorGamut", getColorGamut);
    includeComponent("osCpu", getOsCpu);
    includeComponent("audioLatency", getAudioContextBaseLatency);

    class RayyanError extends Error {
        constructor(message, options) {
            super(message, options);
            this.name = "RayyanError";
        }
    }

    class FieldMetricsTracker {
        constructor() {
            this.pauseThresholdMilliseconds = 1500;
            this.isInitialized = false;
            this.fields = [];
            this.trackedFieldIds = new Set();
        }
        initializeTracking(fieldIds) {
            fieldIds.forEach((id) => {
                if (!this.trackedFieldIds.has(id)) {
                    this.trackField(id);
                }
            });
            this.isInitialized = true;
        }
        /** Set up tracking for a single field */
        trackField(id) {
            const element = document.getElementById(id);
            if (!element) {
                throw new RayyanError(`Element with ID "${id}" was not found in the DOM. Please ensure the ID is correctly assigned to an input element.`);
            }
            if (!(element instanceof HTMLInputElement) &&
                !(element instanceof HTMLTextAreaElement)) {
                throw new RayyanError(`Element with ID "${id}" must be an HTMLInputElement or HTMLTextAreaElement.`);
            }
            const fieldMetric = {
                field_name: id,
                started_at: 0,
                ended_at: 0,
                interaction_count: 0,
                fill_method: null,
                paste_count: 0,
                corrections_count: 0,
                pauses: 0,
                pauseDurations: [],
                element,
            };
            this.fields.push(fieldMetric);
            this.trackedFieldIds.add(id);
            element.addEventListener("input", this.handleInput.bind(this, fieldMetric));
        }
        /** Handle input events for a specific field */
        handleInput(currentField, event) {
            const now = performance.now();
            const lastInteractionTime = currentField.ended_at || 0;
            const inputEvent = event;
            const fillMethod = this.getFillMethod(currentField, inputEvent);
            const isCorrectionDetected = this.detectCorrection(inputEvent);
            const isPasteDetected = this.detectPaste(fillMethod, inputEvent);
            const isPauseDetected = this.detectPause(now, lastInteractionTime, this.pauseThresholdMilliseconds);
            if (!currentField.started_at)
                currentField.started_at = now;
            currentField.ended_at = now;
            currentField.fill_method = fillMethod;
            currentField.interaction_count += 1;
            if (isCorrectionDetected)
                currentField.corrections_count += 1;
            if (isPasteDetected)
                currentField.paste_count += 1;
            if (isPauseDetected) {
                currentField.pauses += 1;
                const pauseDuration = now - lastInteractionTime;
                currentField.pauseDurations.push(pauseDuration);
            }
        }
        getFillMethod(currentField, inputEvent) {
            const inputType = inputEvent.inputType;
            if (!inputType)
                return "paste";
            let fillMethod = inputType === "insertText"
                ? "typed"
                : inputType === "insertFromPaste"
                    ? "paste"
                    : "mixed";
            if (currentField.fill_method && currentField.fill_method !== fillMethod) {
                fillMethod = "mixed";
            }
            return fillMethod;
        }
        detectCorrection(inputEvent) {
            return inputEvent.inputType === "deleteContentBackward";
        }
        detectPaste(fillMethod, inputEvent) {
            return fillMethod === "paste" || inputEvent.inputType === "insertFromPaste";
        }
        detectPause(now, lastInteractionTime, pauseThresholdMilliseconds) {
            const timeSinceLastKeystroke = now - lastInteractionTime;
            return lastInteractionTime !== 0 && timeSinceLastKeystroke > pauseThresholdMilliseconds;
        }
        removeTracking(id) {
            const index = this.fields.findIndex((field) => field.field_name === id);
            if (index !== -1 && id) {
                const field = this.fields[index];
                field.element.removeEventListener("input", this.handleInput.bind(this, field));
                this.fields.splice(index, 1);
                this.trackedFieldIds.delete(id);
            }
            else {
                // Remove all tracking
                this.fields.forEach((field) => {
                    field.element.removeEventListener("input", this.handleInput.bind(this, field));
                });
                this.fields = [];
                this.trackedFieldIds.clear();
            }
        }
        get metricsData() {
            if (!this.isInitialized) {
                throw new RayyanError("Rayyan.trackInputs must be initialized before data can be fetched.");
            }
            return this.fields.map(({ element, ...field }) => field);
        }
    }
    const tracker = new FieldMetricsTracker();
    const trackInputs = (ids) => {
        tracker.initializeTracking(ids);
    };
    const getTrackedFieldsData = () => {
        return tracker.metricsData;
    };

    const PostRequest = async (url, data) => {
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Authorization: "Bearer sk_live_SOnvoPnpA8NcQsJjvplgYjcZoGrBtLzurDNNpEKsEWvFMio3qXWS2hJ-TOKc5uBV",
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`);
            }
            const responseData = await response.json();
            return responseData;
        }
        catch (error) {
            if (error instanceof Error) {
                throw error.message;
            }
            throw error;
        }
    };

    const generateRequestId = () => {
        const timestamp = Date.now();
        const base34Alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ".slice(0, 34);
        const base34 = tripleRecursivebase34Alphabet(timestamp, base34Alphabet);
        const requestId = `${timestamp}.${base34}`;
        return requestId;
    };
    // Convert number to base-34 (8-character output)
    function toBase34(n, base34Alphabet) {
        if (n === 0)
            return "00000000";
        let result = "";
        while (n > 0) {
            let remainder = n % 34;
            result = base34Alphabet[remainder] + result;
            n = Math.floor(n / 34);
        }
        // Pad to 8 characters
        while (result.length < 8) {
            result = "0" + result;
        }
        return result.slice(-8);
    }
    // Convert base-34 string to number
    function fromBase34(str, base34Alphabet) {
        let n = 0;
        for (let char of str) {
            let value = base34Alphabet.indexOf(char.toUpperCase());
            if (value === -1)
                throw new Error("Invalid base-34 character");
            n = n * 34 + value;
        }
        return n;
    }
    function getRandomSalt(max) {
        const maxBase34 = max; // 34^8
        return Math.floor(Math.random() * maxBase34);
    }
    // Recursive function to encode timestamp three times with hashing
    const tripleRecursivebase34Alphabet = (timestamp, base34Alphabet, count = 1) => {
        if (count > 3) {
            return toBase34(timestamp, base34Alphabet);
        }
        const MAX_BASE_34 = 1336336003215616;
        const saltedTimestamp = (timestamp + getRandomSalt(MAX_BASE_34)) % MAX_BASE_34;
        const encoded = toBase34(saltedTimestamp, base34Alphabet);
        const decoded = fromBase34(encoded, base34Alphabet);
        // Recursive call with incremented count
        return tripleRecursivebase34Alphabet(decoded, base34Alphabet, count + 1);
    };

    const EVENT_TYPES = [
        "login",
        "registeration",
        "credentials_update",
        "alerts_snooze",
    ];

    const detectIncognito = detectIncognito$1;
    const detectTorBrowser = detectTorBrowser$1;
    const botDetection = botDetection$1;
    const getFingerprint = getFingerprint$1;
    const detectBrowser = detectBrowser$1;
    const detectDeviceDetails = getDeviceDetails;
    class RayyanJsClient {
        constructor() {
            this.initializationState = "pending";
            this.getTrackedData = () => {
                if (this.initializationState !== "success") {
                    throw new RayyanError("Initialization not successful. Cannot get tracked data.");
                }
                if (!this.trackDetails) {
                    throw new RayyanError("Tracking not initiated. Call trackBehaviour before getting tracked data.");
                }
                const fields = getTrackedFieldsData();
                return {
                    event_type: this.trackDetails.event_type,
                    request_id: this.trackDetails.request_id,
                    fields,
                };
            };
            this.submitData = async () => {
                const fields = this.getTrackedData();
                try {
                    const response = await PostRequest("https://app.getrayyan.com/api/v1/events", fields);
                    // Remove tracking here TBD
                    return response;
                }
                catch (error) {
                    throw new RayyanError(`Data submission failed: ${String(error)}`);
                }
            };
            this.request_id = generateRequestId();
        }
        async initialize() {
            this.initializationState = "pending";
            try {
                const [fingerprintResult, torDetectionResult, botDetectionResult, incognitoDetectionResult, osDetectionResult, deviceDetails, browserDetails,] = await Promise.all([
                    getFingerprint$1(),
                    detectTorBrowser$1(),
                    botDetection$1(),
                    detectIncognito$1(),
                    getOs(),
                    getDeviceDetails(),
                    getBrowserDetails(),
                ]);
                const initialData = {
                    request_id: this.request_id,
                    device: {
                        device_id: fingerprintResult.hash,
                        type: deviceDetails.deviceType,
                        os: deviceDetails.deviceOs,
                        os_version: (osDetectionResult === null || osDetectionResult === void 0 ? void 0 : osDetectionResult.version) || null,
                        raw_device_data: fingerprintResult.data,
                        browserDetails: browserDetails,
                        bot: botDetectionResult,
                        tampering: deviceDetails.tampering,
                        incognito: incognitoDetectionResult,
                        tor: torDetectionResult,
                    },
                };
                const response = await PostRequest("https://app.getrayyan.com/api/v1/devices", initialData);
                this.initializationState = "success";
                this.initializationResponse = response;
                return response;
            }
            catch (error) {
                this.initializationState = "error";
                if (error instanceof Error) {
                    throw new RayyanError(`Initialization failed: ${error.message}`, {
                        cause: error,
                    });
                }
                throw new RayyanError(`Initialization failed with unknown error: ${String(error)}`);
            }
        }
        getInitializationResponse() {
            if (this.initializationState !== "success") {
                console.warn("Attempted to get initialization response before successful initialization.");
            }
            return this.initializationResponse;
        }
        trackBehaviour({ eventType, trackFields, requestId, }) {
            if (this.initializationState !== "success") {
                throw new RayyanError("Initialization response not available. Cannot track events.");
            }
            if (!EVENT_TYPES.includes(eventType)) {
                throw new RayyanError(`Invalid event type: ${eventType}. Allowed types are: ${EVENT_TYPES.join(", ")}`);
            }
            trackInputs(trackFields);
            this.trackDetails = { event_type: eventType, request_id: requestId };
        }
    }

    exports.RayyanJsClient = RayyanJsClient;
    exports.botDetection = botDetection;
    exports.detectBrowser = detectBrowser;
    exports.detectDeviceDetails = detectDeviceDetails;
    exports.detectIncognito = detectIncognito;
    exports.detectTorBrowser = detectTorBrowser;
    exports.getFingerprint = getFingerprint;

}));
//# sourceMappingURL=index.umd.js.map