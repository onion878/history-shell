const BaseService = require('./base-service');
const os = require('os');
const pty = require('node-pty');
const Terminal = require('xterm').Terminal;
const FitAddon = require('xterm-addon-fit').FitAddon;

class TerminalService extends BaseService {
    constructor() {
        super();
        this.nowPty = null;
        this.fitAddon = new FitAddon();
        this.color1 = '#424242';
        this.color2 = '#222';
    }

    init(element) {
        const that = this;
        return new Promise((resolve, reject) => {
            let terminal = process.env[os.platform() == 'win32' ? 'COMSPEC' : 'SHELL'];
            // terminal = 'C:\\Program Files\\Git\\bin\\bash.exe';
            if (this.nowPty == null) {
                that.initNodePty(terminal, resolve, element);
            } else {
                that.initXterm(terminal, resolve, element);
                resolve(that.nowPty, that.term);
            }
        });
    }

    initNodePty(userBash, resolve, element) {
        const that = this;
        const ptyProcess = pty.spawn(userBash, [], {
            name: 'xterm-color',
            cols: 180,
            rows: 30,
            cwd: process.env.HOME,
            env: process.env
        });
        that.nowPty = ptyProcess;
        that.initXterm(userBash, resolve, element);
        that.nowPty.onData(function (data) {
            that.writeToXterm(data);
        });
        resolve(that.nowPty, that.term);
    }

    initXterm(userBash, resolve, element) {
        const that = this;
        that.term = new Terminal(this.getTermOptions());
        element.style.overflow = 'hidden';
        that.term.open(element);
        that.term.loadAddon(that.fitAddon);
        that.fitAddon.fit();
        that.term.onData(function (data) {
            that.write(data);
        });
        that.initXtermSuccess();
    }

    fitTerm() {
        this.fitAddon?.fit();
        this.nowPty?.resize(this.term.cols, this.term.rows);
    }

    resetTerm() {
        this.term.reset()
    }

    clearTerm() {
        this.term.clear();
    }

    cancelPty() {
        this.nowPty.write("\x03\r");
    }

    write(shell) {
        if (this.nowPty != null && this.isWrite) {
            this.nowPty.write(shell);
        }
    }

    destroy() {
        if (this.nowPty != null) {
            this.nowPty.destroy();
            this.nowPty = null;
            this.term = null;
        }
    }
}

module.exports = new TerminalService();