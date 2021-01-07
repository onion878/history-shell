const BaseService = require('./base-service');
const Terminal = require('xterm').Terminal;
const FitAddon = require('xterm-addon-fit').FitAddon;
const Client = require('ssh2').Client;

class ShellService extends BaseService{
    constructor() {
        super();
        this.term = null;
        this.stream = null;
        this.fitAddon = new FitAddon();
        this.color1 = '#424242';
        this.color2 = '#222';
    }

    init(element) {
        const that = this;
        return new Promise((resolve, reject) => {
            if (that.stream == null) {
                that.initSSH(resolve, element);
            } else {
                that.initXterm(resolve, element);
                resolve(that.stream, that.term);
            }
        });
    }

    initSSH(resolve, element) {
        const that = this;
        const conn = new Client();
        conn.on('ready', function () {
            console.log('Client :: ready');
            conn.shell(function (err, stream) {
                if (err) throw err;
                that.stream = stream;
                // stream.setWindow(100, 100, 500, 500);
                stream.on('close', function () {
                    conn.end();
                }).on('data', function (data) {
                    that.writeTerm(data);
                });
                that.initXterm(resolve, element);
                resolve(that.stream, that.term);
            });
        }).connect({
            host: '172.16.114.31',
            port: 22,
            username: 'root',
            password: '1234',
        });
    }

    initXterm(resolve, element) {
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
        if (this.term != null) {
            this.fitAddon.fit();
            if (this.stream != null) {
                this.stream.setWindow(this.term.rows, this.term.cols, this.term.element.offsetHeight, this.term.element.offsetWidth);
            }
        }
    }

    resetTerm() {
        this.term.reset()
    }

    clearTerm() {
        this.term.clear();
    }

    writeTerm(shell) {
        if (this.term != null) {
            this.writeToXterm(shell);
        }
    }

    write(shell) {
        if (this.stream != null && this.isWrite) {
            this.stream.write(shell);
        }
    }

    destroy() {
        if (this.stream != null) {
            this.stream.end();
            this.stream = null;
            this.term = null;
        }
    }
}

module.exports = new ShellService();