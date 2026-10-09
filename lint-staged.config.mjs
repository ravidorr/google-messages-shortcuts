function commandForProjectFiles(command) {
  return (files) => {
    const projectFiles = files.filter((file) => !file.includes('/.claude/'));

    if (projectFiles.length === 0) {
      return [];
    }

    return `${command} ${projectFiles.map((file) => JSON.stringify(file)).join(' ')}`;
  };
}

export default {
  '*.{ts,tsx,js,mjs,cjs}': commandForProjectFiles('eslint --max-warnings=0 --no-warn-ignored'),
  '*.css': commandForProjectFiles('stylelint --max-warnings=0'),
  '*.html': commandForProjectFiles('html-validate'),
  '*.md': commandForProjectFiles('markdownlint-cli2')
};
