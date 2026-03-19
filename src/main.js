"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
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
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var readline = require("node:readline/promises");
var node_process_1 = require("node:process");
var cryption = require("./service/encrypion.js");
var rl = readline.createInterface({ input: node_process_1.stdin, output: node_process_1.stdout });
function deleteFile(filePath) {
    return __awaiter(this, void 0, void 0, function () {
        var err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, fs.unlink(filePath, function () {
                            return;
                        })];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    err_1 = _a.sent();
                    if (err_1 instanceof Error) {
                        console.log('File does not exist, continuing...');
                    }
                    else {
                        console.error('Error deleting file:', err_1);
                        throw err_1; // Re-throw if it's an unexpected error
                    }
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function makeIfNotExists(MasterPassword) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!!fs.existsSync(cryption.KEY_FILE)) return [3 /*break*/, 2];
                    cryption.loadOrGenerateKey(MasterPassword);
                    cryption.encryptFile(cryption.KEY_FILE.replace(".enc", ""), MasterPassword);
                    return [4 /*yield*/, deleteFile(cryption.KEY_FILE.replace(".enc", ""))];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2: return [2 /*return*/];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var action, a, _a, app, MasterPassword, key, cipher_suite, id, app, password, MasterPassword, key, cipher_suite, e_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 11, , 12]);
                    return [4 /*yield*/, rl.question('What action do want to do (r)ead password, (m)ake password, (l)ist apps')];
                case 1:
                    action = _b.sent();
                    a = action.toUpperCase()[0];
                    _a = a;
                    switch (_a) {
                        case "R": return [3 /*break*/, 2];
                        case "M": return [3 /*break*/, 5];
                        case "L": return [3 /*break*/, 9];
                    }
                    return [3 /*break*/, 10];
                case 2: return [4 /*yield*/, rl.question('What is the target app? ')];
                case 3:
                    app = _b.sent();
                    return [4 /*yield*/, rl.question('What is the master password? ')];
                case 4:
                    MasterPassword = _b.sent();
                    rl.close();
                    key = cryption.loadOrGenerateKey(MasterPassword);
                    cipher_suite = new cryption.Fernet(key);
                    id = cryption.getID(app);
                    console.log("Password for git: ".concat(cryption.getPass(id, cipher_suite)));
                    return [3 /*break*/, 10];
                case 5: return [4 /*yield*/, rl.question('What is the target app? ')];
                case 6:
                    app = _b.sent();
                    return [4 /*yield*/, rl.question('What is the target password? ')];
                case 7:
                    password = _b.sent();
                    return [4 /*yield*/, rl.question('What is the master password? ')];
                case 8:
                    MasterPassword = _b.sent();
                    rl.close();
                    makeIfNotExists(MasterPassword);
                    key = cryption.loadOrGenerateKey(MasterPassword);
                    cipher_suite = new cryption.Fernet(key);
                    cryption.addPass(app, password, cipher_suite);
                    return [3 /*break*/, 10];
                case 9:
                    rl.close();
                    return [3 /*break*/, 10];
                case 10: return [3 /*break*/, 12];
                case 11:
                    e_1 = _b.sent();
                    if (e_1 instanceof Error) {
                        console.error(e_1.message);
                    }
                    rl.close();
                    return [3 /*break*/, 12];
                case 12: return [2 /*return*/];
            }
        });
    });
}
main();
