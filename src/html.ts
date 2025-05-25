import { readdir } from "node:fs/promises";

export const generateHtml = async (outputFolder: string, errorMessages: string[]) => {
    const offlineFolderItems = await readdir(outputFolder);

    const lastUpdated = new Date().toLocaleString();
    
    const html = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Offline Bookmarks</title>
        <style>
        body {
                font-family: Arial, sans-serif;
                margin: 20px;
                padding: 0;
            }
        li {
            padding-bottom: .5rem;
        }
        </style>
    </head>
    <body>
    <h1>Offline Bookmarks</h1>
    <ul>
        ${offlineFolderItems.map(item => {
            const fileName = item.replace('.html', '');
            const [guid, name] = fileName.split('^');

            if (guid && name) {
                return `<li>
                    <a
                        target="_blank"
                        href="./${fileName}.html"
                        target="_blank"
                    >
                        ${name}
                    </a>
                </li>`;
            }
        }).join('')}
    </ul>
    </body>
    <footer>
        <p>Last updated: ${lastUpdated}</p>

        ${errorMessages.length > 0 
            ? `<p style="color: red;">Errors occurred during processing:</p><ul>${errorMessages.map(err => `<li>${err}</li>`).join('')}</ul>`
            : ''}
    </footer>
    </html>`;

    await Bun.write(`${outputFolder}/index.html`, html);
    console.log('HTML file generated successfully.');
}
