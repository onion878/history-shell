<script lang="ts">
    import {watchResize} from "svelte-watch-resize";
    import {createEventDispatcher, onMount} from "svelte";
    import {addTerminal, formatDuring, getNowTime, matchSSHPath} from "./utils";
    import ContextMenu from "./ContextMenu.svelte";

    const SSHService = require('./app/cmd/ssh-service');
    const terminal = new SSHService();
    let dom, first: boolean = false;
    export let theme, init, config, id;
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
    });

    const initTerminal = () => {
        addTerminal(id, terminal);
        terminal.init(dom, config).then(function () {
            terminal.runAfter = (() => {
                startDate = new Date();
                statusList[1] = {
                    name: '开始时间:' + getNowTime(startDate),
                    title: '程序执行命令或打开终端的开始时间:' + startDate.toLocaleTimeString(),
                    icon: 'icofont-ui-timer'
                };
                showStatusBar();
            });
            terminal.stream.on('data', function (data) {
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

    const onRightClick = (e) => {
        menuX = e.x;
        menuY = e.y;
        now = terminal.term.getSelection().replace(/\n/g, '').trim();
        if (now.length > 0) {
            if (matchSSHPath(now)) {
                menu = [{name: '进入目录', key: 'intoFolder', icon: 'icofont-hand-right'}].concat(all);
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
            default:
                this.isWrite = true;
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
             width="100"/>
<div class="terminal" on:contextmenu|preventDefault={(e) => onRightClick(e)} use:watchResize={fit} bind:this={dom}
     style="background-color: {theme.colors['termBackground']}"></div>
