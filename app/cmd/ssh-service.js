const BaseService = require('./base-service');
const Terminal = require('xterm').Terminal;
const FitAddon = require('xterm-addon-fit').FitAddon;
const Client = require('ssh2').Client;

class ShellService extends BaseService {
    constructor() {
        super();
        this.term = null;
        this.stream = null;
        this.fitAddon = new FitAddon();
    }

    init(element, config) {
        const that = this;
        return new Promise((resolve, reject) => {
            if (that.stream == null) {
                that.initSSH(resolve, element, config);
            } else {
                that.initXterm(resolve, element);
                resolve(that.stream, that.term);
            }
        });
    }

    initSSH(resolve, element, config) {
        const that = this;
        const conn = new Client();
        this.name = config.host;
        that.initXterm(resolve, element);
        conn.on('ready', function () {
            conn.shell(function (err, stream) {
                if (err) throw err;
                that.stream = stream;
                stream.on('close', function () {
                    conn.end();
                }).on('data', function (data) {
                    that.writeTerm(data);
                });
                resolve(that.stream, that.term);
            });
        }).on('error', function (err) {
            that.term?.write(err.toString());
        }).connect({
            host: config.host,
            port: config.port,
            username: config.username,
            password: config.password,
        });
    }

    initXterm(resolve, element) {
        const that = this;
        that.term = new Terminal(this.getTermOptions());
        element.style.overflow = 'hidden';
        that.term.open(element);
        that.term.loadAddon(that.fitAddon);
        that.term.onData(function (data) {
            that.write(data);
        });
        that.fitTerm();
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

    cdTargetFolder(folder) {
        const that = this;
        that.stream.write("\x03", function () {
            that.write(`cd ${folder}\r`);
        });
    }

    clearTerm() {
        this.recordFlag = false;
        const that = this;
        that.stream.write("\x03", function () {
            that.write('clear\r');
        });
    }

    writeTerm(shell) {
        if (this.term != null) {
            this.writeToXterm(shell);
        }
    }

    write(shell) {
        if (this.stream != null && this.isWrite) {
            this.stream.write(shell);
            this.writeAfter(shell);
        }
    }

    destroy() {
        this.write('exit\n');
        this.stream?.end();
        this.stream = null;
        this.term = null;
    }
}

module.exports = ShellService;
