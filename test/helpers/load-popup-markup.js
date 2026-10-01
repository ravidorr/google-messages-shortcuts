import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const projectDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export async function loadPopupMarkup(documentRoot = document) {
  const popupHtml = await readFile(path.join(projectDirectory, 'popup.html'), 'utf8');
  const popupDocument = new JSDOM(popupHtml).window.document;

  documentRoot.body.innerHTML = popupDocument.body.innerHTML;
}
