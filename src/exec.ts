import { exec as _exec } from "child_process";

export async function exec(command: string) {
  try {
    const stdout = await new Promise<string>((resolve, reject) => {
      _exec(command, { encoding: "utf8" }, (err, stdout, stderr) => {
        if (err) {
          reject(stderr);
        } else {
          resolve(stdout);
        }
      });
    });

    console.log(stdout);
  } catch (err) {
    process.exitCode = 1;
    console.log(err);
  }
}
