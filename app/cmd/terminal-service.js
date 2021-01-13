const BaseService = require('./base-service');
const os = require('os');
const pty = require('node-pty');
const Terminal = require('xterm').Terminal;
const FitAddon = require('xterm-addon-fit').FitAddon;

class TerminalService extends BaseService {
    constructor() {
        super();
        this.cmdFlag = false;
        this.nowPty = null;
        this.initMsg = "";
        this.fitAddon = new FitAddon();
    }

    init(element, path) {
        const that = this;
        return new Promise((resolve, reject) => {
            let terminal = process.env[os.platform() == 'win32' ? 'COMSPEC' : 'SHELL'];
            if (path) {
                that.name = path;
                terminal = path;
            } else {
                that.name = 'base';
            }
            if (terminal.indexOf('cmd.exe') > -1) {
                this.cmdFlag = true;
            }
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
        try {
            const ptyProcess = pty.spawn(userBash, [], {
                name: 'terminal',
                cols: 180,
                rows: 30,
                cwd: os.homedir(),
                env: process.env
            });
            that.nowPty = ptyProcess;
            that.nowPty.onData(function (data) {
                that.writeToXterm(data);
            });
        } catch (e) {
            this.initMsg = e.toString();
            this.term?.write(that.initMsg);
        }
        that.initXterm(userBash, resolve, element);
        resolve(that.nowPty, that.term);
    }

    initXterm(userBash, resolve, element) {
        const that = this;
        that.term = new Terminal(that.getTermOptions());
        element.style.overflow = 'hidden';
        that.term.open(element);
        that.term.loadAddon(that.fitAddon);
        that.term.onData(function (data) {
            that.write(data);
        });
        that.term.write(that.initMsg);
        that.fitTerm();
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
            this.writeAfter(shell);
        }
    }

    destroy() {
        this.write('exit\n');
        this.nowPty?.kill();
        this.nowPty = null;
        this.term = null;
    }
}

module.exports = TerminalService;
