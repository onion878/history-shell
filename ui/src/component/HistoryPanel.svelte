<script lang="ts">
    import {createEventDispatcher} from "svelte";
    import ContextMenu from "./ContextMenu.svelte";
    import {showConfirm} from "./dialog";
    import {writeTerminal} from "./utils";

    const history = require('./app/data/history-data');
    export let theme, name = 'null', id;
    const dispatch = createEventDispatcher();
    let data = [];

    const getHistory = (n) => {
        history.getAllData(n || 'base').then(d => data = d);
    }

    const click = (d) => {
        dispatch('click', d);
    }

    const copy = (d) => {
        navigator.clipboard.writeText(d);
    }

    let menuX, menuY, menuShow = false, nowItem;
    let menu = [
        {name: '执行', key: 'run', icon: 'icofont-play-alt-1'},
        {name: '复制', key: 'copy', icon: 'icofont-ui-copy'},
        {name: '删除', key: 'delete', icon: 'icofont-ui-delete'},
    ];

    const menuClick = ({detail}) => {
        if (detail.key == 'run') {
            writeTerminal(id || 'base', nowItem.input + '\r');
        } else if (detail.key == 'copy') {
            navigator.clipboard.writeText(nowItem.input);
        } else {
            showConfirm(`确认删除[${nowItem.input}]吗?`).then(({response}) => {
                if (response === 1) {
                    history.delete(nowItem._id).then(() => getHistory(name));
                }
            });
        }
    }

    const onRightClick = (d, e) => {
        nowItem = d;
        menuX = e.clientX;
        menuY = e.clientY;
        menuShow = !menuShow;
    }

    $:getHistory(name);
</script>

<style>
    .history-panel {
        width: 100%;
        height: 100%;
    }

    .history-panel > .title {
        height: 35px;
        display: flex;
        box-sizing: border-box;
        overflow: hidden;
        padding-left: 8px;
        padding-right: 8px;
        line-height: 35px;
    }

    .history-panel > .title > .title-label {
        width: 100%;
    }

    .history-panel > .title > .title-label h2 {
        text-transform: uppercase;
        font-size: 11px;
        cursor: default;
        font-weight: 400;
        -webkit-margin-before: 0;
        -webkit-margin-after: 0;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        float: left;
    }

    .panel > .panel-header h3.title {
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
        font-size: 12px;
        -webkit-margin-before: 0;
        -webkit-margin-after: 0;
    }

    .content {
        height: calc(100% - 35px);
        overflow-y: auto;
    }

    .content > .list {
        height: 30px;
        line-height: 30px;
        padding: 0px 5px;
        overflow: hidden;
        word-break: break-all;
    }

    .content > .list:hover {
        background-color: var(--focus);
    }

    .content > .list > .btn {
        float: left;
        line-height: 30px;
        height: 30px;
        width: 30px;
        text-align: center;
    }

    .content > .list > .btn:hover {
        background-color: var(--focus-border);
    }

    .icofont-refresh {
        float: right;
        line-height: 35px;
        width: 30px;
        text-align: center;
    }

    .icofont-refresh:hover {
        background-color: var(--focus);
    }
</style>

<div
        class="history-panel"
        style="background: {theme.colors['sideBar.background']}; color: {theme.colors['sideBar.foreground']};">
    <div class="composite title">
        <div class="title-label">
            <h2>历史记录</h2>
            <div class="icofont-refresh" on:click={() => getHistory(name)}></div>
        </div>
    </div>
    <div class="content" style="background-color: {theme.colors['input.background']};">
        {#each data as d}
            <div class="list" on:click={() => click(d)} title={d.input}
                 on:contextmenu|preventDefault={(e) => onRightClick(d,e)}>
                <div class="icofont-copy btn" on:click|stopPropagation={() => copy(d.input)}></div>
                {d.input}
            </div>
        {/each}
    </div>
</div>
<ContextMenu bind:theme={theme} bind:data={menu} on:click={menuClick} bind:show={menuShow}
             bind:x={menuX} bind:y={menuY}
             width="120"/>
