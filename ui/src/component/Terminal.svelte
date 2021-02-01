<script lang="ts">
    import {watchResize} from "svelte-watch-resize";
    import {createEventDispatcher, onMount} from "svelte";
    import {addTerminal, formatDuring, getNowTime, isFile, isWin, matchLocalPath, openFile, openFolder} from "./utils";
    import ContextMenu from "./ContextMenu.svelte";

    const TerminalService = require('./app/cmd/terminal-service');
    const terminal = new TerminalService();
    let dom, first = false;
    export let theme, init, path = null, id;
    const dispatch = createEventDispatcher();
    let startDate: Date = new Date(), endDate: Date;
    const statusList = [
        {name: '打开时间:' + getNowTime(), title: startDate.toLocaleTimeString(), icon: 'icofont-clock-time'},
    ];
    onMount(() => {
        first = true;
        if (init) {
            initTerminal();
        }
        dom.addEventListener('dragenter', dropHandler, false);
        dom.addEventListener('dragleave', dropHandler, false);
        dom.addEventListener('dragover', dropHandler, false);
        dom.addEventListener('drop', dropHandler, false);
    });

    const initTerminal = () => {
        addTerminal(id, terminal);
        terminal.init(dom, path).then(function () {
            terminal.runAfter = (() => {
                startDate = new Date();
                statusList[1] = {
                    name: '开始时间:' + getNowTime(startDate),
                    title: '程序执行命令或打开终端的开始时间:' + startDate.toLocaleTimeString(),
                    icon: 'icofont-ui-timer'
                };
                showStatusBar();
            });
            terminal.nowPty.onData(function (data) {
                endDate = new Date();
                statusList[2] = {
                    name: '结束时间:' + getNowTime(endDate),
                    title: '程序执行命令结束或打开终端成功或失败的时间:' + endDate.toLocaleTimeString(),
                    icon: 'icofont-ui-timer'
                };
                statusList[3] = {
                    name: '执行时间:' + (formatDuring(endDate.getTime() - startDate.getTime())),
                    title: '前面两个时间的差值',
                    icon: 'icofont-ui-timer'
                };
                showStatusBar();
            });
        });
    }

    const showStatusBar = () => {
        dispatch('showStatusBar', statusList);
    }

    const startTerminal = (flag) => {
        if (flag && terminal.term == null && first) {
            initTerminal();
            terminal.term.focus();
        }
        if (flag) {
            showStatusBar();
            fit();
            terminal.term.focus();
        }
    }

    $: startTerminal(init);

    const fit = () => {
        terminal.fitTerm();
    }
    let menuX, menuY, menuShow = false, menu: any[] = [], now = null;
    const all: any[] = [
        {name: '复制', key: 'copy', icon: 'icofont-ui-copy'},
        {name: '粘贴', key: 'paste', icon: 'icofont-copy-invert'},
        {name: '清空屏幕', key: 'clear', icon: 'icofont-brush'},
    ];

    if (isWin()) {
        all.push({type: 'separator'});
        all.push({name: '管理员运行', key: 'super', icon: 'icofont-skull-danger'});
    }

    const onRightClick = (e) => {
        menuX = e.x;
        menuY = e.y;
        now = terminal.term.getSelection().replace(/\n/g, '').trim();
        if (now.length > 0) {
            if (matchLocalPath(now)) {
                menu = [{
                    name: '文件管理器中打开',
                    key: 'openInFolder',
                    icon: 'icofont-folder-open'
                }, {type: 'separator'}].concat(all);
                if (isFile(now)) {
                    menu = [{name: '打开文件', key: 'open', icon: 'icofont-touch'}].concat(menu);
                } else {
                    menu = [{name: '进入目录', key: 'intoFolder', icon: 'icofont-hand-right'}].concat(menu);
                }
            } else {
                menu = all;
            }
        } else {
            menu = all;
        }
        menuShow = !menuShow;
    }

    const menuClick = ({detail}) => {
        switch (detail.key) {
            case "openInFolder": {
                openFolder(now);
                break;
            }
            case "open": {
                openFile(now);
                break;
            }
            case "intoFolder": {
                terminal.cdTargetFolder(now);
                break;
            }
            case "copy": {
                navigator.clipboard.writeText(now);
                terminal.clearSelection();
                break;
            }
            case "paste": {
                terminal.copyToXterm();
                break;
            }
            case "clear": {
                terminal.clearTerm();
                break;
            }
            case "super": {
                terminal.setSuperUser();
                break;
            }
            default:
                this.isWrite = true;
        }
    }

    const dropHandler = (ev) => {
        // Prevent default behavior (Prevent file from being opened)
        ev.preventDefault();
        if (ev.dataTransfer.items) {
            // Use DataTransferItemList interface to access the file(s)
            for (let i = 0; i < ev.dataTransfer.items.length; i++) {
                // If dropped items aren't files, reject them
                if (ev.dataTransfer.items[i].kind === 'file') {
                    const file: any = ev.dataTransfer.items[i].getAsFile();
                    if (file) {
                        terminal.write(file.path.replace(/\\/g, '/'));
                    }
                }
            }
        }
    }
</script>

<style>
    .terminal {
        width: 100%;
        height: 100%;
    }
</style>

<ContextMenu bind:theme={theme} bind:data={menu} on:click={menuClick} bind:show={menuShow}
             bind:x={menuX} bind:y={menuY}
             width="145"/>
<div class="terminal" on:contextmenu|preventDefault={(e) => onRightClick(e)} use:watchResize={fit} bind:this={dom}
     style="background-color: {theme.colors['termBackground']}"></div>
