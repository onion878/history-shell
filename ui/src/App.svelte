<script lang="ts">
    export let name: string;
    export let theme;
    export let quickShow = "none";
    let mainLoading = "block";
    import TitleBar from "./component/TitleBar.svelte";
    import StatusBar from "./component/StatusBar.svelte";
    import ActivityBar from "./component/ActivityBar.svelte";
    import SplitBar from "./component/SplitBar.svelte";
    import ConfigPanel from "./component/ConfigPanel.svelte";
    import QuickInput from "./component/QuickInput.svelte";
    import TabContent from "./component/TabContent.svelte";
    import Modal from "./component/Modal.svelte";

    let msg = "该项目进行中...";
    const toggleConsole = () => {
        msg = msg + "Onion ";
    };
    const toggleTerminal = () => {
        msg = msg + "Onion ==";
    };

    console.log(JSON.stringify(theme.colors));
    let tabs = [], nowTab = 0;
    const addTab = (tab) => {
        if (tab.id == null) {
            return;
        }
        let addFlag = true, now;
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
        }
        tabs = [...tabs];
        nowTab = null;
        setTimeout(() => {
            if (addFlag) {
                nowTab = tabs.length - 1;
            } else {
                nowTab = now;
            }
        }, 1);
        console.log(tabs);
    }
    const changeTab = ({detail}) => {
        tabs = detail;
    }
    const treeClick = ({detail}) => {
        if (detail.type == 'folder') return;
        if (detail.key == 'ssh') {
            addTab({id: detail.id, name: detail.name, close: false, config: detail, icon: detail.icon});
        } else if (detail.key == 'terminal') {
            addTab({id: detail.id, name: detail.name, close: false, type: 'terminal', path: detail.path, icon: detail.icon});
        }
    }
</script>

<style>
    .main {
        width: 100%;
        height: 100%;
        background: var(--background);
        color: var(--color);
    }

    .main > .content {
        --width: calc(100% - 50px);
        width: var(--width);
        top: 30px;
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
  --shadow: {theme.colors['widget.shadow']}">
    <TitleBar {theme} bind:msg/>
    <div class="monaco-progress-container" style="display: none;">
        <div class="progress-bit"
             style="background-color: {theme.colors['progressBar.background']};opacity:1;display:{mainLoading}"/>
    </div>
    <ActivityBar {theme} bind:msg/>
    <div class="content">
        <SplitBar>
            <div slot="left" style="width: 100%;height: 100%;">
                <ConfigPanel {theme} on:addSSH={treeClick} on:treeClick={treeClick}/>
            </div>
            <div slot="right" style="height: 100%;">
                <SplitBar center="left" width="150px">
                    <div slot="left" style="width: 100%;height: 100%;">
                        <TabContent {theme} bind:msg {tabs} {nowTab} on:changeTab={changeTab}/>
                    </div>
                    <div slot="right" style="height: 100%;">
                    </div>
                </SplitBar>
            </div>
        </SplitBar>
    </div>
    <StatusBar
            {theme}
            bind:msg
            on:toggleConsole={toggleConsole}
            on:toggleTerminal={toggleTerminal}/>
    <QuickInput {theme} bind:msg bind:show={quickShow}/>
    <Modal {theme}>
        <input type="text"><br/>
        <input type="text"><br/>
    </Modal>
</div>
