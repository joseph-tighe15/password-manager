import * as fs from 'fs';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import * as cryption from './service/encrypion.js'
import { json } from 'node:stream/consumers';
const rl = readline.createInterface({ input, output });


async function deleteFile(filePath:string) {
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
async function makeIfNotExists(MasterPassword: string) {
    if (!fs.existsSync(cryption.KEY_FILE)) {
        cryption.loadOrGenerateKey(MasterPassword);
        cryption.encryptFile(cryption.KEY_FILE.replace(".enc", ""), MasterPassword)
        await deleteFile(cryption.KEY_FILE.replace(".enc", ""));
    }
}
async function listApps() : Promise<string[]> {
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
async function main():Promise<void> {
try {
    const action = await rl.question('What action do want to do (r)ead password, (m)ake password, (l)ist apps')
    const a = action.toUpperCase()[0];
    switch (a) {
        case "R":
            var app = await rl.question('What is the target app? ');
            var MasterPassword = await rl.question('What is the master password? ');
            rl.close();
            var key = cryption.loadOrGenerateKey(MasterPassword);
            var cipher_suite = new cryption.Fernet(key);
            const id = cryption.getID(app);
            console.log(`Password for git: ${cryption.getPass(id, cipher_suite)}`);

            break;
        case "M":
            var app = await rl.question('What is the target app? ');
            var password = await rl.question('What is the target password? ');
            var MasterPassword = await rl.question('What is the master password? ');
            rl.close();
            await makeIfNotExists(MasterPassword);
            var key = cryption.loadOrGenerateKey(MasterPassword);
            var cipher_suite = new cryption.Fernet(key);
            cryption.addPass(app, password, cipher_suite);
            break;
        case "L":
            rl.close();
            var x = await listApps();
            for (let i of x) {
                console.log(i);
            }
            break;
    }

} catch (e: unknown) {
    if (e instanceof Error) {
        console.error(e.message);
    }
    rl.close();
}
}
main();