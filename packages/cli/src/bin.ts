#!/usr/bin/env node
// [CLI-BIN] Entry point for the typediagram CLI binary.
import { main } from "./cli.js";

void main(process.argv.slice(2), process.stdout, process.stderr).then((code) => process.exit(code));
