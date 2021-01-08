import { readFile } from "fs/promises";
import { parse } from "path";
import { access } from "./access";
import { exec } from "./exec";
import { write } from "./write";

export async function pkg() {
  await exec("npm init -y");
  let pkg: any = {};

  try {
    const json = await readFile("package.json", "utf8");
    pkg = JSON.parse(json);
  } catch {}

  const name = pkg.name;
  const accessBin = await access("src/bin.ts");
  let binName = "";

  if (accessBin) {
    try {
      binName = parse(name).name;
    } catch {}
  }

  const accessBrowser = await access("src/index.browser.ts");
  const browser = accessBrowser ? "./dist/index.browser.mjs" : undefined;

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
    eslintConfig: undefined,
    jest: undefined,
    dependencies: undefined,
    devDependencies: undefined,
    peerDependencies: undefined,
    ...pkg,
    ...({
      browser: browser,
      module: "./dist/index.mjs",
      main: "./dist/index.js",
      exports: {
        ".": {
          browser: browser,
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

  await write("package.json", JSON.stringify(_pkg));
}
