import { rmdir } from "fs/promises";
import del from "del";
import { exec } from "./exec";
import { pkg } from "./pkg";
import { rollup } from "./rollup";
import { write } from "./write";

export default async () => {
  await Promise.allSettled([
    rmdir("dist", { recursive: true }),
    write(
      ".vscode/settings.json",
      JSON.stringify({
        "editor.tabSize": 2,
        "editor.formatOnSave": true,
        "editor.codeActionsOnSave": {
          "source.fixAll.eslint": true,
        },
        "editor.defaultFormatter": "esbenp.prettier-vscode",
        "typescript.tsdk": "node_modules/typescript/lib",
      }),
    ),
    write(
      ".vscode/extensions.json",
      JSON.stringify({
        recommendations: ["dbaeumer.vscode-eslint", "esbenp.prettier-vscode"],
      }),
    ),
    write("src/index.ts", "export {};", { flag: "wx" }),
    write(
      "tsconfig.json",
      JSON.stringify({
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
      }),
    ),
    pkg(),
  ]);

  await exec("npx jest --passWithNoTests");
  await exec("npx eslint --ext .ts,.tsx --fix .");
  await exec("npx prettier --write .");
  await exec("npx tsc");

  await del(["dist/**/__tests__/", "dist/**/*.test.*"]);
  await rollup();
};
