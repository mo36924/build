import { readFile, writeFile, mkdir } from "fs/promises";
import { dirname } from "path";
import prettier from "prettier";

type Options = Parameters<typeof writeFile>[2];

export async function write(path: string, data: string, options?: Options) {
  const config = await prettier.resolveConfig(path);
  data = prettier.format(data, { ...config, filepath: path });

  let _data: string | undefined;

  try {
    _data = await readFile(path, "utf8");
  } catch {}

  if (_data === data) {
    return;
  }

  await mkdir(dirname(path), { recursive: true });

  try {
    await writeFile(path, data, options);
  } catch {}
}
