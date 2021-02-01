<script lang="ts">
    import Terminal from './Terminal.svelte';
    import SSHClient from './SSHClient.svelte';
    import {createEventDispatcher} from "svelte";
    import {closeTerminal} from "./utils";
    import ContextMenu from "./ContextMenu.svelte";

    const dispatch = createEventDispatcher();
    export let theme, msg, tabs = [], nowTab = 0;
    const changeTab = (index) => {
        nowTab = index;
        dispatch('change', tabs[nowTab]);
    }
    const closeTab = (index, e) => {
        e?.stopPropagation();
        tabs[index].close = true;
        closeTerminal(tabs[index].id);
        let i = 0;
        tabs.forEach(t => {
            if (t.close) i++;
        })
        if (i == tabs.length) {
            tabs.length = 0;
        } else {
            tabs = [...tabs];
        }
        dispatch('changeTab', tabs);
        if (index == nowTab) {
            let after = null, before = null;
            tabs.some((t, i) => {
                let f = false;
                if (t.close === false) {
                    if (i < index) {
                        before = i;
                    }
                    if (i > index) {
                        after = i;
                        f = true;
                    }
                }
                return f;
            });
            if (after != null) {
                nowTab = after;
            } else {
                nowTab = before;
            }
            dispatch('change', tabs[nowTab]);
        }
    }

    let menuX, menuY, menuShow = false, nowIndex;

    let menu = [
        {name: '关闭', key: 'close', icon: 'icofont-close-circled'},
        {name: '关闭其它', key: 'closeOther', icon: 'icofont-close-circled'},
        {name: '关闭左侧', key: 'closeLeft', icon: 'icofont-close-circled'},
        {name: '关闭右侧', key: 'closeRight', icon: 'icofont-close-circled'},
        {name: '关闭全部', key: 'closeAll', icon: 'icofont-close-circled'},
    ];

    const menuClick = ({detail}) => {
        switch (detail.key) {
            case "close": {
                closeTab(nowIndex, null);
                break;
            }
            case "closeOther": {
                tabs.forEach((tab, i) => {
                    if (i != nowIndex) {
                        closeTab(i, null);
                    }
                });
                break;
            }
            case "closeLeft": {
                tabs.forEach((tab, i) => {
                    if (i < nowIndex) {
                        closeTab(i, null);
                    }
                });
                break;
            }
            case "closeRight": {
                tabs.forEach((tab, i) => {
                    if (i > nowIndex) {
                        closeTab(i, null);
                    }
                });
                break;
            }
            case "closeAll": {
                tabs.forEach((tab, i) => {
                    closeTab(i, null);
                });
                break;
            }
            default:
        }
    }

    const showMenu = (i, e) => {
        nowIndex = i;
        menuX = e.clientX;
        menuY = e.clientY;
        menuShow = !menuShow;
    }

    const showStatusBar = ({detail}, i) => {
        if (nowTab == i) {
            dispatch('showStatusBar', detail);
        }
    }
</script>

<style>
    .tab-header {
        height: 34px;
        overflow-x: hidden;
        overflow-y: hidden;
        box-sizing: border-box;
        width: 100%;
    }

    .tab-content {
        height: calc(100% - 35px);
    }

    .tab-header > .tab-left {
        float: left;
        width: calc(100% - 35px);
    }

    .tab-header > .tab-more {
        height: 35px;
        line-height: 35px;
        padding: 0px;
        width: 35px;
        float: right;
        text-align: center;
        font-family: 'Icofont';
    }

    .tab-more:before {
        content: '\ebd7';
    }

    .tab-header > .tab-left > .tab-title {
        height: 100%;
        line-height: 35px;
        padding: 0px 10px;
        display: inline-block;
        font-family: 'Icofont';
    }

    .tab-header > .tab-title > .close-btn {
        width: 20px;
        font-size: 16px;
    }

    .close-btn:before {
        content: '\eee1';
    }

    .close-btn:hover {
        border-radius: 16px;
        background-color: var(--focus);
    }

    .tab-header > .tab-more:hover {
        background: var(--focus);
    }

    .tab-header > .tab-left > .tab-title:hover {
        background: var(--focus);
    }

    .tab-header > .tab-left > .tab-title:not(:last-child) {
        border-right: 1px solid var(--background);
    }

    .tab-content > .tab-list {
        width: 100%;
        height: 100%;
    }

    .tab-icon {
        width: 25px;
        background-position: center center;
        background-repeat: no-repeat no-repeat;
    }
</style>

<ContextMenu bind:theme={theme} bind:data={menu} on:click={menuClick} bind:show={menuShow}
             bind:x={menuX} bind:y={menuY}
             width="90"/>
<div class="tab-header"
     style="background: {theme.colors['sideBar.background']}; color: {theme.colors['sideBar.foreground']};">
    <div class="tab-left">
        {#each tabs as tab, i}
            {#if tab.close === false}
                <div class="tab-title" on:click={() => changeTab(i)}
                     on:contextmenu|preventDefault={(e) => showMenu(i, e)}
                     style="background-color: {nowTab == i?'var(--background)':''};display: inline-flex">
                    <div class="tab-icon" style="background-image: url({tab.icon})"></div>
                    <div>
                        {(i + 1) + '.' + tab.name}
                        <a class="close-btn" on:click={(e) => closeTab(i, e)}></a>
                    </div>
                </div>
            {/if}
        {/each}
    </div>
    <div class="tab-more"></div>
</div>
<div class="tab-content">
    {#each tabs as tab, i}
        {#if tab.close === false}
            <div class="tab-list" style="display: {nowTab == i? 'block':'none'};">
                {#if tab.type === 'terminal'}
                    <Terminal init={nowTab==i} bind:id={tab.id} bind:path={tab.path} {theme}
                              on:showStatusBar={(e) => showStatusBar(e, i)}/>
                {:else}
                    <SSHClient init={nowTab==i} bind:id={tab.id} bind:config={tab.config} {theme}
                               on:showStatusBar={(e) => showStatusBar(e, i)}/>
                {/if}
            </div>
        {/if}
    {/each}
</div>
