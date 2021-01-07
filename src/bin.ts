#!/usr/bin/env node
import index from "./index";

index().catch((err) => {
  console.log(err);
  process.exitCode = 1;
});
