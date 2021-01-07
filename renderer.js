const ssh = require('./app/ssh-service');
const terminal = require('./app/terminal-service');
// ssh.init(document.getElementById('xterm'));
terminal.init(document.getElementById('xterm'));
global.fit = () => {
    // ssh.fitTerm();
    terminal.fitTerm();
}