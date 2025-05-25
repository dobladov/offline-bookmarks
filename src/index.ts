import { $ } from "bun";
import { readdir, readFile } from "node:fs/promises";
import { watchFile } from "node:fs";
import { generateHtml } from "./html"
import {Item} from "./interfaces";
import {styleText as sT} from 'node:util'

const inputBookmarksFile = process.env.INPUT_BOOKMARKS_FILE || './bookmarks.json';
const outputFolder = process.env.OUTPUT_FOLDER || './offline';
const bookmarksFolderName = process.env.BOOKMARKS_FOLDER_NAME || 'offline';

const downloadPage = async (item: Item) => {
    console.log(`Name: ${item.name}, URL: ${item.url}`);
    await $`monolith -q ${item.url} -o ${outputFolder}/${item.guid}^${item.name}.html`;
}

const getBookmarksFromJson = async () => {
    const bookmarks = JSON.parse(await readFile(inputBookmarksFile, 'utf-8'));
    return bookmarks.roots.bookmark_bar.children.filter((item: Item) => item.name === bookmarksFolderName)?.[0]?.children || [];
}

const processBookmarks = async () => {
    const bookmarks: Item[] = await getBookmarksFromJson();
    const alreadyDownloaded = (await readdir(outputFolder))
        .filter(i => i !== 'index.html' && i.endsWith('.html'))
        .map(item => item.split('^')[0]);

    const errorMessages: string[] = [];

    // Case when a downloaded bookmark is not in the bookmarks file anymore
    const deleted = alreadyDownloaded.filter(item => !bookmarks.some(bookmark => bookmark.guid === item));
    if (deleted.length > 0) {
        console.log(sT('gray', `Found ${deleted.length} deleted bookmarks: ${deleted}`));
        await Promise.all(deleted.map(async (item) => {
            try {
                await $`rm ${outputFolder}/${item}^*.html`;
                console.log(sT('red', `Deleted: ${item}`));
            } catch (err) {
                errorMessages.push(`Error deleting ${item}: ${err}`);
            }
        }));
    }

    await Promise.all(bookmarks.map(async (item: Item) => {
        const isDownloaded = alreadyDownloaded.includes(item.guid);

        if (isDownloaded) {
            console.log(sT('gray', `Already downloaded: ${item.name}`));
            return;
        }

        try {
            await downloadPage(item);
            console.log(sT('green', `Downloaded: ${item.name}`));
        } catch (err) {
            errorMessages.push(sT('red', `Error downloading ${item.name}: ${err}`));
        }
    }));

    await generateHtml(outputFolder, errorMessages);
}


watchFile(inputBookmarksFile, (filename) => {
    console.log(sT('yellow', `File changed: ${inputBookmarksFile}`));
    processBookmarks()
});

processBookmarks();
