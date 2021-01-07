import { execSync } from "child_process";
import { access, mkdir, readFile, rmdir, writeFile } from "fs/promises";
import { builtinModules } from "module";
import { parse } from "path";
import json from "@rollup/plugin-json";
import typescript from "@rollup/plugin-typescript";
import del from "del";
import { OutputOptions, rollup } from "rollup";
import { preserveShebangs } from "rollup-plugin-preserve-shebangs";

export default async () => {
  await rmdir("dist", { recursive: true });
  await mkdir(".vscode", { recursive: true });
  let settings = "{}";

  try {
    settings = await readFile(".vscode/settings.json", "utf8");
    settings = JSON.stringify(JSON.parse(settings));
  } catch {}

  const _settings = JSON.stringify({
    "editor.tabSize": 2,
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": true,
    },
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "typescript.tsdk": "node_modules/typescript/lib",
  });

  if (settings !== _settings) {
    await writeFile(".vscode/settings.json", _settings);
  }

  let extensions = "{}";

  try {
    extensions = await readFile(".vscode/extensions.json", "utf8");
    extensions = JSON.stringify(JSON.parse(extensions));
  } catch {}

  const _extensions = JSON.stringify({
    recommendations: ["dbaeumer.vscode-eslint", "esbenp.prettier-vscode"],
  });

  if (extensions !== _extensions) {
    await writeFile(".vscode/extensions.json", _extensions);
  }

  await mkdir("src", { recursive: true });

  try {
    await access("src/index.ts");
  } catch {
    await writeFile("src/index.ts", "export {};");
  }

  let accessBin = false;

  try {
    await access("src/bin.ts");
    accessBin = true;
  } catch {}

  let pkgJson = "{}";
  let pkg: any = {};

  try {
    pkgJson = await readFile("package.json", "utf8");
    pkg = JSON.parse(pkgJson);
    pkgJson = JSON.stringify(pkg);
  } catch {}

  const { name, dependencies, devDependencies, peerDependencies } = pkg;
  let binName = "";

  if (accessBin) {
    try {
      binName = parse(name).name;
    } catch {}
  }

  const _pkg = {
    name: undefined,
    version: undefined,
    description: undefined,
    keywords: undefined,
    author: undefined,
    license: undefined,
    homepage: undefined,
    bugs: undefined,
    repository: undefined,
    publishConfig: {
      access: "public",
    },
    browser: undefined,
    module: undefined,
    main: undefined,
    bin: binName ? { [binName]: "./dist/bin.js" } : undefined,
    exports: undefined,
    scripts: undefined,
    prettier: undefined,
    jest: undefined,
    dependencies: undefined,
    devDependencies: undefined,
    peerDependencies: undefined,
    ...pkg,
    ...({
      browser: "./dist/index.mjs",
      module: "./dist/index.mjs",
      main: "./dist/index.js",
      exports: {
        ".": {
          browser: "./dist/index.mjs",
          import: "./dist/index.mjs",
          require: "./dist/index.js",
        },
      },
      scripts: {
        build: "build",
        clean: "del dist",
        format: "prettier --write .",
        lint: "eslint --ext .ts,.tsx --fix .",
        test: "jest",
      },
      prettier: {
        printWidth: 120,
        trailingComma: "all",
      },
      eslintConfig: {
        plugins: ["import", "react-hooks"],
        parser: "@typescript-eslint/parser",
        parserOptions: {
          sourceType: "module",
        },
        ignorePatterns: ["/dist/"],
        rules: {
          "no-var": "error",
          "import/no-absolute-path": "error",
          "import/no-dynamic-require": "error",
          "import/no-webpack-loader-syntax": "error",
          "import/no-self-import": "error",
          "import/no-useless-path-segments": "error",
          "import/order": [
            "error",
            {
              alphabetize: {
                order: "asc",
              },
            },
          ],
          "react-hooks/rules-of-hooks": "error",
          "react-hooks/exhaustive-deps": "warn",
          "padding-line-between-statements": [
            "warn",
            {
              blankLine: "always",
              prev: "import",
              next: "*",
            },
            {
              blankLine: "any",
              prev: "import",
              next: "import",
            },
            {
              blankLine: "always",
              prev: "*",
              next: "export",
            },
            {
              blankLine: "any",
              prev: "export",
              next: "export",
            },
            {
              blankLine: "always",
              prev: "*",
              next: [
                "class",
                "function",
                "block",
                "block-like",
                "multiline-expression",
                "multiline-const",
                "multiline-let",
              ],
            },
            {
              blankLine: "always",
              prev: [
                "class",
                "function",
                "block",
                "block-like",
                "multiline-expression",
                "multiline-const",
                "multiline-let",
              ],
              next: "*",
            },
          ],
        },
      },
      jest: {
        preset: "ts-jest",
        snapshotSerializers: ["@mo36924/jest-snapshot-serializer-babel"],
      },
    } as any),
  };

  const _pkgJson = JSON.stringify(_pkg);

  if (pkgJson !== _pkgJson) {
    await writeFile("package.json", _pkgJson);
  }

  const tsconfig = {
    compilerOptions: {
      target: "ES2020",
      module: "ES2020",
      jsx: "react-jsx",
      rootDir: "src",
      outDir: "dist",
      moduleResolution: "node",
      importsNotUsedAsValues: "error",
      resolveJsonModule: true,
      declaration: true,
      emitDeclarationOnly: true,
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
    },
    include: ["src"],
  };

  const tsconfigJson = JSON.stringify(tsconfig);
  let _tsconfigJson = "";

  try {
    _tsconfigJson = await readFile("tsconfig.json", "utf8");
    _tsconfigJson = JSON.stringify(JSON.parse(_tsconfigJson));
  } catch {}

  if (tsconfigJson !== _tsconfigJson) {
    await writeFile("tsconfig.json", tsconfigJson);
  }

  try {
    const stdout = execSync("npx jest --passWithNoTests", { encoding: "utf8" });
    console.log(stdout);
  } catch (err) {
    process.exitCode = 1;
    console.log(err);
  }

  try {
    const stdout = execSync("npx eslint --ext .ts,.tsx --fix .", { encoding: "utf8" });
    console.log(stdout);
  } catch (err) {
    process.exitCode = 1;
    console.log(err);
  }

  try {
    const stdout = execSync("npx prettier --write .", { encoding: "utf8" });
    console.log(stdout);
  } catch (err) {
    process.exitCode = 1;
    console.log(err);
  }

  try {
    const stdout = execSync("npx tsc", { encoding: "utf8" });
    console.log(stdout);
  } catch (err) {
    process.exitCode = 1;
    console.log(err);
  }

  await del(["dist/**/__tests__/", "dist/**/*.test.*"]);

  // const { options, fileNames } = ts.getParsedCommandLineOfConfigFile(
  //   "tsconfig.json",
  //   {},
  //   {
  //     ...ts.sys,
  //     onUnRecoverableConfigFileDiagnostic() {},
  //   },
  // )!;

  // const host = ts.createCompilerHost(options);
  // const hostWriteFile = host.writeFile;

  // host.writeFile = (fileName, ...args) => {
  //   if (fileName.includes("__tests__") || fileName.includes(".test.")) {
  //     return;
  //   }

  //   hostWriteFile(fileName, ...args);
  // };

  // const program = ts.createProgram({ options: options, rootNames: fileNames, host });
  // const result = program.emit();

  // for (const diagnostic of result.diagnostics) {
  //   process.exitCode = 1;
  //   console.log(ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
  // }

  const external = [...builtinModules, ...Object.keys({ ...dependencies, ...devDependencies, ...peerDependencies })];

  const outputOptions: OutputOptions = {
    sourcemap: true,
    sourcemapExcludeSources: true,
    preferConst: true,
    exports: "auto",
    interop: "auto",
  };

  const input = accessBin ? ["src/index.ts", "src/bin.ts"] : "src/index.ts";

  const bundle = await rollup({
    input,
    external,
    plugins: [typescript(), json({ preferConst: true }), preserveShebangs()],
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
};
