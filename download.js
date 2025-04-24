import chalk from 'chalk';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs/promises';

/**
 * Downloads a file from the given URL and saves it to the specified path.
 *
 * @param {string} url - The URL of the file to download.
 * @param {string} outputPath - The local path (including filename) to save the file.
 */
export async function downloadFile(url, outputPath) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.log(
                chalk.red(`Error: Server responded with ${response.status} ${response.statusText}`)
            );
            return;
        }

        // Pipe the response stream into a file write stream
        await pipeline(
            response.body,
            createWriteStream(outputPath)
        );

        console.log(chalk.green(`Downloaded file to ${outputPath}`));
    } catch (err) {
        console.log(chalk.red('Error downloading file: ' + err.message));
    }
}


export async function download() {
    try {
        await (async function () {
            // grab latest release from github
            const repo = "MaxPixelStudios/MinecraftDecompiler"
            const url = `https://api.github.com/repos/${repo}/releases/latest`;
            const response = await fetch(url);
            if (!response.ok) {
                console.log(chalk.red(`Error: Server responded with ${response.status} ${response.statusText}`));
                return;
            }
            const data = await response.json();
            downloadFile(data.assets[0].browser_download_url, "./.qmcd/mcdecompiler.jar");
        })();
        await (async function () {
            // grab latest release from github
            downloadFile("https://raw.githubusercontent.com/MaxPixelStudios/MinecraftDecompiler/refs/heads/master/decompiler/fernflower.jar", "./.qmcd/vineflower.jar");
        })()
    } catch (err) {
        console.log(chalk.red('Error downloading utils and tools: ' + err));
        return
    }
}