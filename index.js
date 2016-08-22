const blessed = require('blessed');
const colors = require('colors');
const { parseDiff, parseHunk } = require('git-parser');
const exec = require('child_process').exec;

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
  // border: {
  //   type: 'line',
  // },
  content: '',
});

const right = blessed.box({
  top: '0%',
  left: '50%',
  width: '50%',
  height: '100%',
  scrollable: true,
  // border: {
  //   type: 'line',
  // },
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

module.exports = () => {
  exec('git diff', (err, stdout, stderr) => {
    const parsed = parseDiff(stdout);
    parsed.map((line, lineIndex) => {
      // retrieve existing content
      let leftContent = left.getContent();
      let rightContent = right.getContent();
      // insert a new line for each bix
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
        default:
          currLeftContent = line.value;
          currRightContent = line.value;
          break;
      }
      // concat the existing content and current line
      leftContent = leftContent + '\r\n' + currLeftContent;
      rightContent = rightContent + '\r\n' + currRightContent;
      left.setContent(leftContent);
      right.setContent(rightContent);
    });
    screen.render();
  });
};
