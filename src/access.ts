import { access as _access } from "fs/promises";

export async function access(path: string) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
