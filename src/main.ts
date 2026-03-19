import * as fs from 'node:fs';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import * as cryption from './service/encrypion.ts'
import { json } from 'node:stream/consumers';
import * as helpers from './service/helpers.ts'
const rl = readline.createInterface({ input, output });

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
            await helpers.makeIfNotExists(MasterPassword);
            var key = cryption.loadOrGenerateKey(MasterPassword);
            var cipher_suite = new cryption.Fernet(key);
            cryption.addPass(app, password, cipher_suite);
            break;
        case "L":
            rl.close();
            var x = await helpers.listApps();
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