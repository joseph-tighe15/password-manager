"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Fernet = exports.PASS_FILE = exports.KEY_FILE = void 0;
exports.getKey = getKey;
exports.encryptFile = encryptFile;
exports.readEncryptedFile = readEncryptedFile;
exports.decryptFile = decryptFile;
exports.loadOrGenerateKey = loadOrGenerateKey;
exports.getID = getID;
exports.addPass = addPass;
exports.getPass = getPass;
var crypto = require("crypto");
var fs = require("fs");
exports.KEY_FILE = "src/config/secret.key.enc";
exports.PASS_FILE = "src/config/passwords.json";
function getKey(password) {
    // Generates a 32-byte (256-bit) key using SHA-256.
    return crypto.createHash('sha256').update(password).digest();
}
function encryptFile(filePath, password) {
    var key = getKey(password);
    var iv = crypto.randomBytes(16);
    var cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    var data = fs.readFileSync(filePath);
    // REMOVED manual padding logic here
    var encryptedData = Buffer.concat([cipher.update(data), cipher.final()]);
    fs.writeFileSync(filePath + ".enc", Buffer.concat([iv, encryptedData]));
    console.log("File encrypted: ".concat(filePath, ".enc"));
}
function readEncryptedFile(encryptedFilePath, password) {
    var key = getKey(password); // Ensure this returns a 32-byte Buffer
    var fileData = fs.readFileSync(encryptedFilePath);
    console.log(encryptedFilePath);
    var iv = fileData.subarray(0, 16);
    var encryptedData = fileData.subarray(16);
    var decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    // .final() already removes PKCS7 padding automatically
    var decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
    var decoder = new TextDecoder('utf-8'); // Specify the encoding
    var out = decoder.decode(decrypted);
    return out;
}
function decryptFile(encryptedFilePath, password) {
    var key = getKey(password); // Ensure this returns a 32-byte Buffer
    var fileData = fs.readFileSync(encryptedFilePath);
    console.log(encryptedFilePath);
    var iv = fileData.subarray(0, 16);
    var encryptedData = fileData.subarray(16);
    var decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    // .final() already removes PKCS7 padding automatically
    var decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
    var outputPath = encryptedFilePath.replace(".enc", "");
    fs.writeFileSync(outputPath, decrypted);
    console.log("File decrypted: ".concat(outputPath));
}
function loadOrGenerateKey(MasterPassword) {
    if (fs.existsSync(exports.KEY_FILE)) {
        // Read as base64 string and convert to 32-byte Buffer
        var data = readEncryptedFile(exports.KEY_FILE, MasterPassword);
        return Buffer.from(data, 'base64');
    }
    else {
        var key = crypto.randomBytes(32);
        fs.writeFileSync(exports.KEY_FILE.replace(".enc", ""), key.toString('base64'));
        return key;
    }
}
var Fernet = /** @class */ (function () {
    function Fernet(key) {
        // Typing the algorithm strictly helps TS narrow down the return type
        this.algorithm = 'aes-256-gcm';
        this.key = key;
    }
    Fernet.prototype.encrypt = function (plainText) {
        var iv = crypto.randomBytes(12);
        // Cast to 'crypto.CipherGCM' to unlock .getAuthTag()
        var cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
        var encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
        var tag = cipher.getAuthTag();
        return Buffer.concat([iv, tag, encrypted]).toString('base64');
    };
    Fernet.prototype.decrypt = function (cypherText) {
        var data = Buffer.from(cypherText, 'base64');
        var iv = data.subarray(0, 12);
        var tag = data.subarray(12, 28);
        var encrypted = data.subarray(28);
        // Cast to 'crypto.DecipherGCM' to unlock .setAuthTag()
        var decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
        decipher.setAuthTag(tag);
        var decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
        return decrypted.toString('utf8');
    };
    return Fernet;
}());
exports.Fernet = Fernet;
function getID(app) {
    if (!fs.existsSync(exports.PASS_FILE))
        throw new Error("No passwords saved yet");
    var J = JSON.parse(fs.readFileSync(exports.PASS_FILE, 'utf8'));
    for (var _i = 0, _a = Object.entries(J); _i < _a.length; _i++) {
        var _b = _a[_i], key = _b[0], value = _b[1];
        if (value.app === app)
            return key;
    }
    throw new Error("".concat(app, " not found in list"));
}
function addPass(website, password, cipher) {
    var J = {};
    if (fs.existsSync(exports.PASS_FILE)) {
        J = JSON.parse(fs.readFileSync(exports.PASS_FILE, 'utf8'));
    }
    var keys = Object.keys(J).map(Number);
    var nextId = keys.length > 0 ? Math.max.apply(Math, keys) + 1 : 0;
    J[nextId.toString()] = {
        app: website,
        password: cipher.encrypt(password)
    };
    fs.writeFileSync(exports.PASS_FILE, JSON.stringify(J, null, 2));
}
function getPass(id, cipher) {
    var J = JSON.parse(fs.readFileSync(exports.PASS_FILE, 'utf8'));
    return cipher.decrypt(J[id].password);
}
