import * as fs from 'fs';
import * as crypto from 'crypto';
import { createHash } from 'crypto';

const KEY_FILE = "secret.key";
const MasterPassword = "helloWorld";
const PASS_FILE = "passwords.json";
function getKey(password: string): Buffer {
    // Generates a 32-byte (256-bit) key using SHA-256.
    return crypto.createHash('sha256').update(password).digest();
}

function encryptFile(filePath: string, password: string): void {
    const key = getKey(password);

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

    const data = fs.readFileSync(filePath);

    // REMOVED manual padding logic here
    const encryptedData = Buffer.concat([cipher.update(data), cipher.final()]);

    fs.writeFileSync(filePath + ".enc", Buffer.concat([iv, encryptedData]));
    console.log(`File encrypted: ${filePath}.enc`);
}


function decryptFile(encryptedFilePath: string, password: string): void {
    const key = getKey(password); // Ensure this returns a 32-byte Buffer

    const fileData = fs.readFileSync(encryptedFilePath);
    const iv = fileData.subarray(0, 16); 
    const encryptedData = fileData.subarray(16);

    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

    // .final() already removes PKCS7 padding automatically
    const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);

    const outputPath = encryptedFilePath.replace(".enc", "");
    fs.writeFileSync(outputPath, decrypted);
    console.log(`File decrypted: ${outputPath}`);
}

//encryptFile("secret.key", MasterPassword);
decryptFile("secret.key.enc", MasterPassword);

function loadOrGenerateKey(): Buffer {
    if (fs.existsSync(KEY_FILE)) {
        // Read as base64 string and convert to 32-byte Buffer
        const data = fs.readFileSync(KEY_FILE, 'utf8').trim();
        return Buffer.from(data, 'base64');
    } else {
        const key = crypto.randomBytes(32);
        fs.writeFileSync(KEY_FILE, key.toString('base64'));
        return key;
    }
}

class Fernet {
    private key: Buffer;
    // Typing the algorithm strictly helps TS narrow down the return type
    private algorithm: crypto.CipherGCMTypes = 'aes-256-gcm';

    constructor(key: Buffer) {
        this.key = key;
    }

    encrypt(plainText: string): string {
        const iv = crypto.randomBytes(12);
        // Cast to 'crypto.CipherGCM' to unlock .getAuthTag()
        const cipher = crypto.createCipheriv(this.algorithm, this.key, iv) as crypto.CipherGCM;
        
        const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
        const tag = cipher.getAuthTag(); 
        
        return Buffer.concat([iv, tag, encrypted]).toString('base64');
    }

    decrypt(cypherText: string): string {
        const data = Buffer.from(cypherText, 'base64');
        const iv = data.subarray(0, 12);
        const tag = data.subarray(12, 28);
        const encrypted = data.subarray(28);

        // Cast to 'crypto.DecipherGCM' to unlock .setAuthTag()
        const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv) as crypto.DecipherGCM;
        decipher.setAuthTag(tag); 
        
        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
        return decrypted.toString('utf8');
    }
}

const key = loadOrGenerateKey();
console.log("Using Key (base64):", key.toString('base64'));

const cipher_suite = new Fernet(key);

function getID(app: string): string {
    if (!fs.existsSync(PASS_FILE)) throw new Error("No passwords saved yet");
    const J = JSON.parse(fs.readFileSync(PASS_FILE, 'utf8'));

    for (const [key, value] of Object.entries(J)) {
        if ((value as any).app === app) return key;
    }
    throw new Error(`${app} not found in list`);
}

function addPass(website: string, password: string): void {
    let J: Record<string, any> = {};
    if (fs.existsSync(PASS_FILE)) {
        J = JSON.parse(fs.readFileSync(PASS_FILE, 'utf8'));
    }
    
    const keys = Object.keys(J).map(Number);
    const nextId = keys.length > 0 ? Math.max(...keys) + 1 : 0;
    
    J[nextId.toString()] = { 
        app: website, 
        password: cipher_suite.encrypt(password) 
    };
    fs.writeFileSync(PASS_FILE, JSON.stringify(J, null, 2));
}

function getPass(id: string): string {
    const J = JSON.parse(fs.readFileSync(PASS_FILE, 'utf8'));
    return cipher_suite.decrypt(J[id].password);
}

// Usage
try {
    addPass("git", "1234");
    const id = getID("git");
    console.log(`Password for git: ${getPass(id)}`);
} catch (e: unknown) {
    if (e instanceof Error) {
        console.error(e.message);
    }
}
