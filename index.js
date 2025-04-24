#!/usr/bin/env node
import { program } from 'commander';
import packagedotjson from './package.json' with {type: 'json'};
import * as fs from "fs/promises"
import * as os from "os"
import * as path from "path"
import chalk from "chalk"
import { download } from "./download.js"
import { mcdownload } from './minecraft_downloader.js';
import { spawn } from 'child_process';
import unzipper from "unzipper"

program.version(packagedotjson.version)
  .command('init')
  .description('Initialize a new project')
  .action(async () => {
    // Check if .qmcd exists
    try {
      const access = await fs.stat('.qmcd');
      if (access) {
        console.log('Directory .qmcd already exists, purging...');
        // Check if the directory is empty
        const files = await fs.readdir('.qmcd');
        if (files.length > 0) {
          console.log('Directory .qmcd is not empty, purging...');
          // Remove all files in the directory
          for (const file of files) {
            const filePath = path.join('.qmcd', file);
            await fs.rm(filePath, { recursive: true, force: true });
          }
          console.log('Directory .qmcd purged');
        } else {
          console.log('Directory .qmcd is empty');
        }
      } else {
        throw new Error('Directory .qmcd does not exist');
      }
    } catch (err) {
      // Create the directory
      await fs.mkdir('.qmcd', { recursive: true });
      console.log('Directory .qmcd created');
    }
    console.log('Creating .qmcd, run `qmcd download` to download utils and tools');
    return
  });

program.command('download')
  .description('Download utils and tools')
  .action(async () => {
    // Check if .qmcd exists
    try {
      const access = await fs.stat('.qmcd');
      if (access) {
        console.log('Project initialized, downloading utils and tools...' + chalk.grey(' (this may take a while)'));
        download()
        mcdownload("1.21.1")
      } else {
        throw new Error('Directory .qmcd does not exist, run `qmcd init` to initialize the project');
      }
    } catch (err) {
      console.log(chalk.red('Directory .qmcd does not exist, run `qmcd init` to initialize the project'));
      return
    }
    return
  });

program.command('run')
  .description('Run the decompiler')
  .action(async () => {
    try {
      // java -jar .qmcd/mcdecompiler.jar -i .qmcd/client.jar -m .qmcd/clientMap.txt -o .qmcd/deobf.jar
      const decompiler = spawn('java', ['-jar', ".qmcd/mcdecompiler.jar", "-i", ".qmcd/client.jar", "-m", ".qmcd/clientMap.txt", "-o", ".qmcd/deobf.jar"])
      decompiler.stdout.on('data', (data) => {
        console.log(chalk.blue(data.toString()));
      });
      decompiler.stderr.on('data', (data) => {
        console.log(chalk.red(data.toString()));
      });
      decompiler.on('error', (err) => {
        console.log(chalk.red('Error starting decompiler: ' + err));
      });
      await new Promise((resolve, reject) => {
        decompiler.on("exit", (code) => {
          if (code !== 0) {
            console.log(chalk.red(`Decompiler exited with code ${code}`));
            reject(code);
          } else {
            console.log(chalk.green('Decompiler finished successfully'));
            resolve(code);
          }
        })
      })
      // java -jar .qmcd/vineflower.jar .qmcd/deobf.jar .qmcd/main.zip
      await fs.mkdir(".qmcd/out", { recursive: true });
      const vineflower = spawn('java', ['-jar', ".qmcd/vineflower.jar", ".qmcd/deobf.jar", ".qmcd/out"])
      vineflower.stdout.on('data', (data) => {
        console.log(chalk.blue(data.toString()));
      });
      vineflower.stderr.on('data', (data) => {
        console.log(chalk.red(data.toString()));
      });
      vineflower.on('error', (err) => {
        console.log(chalk.red('Error starting decompiler: ' + err));
      });
      await new Promise((resolve, reject) => {
        vineflower.on("exit", (code) => {
          if (code !== 0) {
            console.log(chalk.red(`Vineflower exited with code ${code}`));
            reject(code);
          } else {
            console.log(chalk.green('Vineflower finished successfully'));
            resolve(code);
          }
        })
      })
      const zip = await unzipper.Open.file(".qmcd/out/deobf.jar")
      await zip.extract({ path: 'workspace' })
    } catch (err) {
      console.log(chalk.red('Error running decompiler: ' + err));
    }
  });
program.parse(process.argv);