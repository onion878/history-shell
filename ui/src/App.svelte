<script lang="ts">
    import {changeAllTheme, isDarwin, setNowTerminal, writeTerminal} from "./component/utils";

    declare function require(arg: string);

    import TitleBar from "./component/TitleBar.svelte";
    import StatusBar from "./component/StatusBar.svelte";
    import ActivityBar from "./component/ActivityBar.svelte";
    import SplitBar from "./component/SplitBar.svelte";
    import ConfigPanel from "./component/ConfigPanel.svelte";
    import QuickInput from "./component/QuickInput.svelte";
    import TabContent from "./component/TabContent.svelte";
    import HistoryPanel from "./component/HistoryPanel.svelte";
    import hotkeys from "hotkeys-js";
    import ExplorePanel from "./component/ExplorePanel.svelte";

    export let name: string;
    export let theme;
    let darwinFlag = isDarwin();
    let quickShow = false;
    let mainLoading = "block";
    let index = 0;
    let msg = "该项目进行中...", statusList = [];
    let panelType: 'config' | 'explore' = 'config';

    const changeTheme = () => {
        index++;
        const n = require('./app/utils/theme').getTheme(index);
        const d = changeAllTheme(index);
        if (d) {
            n.colors.termBackground = d.background;
        }
        theme = n;
    }

    console.log(theme);

    let tabs = [], nowTab = 0, showTab;
    let historyId, historyName;
    const setHistoryName = (tab) => {
        if (tab == null) {
            historyName = 'null';
            historyId = 'base';
            return;
        }
        if (tab.config) {
            historyName = tab.config.host;
            historyId = tab.id;
        } else {
            historyName = tab.path;
            historyId = tab.id;
        }
        showTab = tab;
    }
    const addTab = (tab) => {
        if (tab.id == null) {
            return;
        }
        let addFlag = true, now = -1;
        tabs.some((t, i) => {
            if (t.id == tab.id) {
                addFlag = false;
                now = i;
                if (t.close) {
                    t.close = false;
                }
                return true;
            }
        });
        if (addFlag) {
            tabs.push(tab);
            tabs = [...tabs];
        }
        if (nowTab == now) return;
        setHistoryName(tab);
        nowTab = null;
        setTimeout(() => {
            if (addFlag) {
                nowTab = tabs.length - 1;
            } else {
                nowTab = now;
            }
            setNowTerminal(tabs[nowTab].id);
        }, 1);
    }
    const changeTab = ({detail}) => {
        tabs = detail;
    }
    const treeClick = ({detail}) => {
        if (detail.type == 'folder') return;
        if (detail.key == 'ssh') {
            addTab({id: detail.id, name: detail.name, close: false, config: detail, icon: detail.icon});
        } else if (detail.key == 'terminal') {
            addTab({
                id: detail.id,
                name: detail.name,
                close: false,
                type: 'terminal',
                path: detail.path,
                icon: detail.icon
            });
        }
    }
    const changeHistory = ({detail}) => {
        if (detail) {
            setNowTerminal(detail.id);
            setHistoryName(detail);
        }
    }
    const addWrite = ({detail}) => {
        writeTerminal(tabs[nowTab].id, detail.input);
    }
    hotkeys('f1', function (event) {
        event.preventDefault();
        quickShow = !quickShow;
    });
    const showStatusBar = ({detail}) => {
        statusList = detail;
    }
</script>

<style>
    .main {
        width: 100%;
        height: 100%;
        background: var(--background);
        color: var(--color);
        user-select: none;
    }

    .main > .content {
        --width: calc(100% - 50px);
        width: var(--width);
        bottom: 22px;
        left: 50px;
        position: absolute;
    }
</style>

<svelte:head>
    <style>
        :focus {
            outline-color: var(--focus-border);
        }

        input:focus {
            outline-width: 1px;
            outline-style: solid;
            outline-offset: -1px;
            opacity: 1 !important;
        }

        .monaco-progress-container {
            width: 100%;
            height: 2px;
            z-index: 2;
            position: relative;
            overflow: hidden;
        }

        .monaco-progress-container .progress-bit {
            width: inherit;
            height: 5px;
            opacity: 1;
            position: absolute;
            left: 0;
            animation: move 3s infinite;
            display: none;
        }

        @keyframes move {
            from {
                left: 0px;
                width: 5%;
            }
            to {
                left: 100%;
                width: 10%;
            }
        }

        @-webkit-keyframes move {
            from {
                left: 0px;
                width: 5%;
            }
            to {
                left: 100%;
                width: 10%;
            }
        }
    </style>
</svelte:head>
<div class="main" style="--background: {theme.colors.foreground}; --color: {theme.colors['background']};
  --focus:{theme.colors['focus']}; --focus-border: {theme.colors['focusBorder']};
  --scroll:{theme.colors['scrollbarSlider.background']}; --focus-scroll: {theme.colors['scrollbarSlider.hoverBackground']};
  --shadow: {theme.colors['widget.shadow']}">
    {#if !darwinFlag}
        <TitleBar {theme} bind:msg/>
    {/if}
    <div class="monaco-progress-container" style="display: none;">
        <div class="progress-bit"
             style="background-color: {theme.colors['progressBar.background']};opacity:1;display:{mainLoading}"/>
    </div>
    <ActivityBar {theme} bind:panelType/>
    <div class="content" style="top: {darwinFlag?'0':'30'}px">
        <SplitBar {theme}>
            <div slot="left" style="width: 100%;height: 100%;">
                {#if panelType == 'config'}
                    <ConfigPanel {theme} on:addSSH={treeClick} on:treeClick={treeClick}/>
                {:else}
                    <ExplorePanel {theme} bind:showTab/>
                {/if}
            </div>
            <div slot="right" style="height: 100%;">
                <SplitBar {theme} center="left" width="250px">
                    <div slot="left" style="width: 100%;height: 100%;">
                        <TabContent {theme} bind:msg {tabs} bind:nowTab on:changeTab={changeTab}
                                    on:showStatusBar={showStatusBar}
                                    on:change={changeHistory}/>
                    </div>
                    <div slot="right" style="height: 100%;">
                        <HistoryPanel {theme} bind:name={historyName} bind:id={historyId} on:click={addWrite}/>
                    </div>
                </SplitBar>
            </div>
        </SplitBar>
    </div>
    <StatusBar {theme} {msg} {statusList}/>
    <QuickInput {theme} bind:msg bind:show={quickShow}/>
</div>
