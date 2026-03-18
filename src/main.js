"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var crypto = require("crypto");
var KEY_FILE = "secret.key";
var MasterPassword = "helloWorld";
var PASS_FILE = "passwords.json";
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
function decryptFile(encryptedFilePath, password) {
    var key = getKey(password); // Ensure this returns a 32-byte Buffer
    var fileData = fs.readFileSync(encryptedFilePath);
    var iv = fileData.subarray(0, 16);
    var encryptedData = fileData.subarray(16);
    var decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    // .final() already removes PKCS7 padding automatically
    var decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
    var outputPath = encryptedFilePath.replace(".enc", "");
    fs.writeFileSync(outputPath, decrypted);
    console.log("File decrypted: ".concat(outputPath));
}
//encryptFile("secret.key", MasterPassword);
decryptFile("secret.key.enc", MasterPassword);
function loadOrGenerateKey() {
    if (fs.existsSync(KEY_FILE)) {
        // Read as base64 string and convert to 32-byte Buffer
        var data = fs.readFileSync(KEY_FILE, 'utf8').trim();
        return Buffer.from(data, 'base64');
    }
    else {
        var key_1 = crypto.randomBytes(32);
        fs.writeFileSync(KEY_FILE, key_1.toString('base64'));
        return key_1;
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
var key = loadOrGenerateKey();
console.log("Using Key (base64):", key.toString('base64'));
var cipher_suite = new Fernet(key);
function getID(app) {
    if (!fs.existsSync(PASS_FILE))
        throw new Error("No passwords saved yet");
    var J = JSON.parse(fs.readFileSync(PASS_FILE, 'utf8'));
    for (var _i = 0, _a = Object.entries(J); _i < _a.length; _i++) {
        var _b = _a[_i], key_2 = _b[0], value = _b[1];
        if (value.app === app)
            return key_2;
    }
    throw new Error("".concat(app, " not found in list"));
}
function addPass(website, password) {
    var J = {};
    if (fs.existsSync(PASS_FILE)) {
        J = JSON.parse(fs.readFileSync(PASS_FILE, 'utf8'));
    }
    var keys = Object.keys(J).map(Number);
    var nextId = keys.length > 0 ? Math.max.apply(Math, keys) + 1 : 0;
    J[nextId.toString()] = {
        app: website,
        password: cipher_suite.encrypt(password)
    };
    fs.writeFileSync(PASS_FILE, JSON.stringify(J, null, 2));
}
function getPass(id) {
    var J = JSON.parse(fs.readFileSync(PASS_FILE, 'utf8'));
    return cipher_suite.decrypt(J[id].password);
}
// Usage
try {
    addPass("git", "1234");
    var id = getID("git");
    console.log("Password for git: ".concat(getPass(id)));
}
catch (e) {
    if (e instanceof Error) {
        console.error(e.message);
    }
}
