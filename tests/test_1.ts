import { assertEquals } from "jsr:@std/assert";
import * as fs from 'node:fs'
import * as cryption from '../src/service/encrypion.ts'
import * as helpers from '../src/service/helpers.ts'

Deno.test("Encrypting / Decrypting Files", () => {
  const content = fs.readFileSync("./tests/testFiles/exKey.txt")
  cryption.encryptFile("./tests/testFiles/exKey.txt", "key");
  cryption.decryptFile("./tests/testFiles/exKey.txt.enc", "key");
  assertEquals(content, fs.readFileSync("tests/testFiles/exKey.txt"));
});
Deno.test("reading Encrypted Files", () => {
  const content = fs.readFileSync("./tests/testFiles/exKey.txt").toString();
  cryption.encryptFile("./tests/testFiles/exKey.txt", "key");
  const content2 = cryption.readEncryptedFile("./tests/testFiles/exKey.txt.enc", "key");
  assertEquals(content, content2);
});
Deno.test("listing apps", ()=>{
  helpers.listApps();
});
