<script lang="ts">
    export let title;
    export let theme;
    export let msg;
    const win = require("electron").remote.getCurrentWindow();
    const {app, dialog} = require("electron").remote;
    let max = win.isMaximized();

    function toggleWin() {
        max = !max;
        if (win.isMaximized()) {
            win.restore();
        } else {
            win.maximize();
        }
    }

    function onResize() {
        if (win.isMaximized()) {
            max = true;
        } else {
            max = false;
        }
    }

    window.onresize = onResize;

    let system;
    let systemFlag = "none",
        fileFlag = "none",
        helpFlag = "none";
    window.onclick = function (event: MouseEvent) {
        const target: any = event.target;
        if (!target.matches(".menubar-menu-title")) {
            systemFlag = "none";
            fileFlag = "none";
            helpFlag = "none";
        }
    };

    function toggleSystem() {
        fileFlag = "none";
        helpFlag = "none";
        systemFlag = "block";
    }

    function toggleFile() {
        fileFlag = "block";
        helpFlag = "none";
        systemFlag = "none";
    }

    function toggleHelp() {
        fileFlag = "none";
        helpFlag = "block";
        systemFlag = "none";
    }

    function systemClick(type) {
        switch (type) {
            case "theme":
                break;
            case "console":
                win.webContents.openDevTools();
                break;
            default:
                break;
        }
    }
</script>

<style>
    .title-bar {
        width: 100%;
        height: 30px;
        padding: 0;
        line-height: 30px;
        justify-content: left;
        overflow: visible;
        box-sizing: border-box;
        flex-shrink: 0;
        align-items: center;
        display: flex;
        color: var(--title-bar-color);
        background: var(--title-bar-background);
        -webkit-user-select: none;
    }

    .titlebar-drag-region {
        top: 0;
        left: 0;
        display: block;
        position: absolute;
        width: 100%;
        height: 30px;
        z-index: -1;
        -webkit-app-region: drag;
    }

    .title-bar > .window-appicon {
        width: 35px;
        height: 100%;
        position: relative;
        background-image: url("../image/icon.svg");
        background-repeat: no-repeat;
        background-position: 50%;
        background-size: 16px;
        flex-shrink: 0;
    }

    .window-title {
        flex: 0 1 auto;
        font-size: 12px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        margin-left: auto;
        margin-right: auto;
        max-width: 50%;
        zoom: 1;
    }

    .menubar {
        display: flex;
        flex-shrink: 1;
        box-sizing: border-box;
        height: 30px;
        overflow: hidden;
        flex-wrap: wrap;
    }

    .menubar > .menubar-menu-button > .menu-content > .separator {
        height: 1px;
        margin-left: 4px;
        margin-right: 4px;
        background: var(--color);
    }

    .menubar > .menubar-menu-button {
        align-items: center;
        box-sizing: border-box;
        padding: 0 8px;
        cursor: default;
        -webkit-app-region: no-drag;
        zoom: 1;
        white-space: nowrap;
        outline: 0;
    }

    .menubar > .menubar-menu-button .menu-content {
        margin-left: -8px;
        position: absolute;
        min-width: 100px;
        box-shadow: 0px 1px 2px 0px var(--shadow);
        z-index: 3;
        background: var(--title-menu-background);
    }

    .menubar > .menubar-menu-button .menu-content div {
        color: var(--title-menu-color);
        padding: 0px 10px;
        text-decoration: none;
        display: block;
    }

    .menubar > .menubar-menu-button .menu-content > div:hover {
        background: var(--focus);
    }

    .menubar > .menubar-menu-button:hover {
        background-color: var(--focus);
    }

    .title-bar > .window-controls-container {
        display: flex;
        flex-grow: 0;
        flex-shrink: 0;
        text-align: center;
        position: relative;
        z-index: 3000;
        -webkit-app-region: no-drag;
        height: 100%;
        width: 138px;
        margin-left: auto;
    }

    .title-bar > .window-controls-container > .window-icon-bg {
        display: inline-block;
        -webkit-app-region: no-drag;
        height: 100%;
        width: 33.34%;
    }

    .title-bar > .window-controls-container > .window-icon-bg > .window-icon {
        height: 100%;
        width: 100%;
        background: var(--color);
    }

    .title-bar > .window-controls-container .window-minimize {
        -webkit-mask: url("data:image/svg+xml;charset=utf-8,%3Csvg width='11' height='11' viewBox='0 0 11 11' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 4.399V5.5H0V4.399h11z' fill='%23000'/%3E%3C/svg%3E") no-repeat 50% 50%;
    }

    .title-bar > .window-controls-container .window-maximize {
        -webkit-mask: url("data:image/svg+xml;charset=utf-8,%3Csvg width='11' height='11' viewBox='0 0 11 11' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 0v11H0V0h11zM9.899 1.101H1.1V9.9h8.8V1.1z' fill='%23000'/%3E%3C/svg%3E") no-repeat 50% 50%;
    }

    .title-bar > .window-controls-container .window-unmaximize {
        -webkit-mask: url("data:image/svg+xml;charset=utf-8,%3Csvg width='11' height='11' viewBox='0 0 11 11' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 8.798H8.798V11H0V2.202h2.202V0H11v8.798zm-3.298-5.5h-6.6v6.6h6.6v-6.6zM9.9 1.1H3.298v1.101h5.5v5.5h1.1v-6.6z' fill='%23000'/%3E%3C/svg%3E") no-repeat 50% 50%;
    }

    .title-bar > .window-controls-container .window-close {
        -webkit-mask: url("data:image/svg+xml;charset=utf-8,%3Csvg width='11' height='11' viewBox='0 0 11 11' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6.279 5.5L11 10.221l-.779.779L5.5 6.279.779 11 0 10.221 4.721 5.5 0 .779.779 0 5.5 4.721 10.221 0 11 .779 6.279 5.5z' fill='%23000'/%3E%3C/svg%3E") no-repeat 50% 50%;
    }

    .title-bar > .window-controls-container .window-icon-bg:hover {
        background-color: var(--focus);
    }

    .title-bar > .window-controls-container .window-close-bg:hover {
        background-color: red;
    }

    .title-bar
    > .window-controls-container
    > .window-close-bg
    > .window-icon:hover {
        background-color: white;
    }
</style>

<div
        class="title-bar"
        style="--title-bar-color: {theme.colors['titleBar.activeForeground']};
  --title-bar-background: {theme.colors['titleBar.activeBackground']};
  --title-menu-color: {theme.colors['menu.foreground']};
  --title-menu-background: {theme.colors['dropdown.background']};">
    <div class="window-appicon" style="-webkit-app-region: drag;"/>
    <div class="titlebar-drag-region"/>

    <div class="menubar" role="menubar" style="height: 30px;">
        <div class="menubar-menu-button">
            <div
                    class="menubar-menu-title"
                    role="none"
                    aria-hidden="true"
                    on:click={toggleSystem}>
                系统
            </div>
            <div class="menu-content" bind:this={system} style="display:{systemFlag};box-shadow: {theme.colors['widget.shadow']}">
                <div>设置</div>
                <div on:click={() => systemClick('theme')}>切换主题</div>
                <div on:click={() => systemClick('console')}>控制台</div>
                <div>系统日志</div>
                <div>操作历史</div>
                <div>更新日志</div>
                <div>重新登录</div>
                <div>停止loading</div>
                <div>重新启动</div>
                <div class="separator"/>
                <div on:click={() => win.close()}>退出</div>
            </div>
        </div>
        <div class="menubar-menu-button">
            <div
                    class="menubar-menu-title"
                    role="none"
                    aria-hidden="true"
                    on:click={toggleHelp}>
                帮助
            </div>
            <div class="menu-content" style="display:{helpFlag}">
                <div>Github</div>
                <div>教程</div>
                <div>文档</div>
                <div class="separator"/>
                <div>关于</div>
            </div>
        </div>
    </div>
    <div
            class="window-title"
            style="position: absolute; left: 50%; transform: translate(-50%, 0px);">
        欢迎使用 - 模拟终端
    </div>
    <div class="window-controls-container">
        <div class="window-icon-bg" on:click={() => win.minimize()}>
            <div
                    class="window-icon window-minimize"
                    style="background: {theme.colors['menu.foreground']};"/>
        </div>
        <div class="window-icon-bg" on:click={toggleWin}>
            <div
                    class="window-icon window-max-restore"
                    style="background: {theme.colors['menu.foreground']};"
                    class:window-maximize={!max}
                    class:window-unmaximize={max}/>
        </div>
        <div class="window-icon-bg window-close-bg" on:click={() => win.close()}>
            <div
                    class="window-icon window-close"
                    style="background: {theme.colors['menu.foreground']};"/>
        </div>
    </div>
</div>
