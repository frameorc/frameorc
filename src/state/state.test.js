import { expect, test, beforeAll, afterAll } from "bun:test";
import { readFile } from "node:fs/promises";
import { tmpFile, cleanup } from './temp.js';
import { State } from "./fs.js";

afterAll(cleanup);

test("basic", async () => {
  const DATA = { a: 1, b: 2 };
  let path = await tmpFile('test.dat'), s = await State(path);
  s.data = DATA;
  await s.save(0);
  expect(JSON.parse(await readFile(path))).toEqual(DATA);
});

test("nested", async () => {
  const DATA = { a: 1, b: { c: 2, d: 3, e: [4, 5, {f: 6}] }};
  let path = await tmpFile('test.dat'), s = await State(path);
  s.data = DATA;
  await s.save(0);
  expect(JSON.parse(await readFile(path))).toEqual(DATA);
  DATA.a = {g: 8, h: [9, {i: 10}]};
  let promise = s.save(1);
  expect(JSON.parse(await readFile(path))).not.toEqual(DATA);
  await promise;
  expect(JSON.parse(await readFile(path))).toEqual(DATA);
});

test("race", async () => {
  const DATA1 = { a: 1, b: 2 }, DATA2 = { c: 3, d: 4 };
  let path = await tmpFile('test.dat'), s = await State(path);
  s.data = DATA1;
  await s.save(0);
  expect(JSON.parse(await readFile(path))).toEqual(DATA1);
  s.data = DATA2;
  s.save(100);
  s.save(15);
  expect(JSON.parse(await readFile(path))).toEqual(DATA1);
  await new Promise(ok => setTimeout(ok, 10));
  expect(JSON.parse(await readFile(path))).toEqual(DATA1);
  await new Promise(ok => setTimeout(ok, 10));
  expect(JSON.parse(await readFile(path))).toEqual(DATA2);
});

