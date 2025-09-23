"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.n8nDefaultFailedAttemptHandler = void 0;
const STATUS_NO_RETRY = [
    400,
    401,
    402,
    403,
    404,
    405,
    406,
    407,
    409,
];
const n8nDefaultFailedAttemptHandler = (error) => {
    var _a, _b, _c, _d, _e, _f;
    if (((_b = (_a = error === null || error === void 0 ? void 0 : error.message) === null || _a === void 0 ? void 0 : _a.startsWith) === null || _b === void 0 ? void 0 : _b.call(_a, "Cancel")) ||
        ((_d = (_c = error === null || error === void 0 ? void 0 : error.message) === null || _c === void 0 ? void 0 : _c.startsWith) === null || _d === void 0 ? void 0 : _d.call(_c, "AbortError")) ||
        (error === null || error === void 0 ? void 0 : error.name) === "AbortError") {
        throw error;
    }
    if ((error === null || error === void 0 ? void 0 : error.code) === "ECONNABORTED") {
        throw error;
    }
    const status = (_f = (_e = error === null || error === void 0 ? void 0 : error.response) === null || _e === void 0 ? void 0 : _e.status) !== null && _f !== void 0 ? _f : error === null || error === void 0 ? void 0 : error.status;
    if (status && STATUS_NO_RETRY.includes(+status)) {
        throw error;
    }
};
exports.n8nDefaultFailedAttemptHandler = n8nDefaultFailedAttemptHandler;
//# sourceMappingURL=n8nDefaultFailedAttemptHandler.js.map