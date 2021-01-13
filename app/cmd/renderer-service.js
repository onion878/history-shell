const Terminal = require('xterm').Terminal;
const historyData = require('../data/history-data');

class RendererService {
    constructor() {
        this.script = "";
        this.term = null;
        this.init();
    }

    init() {
        this.term = new Terminal();
        const d = document.createElement('div');
        this.term.open(d);
    }

    write(shell) {
        this.script += shell;
    }

    saveHistory(name, flag) {
        const that = this;
        this.term.write(this.script, function () {
            that.term.selectAll();
            const d = that.term.getSelection().trim();
            if (d.length > 0) {
                if (flag) {
                    historyData.insert(d.trim(), name).then();
                } else {
                    const l = d.split('\n');
                    historyData.insert(l[l.length - 1].trim(), name).then();
                }
            }
            that.resetTerm();
        });
    }

    resetTerm() {
        this.term?.reset();
        this.script = "";
    }

    destroy() {
        this.term = null;
    }
}

module.exports = new RendererService();
