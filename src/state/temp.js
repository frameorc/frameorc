import fs from "node:fs";
const { mkdtemp, rm } = fs.promises;
import { tmpdir } from "node:os";
import { join } from "node:path";

let tmpPath;
export async function tmpFile(path) {
  tmpPath ??= await mkdtemp(join(tmpdir(), 'state-'));
  return join(tmpPath, path);
}

export async function cleanup() {
  if (tmpPath !== undefined)
    await rm(tmpPath, { force: true, recursive: true });
}

