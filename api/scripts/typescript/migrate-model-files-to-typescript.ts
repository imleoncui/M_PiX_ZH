#!/usr/bin/env -S ts-node --files

import * as path from "path";
import { Project, SourceFile, SourceFileStructure } from "ts-morph";

async function main() {
  console.log('Starting magic script to transform model file into sexy usecase file');

  try {
    const filePath = process.argv[2];
    console.log({filePath});

    console.log('Reading file... ');

    const project = new Project({
      tsConfigFilePath: path.join(__dirname, '..', '..', 'tsconfig.json'),
    });
    const sourceFile: SourceFile = project.addSourceFileAtPath(filePath);

    console.log(sourceFile.getStatements());

    console.log('\nDone.');
  } catch (error) {
    console.error(error);

    process.exit(1);
  }
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
