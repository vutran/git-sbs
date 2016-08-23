const blessed = require('blessed');
const colors = require('colors');
const { parseDiff } = require('git-parser');
const exec = require('child_process').exec;

let viewer = null;

const createViewer = () => {
  const screen = blessed.screen({
    smartCSR: true,
  });

  screen.title = 'Git Diff Side-By-Side';

  const left = blessed.box({
    top: '0%',
    left: '0%',
    width: '50%',
    height: '100%',
    keys: true,
    scrollable: true,
    alwaysScroll: true,
    content: '',
  });

  const right = blessed.box({
    top: '0%',
    left: '50%',
    width: '50%',
    height: '100%',
    scrollable: true,
    content: '',
  });

  left.on('render', () => {
    right.setScroll(left.getScroll());
  });

  // Quit on Escape, q, or Control-C.
  screen.key(['escape', 'q', 'C-c'], function(ch, key) {
    return process.exit(0);
  });

  screen.append(left);
  screen.append(right);

  return {
    screen,
    left,
    right,
  };

};

const render = () => {
  if (viewer) {
    viewer.screen.render();
  }
};

module.exports = () => {
  exec('git diff', (err, stdout, stderr) => {
    viewer = createViewer();
    const parsed = parseDiff(stdout);
    parsed.map((line, lineIndex) => {
      // retrieve existing content
      let leftContent = viewer.left.getContent();
      let rightContent = viewer.right.getContent();
      // insert a new line for each box
      let currLeftContent = '';
      let currRightContent = '';
      switch (line.type) {
        case 'unmodified':
          currLeftContent = colors.dim(`${line.number}\t${line.value}`);
          currRightContent = colors.dim(`${line.number}\t${line.value}`);
          break;
        case 'deleted':
          currLeftContent = colors.red(`${line.number}\t${line.value}`);
          currRightContent = '';
          break;
        case 'inserted':
          currLeftContent = '';
          currRightContent = colors.green(`${line.number}\t${line.value}`);
          break;
        case 'hunk':
          // do nothing...
          break;
        case 'file':
          if (line.data.type === 'from') {
            currLeftContent = colors.blue(line.data.file);
            currRightContent = colors.blue(line.data.file);
          }
          break;
        default:
          currLeftContent = line.value;
          currRightContent = line.value;
          break;
      }
      if (currLeftContent || currRightContent) {
        // concat the existing content and current line
        leftContent = leftContent + "\r\n" + currLeftContent;
        rightContent = rightContent + "\r\n" + currRightContent;
      }
      viewer.left.setContent(leftContent);
      viewer.right.setContent(rightContent);
    });
    render();
  });
};
