/// <reference types="npm:@types/node" />
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import { Buffer } from 'node:buffer';

export const KEY_FILE = "src/config/secret.key.enc";
export const PASS_FILE = "src/config/passwords.json";

export function getKey(password: string): Buffer {
    // Generates a 32-byte (256-bit) key using SHA-256.
    return crypto.createHash('sha256').update(password).digest();
}
export function encryptFile(filePath: string, password: string): void {
    const key = getKey(password);

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

    const data = fs.readFileSync(filePath);

    // REMOVED manual padding logic here
    const encryptedData = Buffer.concat([cipher.update(data), cipher.final()]);

    fs.writeFileSync(filePath + ".enc", Buffer.concat([iv, encryptedData]));
    console.log(`File encrypted: ${filePath}.enc`);
}
export function readEncryptedFile(encryptedFilePath: string, password: string) : string {
    const key = getKey(password); // Ensure this returns a 32-byte Buffer

    const fileData = fs.readFileSync(encryptedFilePath);
    console.log(encryptedFilePath)
    const iv = fileData.subarray(0, 16); 
    const encryptedData = fileData.subarray(16);

    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

    // .final() already removes PKCS7 padding automatically
    const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
    const decoder = new TextDecoder('utf-8'); // Specify the encoding
    const out = decoder.decode(decrypted);
    return out;
}
export function decryptFile(encryptedFilePath: string, password: string): void {
    const key = getKey(password); // Ensure this returns a 32-byte Buffer

    const fileData = fs.readFileSync(encryptedFilePath);
    console.log(encryptedFilePath)
    const iv = fileData.subarray(0, 16); 
    const encryptedData = fileData.subarray(16);

    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

    // .final() already removes PKCS7 padding automatically
    const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);

    const outputPath = encryptedFilePath.replace(".enc", "");
    fs.writeFileSync(outputPath, decrypted);
    console.log(`File decrypted: ${outputPath}`);
}
export function loadOrGenerateKey(MasterPassword:string): Buffer {
    if (fs.existsSync(KEY_FILE)) {
        // Read as base64 string and convert to 32-byte Buffer
        const data = readEncryptedFile(KEY_FILE, MasterPassword);
        return Buffer.from(data, 'base64');
    } else {
        const key = crypto.randomBytes(32);
        fs.writeFileSync(KEY_FILE.replace(".enc", ""), key.toString('base64'));
        return key;
    }
}
export class Fernet {
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
export function getID(app: string): string {
    if (!fs.existsSync(PASS_FILE)) throw new Error("No passwords saved yet");
    const J = JSON.parse(fs.readFileSync(PASS_FILE, 'utf8'));

    for (const [key, value] of Object.entries(J)) {
        if ((value as any).app === app) return key;
    }
    throw new Error(`${app} not found in list`);
}
export function addPass(website: string, password: string, cipher:Fernet): void {
    let J: Record<string, any> = {};
    if (fs.existsSync(PASS_FILE)) {
        J = JSON.parse(fs.readFileSync(PASS_FILE, 'utf8'));
    }
    
    const keys = Object.keys(J).map(Number);
    const nextId = keys.length > 0 ? Math.max(...keys) + 1 : 0;
    
    J[nextId.toString()] = { 
        app: website, 
        password: cipher.encrypt(password) 
    };
    fs.writeFileSync(PASS_FILE, JSON.stringify(J, null, 2));
}
export function getPass(id: string, cipher: Fernet): string {
    const J = JSON.parse(fs.readFileSync(PASS_FILE, 'utf8'));
    return cipher.decrypt(J[id].password);
}