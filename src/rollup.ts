import { readFile } from "fs/promises";
import { builtinModules } from "module";
import json from "@rollup/plugin-json";
import typescript from "@rollup/plugin-typescript";
import { OutputOptions, rollup as _rollup } from "rollup";
import { preserveShebangs } from "rollup-plugin-preserve-shebangs";
import { access } from "./access";

export async function rollup() {
  let pkg: any = {};

  try {
    const json = await readFile("package.json", "utf8");
    pkg = JSON.parse(json);
  } catch {}

  const external = [
    ...builtinModules,
    ...Object.keys({ ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies }),
  ];

  const outputOptions: OutputOptions = {
    sourcemap: true,
    sourcemapExcludeSources: true,
    preferConst: true,
    exports: "auto",
    interop: "auto",
  };

  const accessBin = await access("src/bin.ts");
  const input = accessBin ? ["src/index.ts", "src/bin.ts"] : "src/index.ts";

  const bundle = await _rollup({
    input,
    external,
    plugins: [typescript({ declaration: false }), json({ preferConst: true }), preserveShebangs()],
  });

  await Promise.all([
    bundle.write({
      dir: "dist",
      entryFileNames: "[name].js",
      chunkFileNames: "[name].js",
      format: "commonjs",
      ...outputOptions,
    }),
    bundle.write({
      dir: "dist",
      entryFileNames: "[name].mjs",
      chunkFileNames: "[name].mjs",
      format: "module",
      ...outputOptions,
    }),
  ]);

  if (await access("src/index.browser.ts")) {
    const bundle = await _rollup({
      input: "src/index.browser.ts",
      external,
      plugins: [typescript({ declaration: false }), json({ preferConst: true }), preserveShebangs()],
    });

    await bundle.write({
      file: "dist/index.browser.mjs",
      inlineDynamicImports: true,
      format: "module",
      ...outputOptions,
    });
  }
}
