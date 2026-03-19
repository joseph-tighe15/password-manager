import * as cryption from './encrypion.ts'
import * as fs from 'node:fs'
export async function deleteFile(filePath:string) {
  try {
    await fs.unlink(filePath, ()=>{
        return;
    });
  } catch (err:unknown) {
    if (err instanceof Error) {
      console.log('File does not exist, continuing...');
    } else {
      console.error('Error deleting file:', err);
      throw err; // Re-throw if it's an unexpected error
    }
  }
}
export async function makeIfNotExists(MasterPassword: string) {
    if (!fs.existsSync(cryption.KEY_FILE)) {
        cryption.loadOrGenerateKey(MasterPassword);
        cryption.encryptFile(cryption.KEY_FILE.replace(".enc", ""), MasterPassword)
        await deleteFile(cryption.KEY_FILE.replace(".enc", ""));
    }
}
export async function listApps() : Promise<string[]> {
    let data = fs.readFileSync(cryption.PASS_FILE, 'utf-8')
    let J = JSON.parse(data);
    let out = [];
    for (const [key, value] of Object.entries(J)) {
        if (value && typeof value === 'object' && 'app' in value && typeof value.app === 'string') {
            out.push(value.app);
        }
    }
    return out;
}