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
async function downloadFile(url, outputPath) {
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

export async function mcdownload(version) {
    try {
        await (async function () {
            const url = "https://launchermeta.mojang.com/mc/game/version_manifest.json"
            const response = await fetch(url);
            if (!response.ok) {
                console.log(chalk.red(`Error: Server responded with ${response.status} ${response.statusText}`));
                return;
            }
            const data = await response.json();
            const versionData = data.versions.find(v => v.id === version);
            if (!versionData) {
                console.log(chalk.red(`Error: Version ${version} not found`));
                return;
            }
            const versionUrl = versionData.url;
            const versionResponse = await fetch(versionUrl);
            if (!versionResponse.ok) {
                console.log(chalk.red(`Error: Server responded with ${versionResponse.status} ${versionResponse.statusText}`));
                return;
            }
            const versionData2 = await versionResponse.json();
            const clientUrl = versionData2.downloads.client.url;
            const clientMap = versionData2.downloads.client_mappings.url;
            downloadFile(clientUrl, "./.qmcd/client.jar");
            downloadFile(clientMap, "./.qmcd/clientMap.txt");

        })()
    } catch (err) {
        console.log(chalk.red('Error downloading file: ' + err.message));
    }
    return
}
