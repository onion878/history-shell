<script lang="ts">
    import {createEventDispatcher} from "svelte";

    export let theme, tools = [], title = '标题', toolTitle = '目录';
    let show = false,
        active = "";

    const dispatch = createEventDispatcher();
    const toolClick = (tool) => {
        dispatch('toolClick', tool);
    }
</script>

<style>
    .sidebar {
        width: 100%;
        height: 100%;
    }

    .sidebar > .title {
        display: none;
        height: 35px;
        display: flex;
        box-sizing: border-box;
        overflow: hidden;
        padding-left: 8px;
        padding-right: 8px;
        line-height: 35px;
    }

    .sidebar > .title > .title-label h2 {
        text-transform: uppercase;
        font-size: 11px;
        cursor: default;
        font-weight: 400;
        -webkit-margin-before: 0;
        -webkit-margin-after: 0;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }

    .panel {
        overflow: hidden;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
    }

    .panel > .panel-header {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        overflow: hidden;
        display: flex;
        cursor: pointer;
        font-family: 'icofont';
    }

    .panel > .panel-header.expanded {
        height: 25px;
        line-height: 25px;
    }

    .panel > .panel-header h3.title {
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
        font-size: 12px;
        -webkit-margin-before: 0;
        -webkit-margin-after: 0;
    }

    .monaco-action-bar {
        text-align: right;
        overflow: hidden;
        white-space: nowrap;
    }

    .monaco-action-bar .actions-container {
        display: flex;
        margin: 0 auto;
        padding: 0;
        width: 100%;
        justify-content: flex-end;
    }

    .monaco-action-bar .action-item {
        cursor: pointer;
        display: inline-block;
        transition: transform 100ms ease;
        position: relative;
    }

    .monaco-action-bar .action-item.active {
        transform: scale(1.5);
    }

    .panel > .panel-header > .actions .action-label.icon {
        width: 25px;
        font-size: 13px;
        margin-right: 0;
        padding: 0px 6px;
        font-style: normal;
    }

    .sidebar > .bar-content {
        height: calc(100% - 60px);
        overflow: auto;
        width: auto;
    }
</style>

<div
        class="sidebar"
        style="background: {theme.colors['sideBar.background']}; color: {theme.colors['sideBar.foreground']};">
    <div class="composite title">
        <div class="title-label">
            <h2 title={title}>{title}</h2>
        </div>
    </div>
    <div class="content">
        <div class="panel">
            <div
                    class="panel-header expanded"
                    tabindex="0"
                    role="toolbar"
                    aria-label="文件资源管理器部分"
                    aria-expanded="true"
                    draggable="true"
                    style="background-color: {theme.colors['panel.background']};"
                    on:mouseover={() => (show = true)}
                    on:mouseout={() => (show = false)}>
                <h3 class="title" title="demo">&nbsp;&nbsp;{toolTitle}</h3>
                <div class="actions" style="flex: 1;display: {show ? 'block' : 'none'}">
                    <div class="monaco-toolbar">
                        <div class="monaco-action-bar animated">
                            <ul
                                    class="actions-container"
                                    role="toolbar">
                                {#each tools as tool}
                                    <li
                                            class="action-item"
                                            role="presentation"
                                            class:active={active == tool.key}>
                                        <i
                                                on:mouseup={() => (active = '')}
                                                on:mousedown={() => (active = tool.key)}
                                                on:click={()=> toolClick(tool)}
                                                class={"action-label icon explorer-action " + tool.icon}
                                                role="button"
                                                title={tool.title}/>
                                    </li>
                                {/each}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="bar-content">
        <slot/>
    </div>
</div>
