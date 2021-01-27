<script lang="ts">
    import {isDarwin} from "./utils";

    export let theme, panelType;
    import {createEventDispatcher} from "svelte";

    let darwinFlag = isDarwin();
    const dispatch = createEventDispatcher();
    const togglePanel = (type: string) => {
        panelType = type;
    };
</script>

<style>
    .activitybar {
        width: 50px;
        height: calc(100% - 22px);
        bottom: 0px;
        left: 0px;
        position: absolute;
    }

    .activitybar > .content {
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        font-size: 13px;
    }

    .actions-container {
        display: inline-block;
        margin: 0 auto;
        padding: 0;
        width: 100%;
        justify-content: flex-end;
    }

    .activitybar > .content .monaco-action-bar .action-item {
        display: block;
        position: relative;
        padding: 5px 0;
        outline: none;
    }

    .activitybar
    > .content
    .monaco-action-bar
    .action-item.checked
    > .action-label {
        color: var(--activity-focus);
    }

    .activitybar > .content .monaco-action-bar .action-label {
        display: flex;
        overflow: hidden;
        height: 40px;
        line-height: 40px;
        margin-right: 0;
        padding: 0 0 0 9px;
        box-sizing: border-box;
        font-size: 15px;
        cursor: pointer;
        font-size: 28px;
        font-family: 'Icofont';
        color: var(--activity-color);
    }

    .activitybar > .content .monaco-action-bar .action-label:hover {
        color: var(--activity-focus);
    }

    .activitybar .monaco-action-bar .action-label.config:before {
        content: '\eeff';
    }

    .activitybar .monaco-action-bar .action-label.explore:before {
        content: '\ec5b';
    }
</style>

<div
        class="activitybar"
        style="background: {theme.colors['activityBar.background']}; --activity-color:{theme.colors['activityBar.inactiveForeground']};--activity-focus: {theme.colors['activityBar.foreground']};top: {darwinFlag?'0':'30'}px;"
        role="navigation">
    <div class="content" style="width: 50px;">
        <div class="composite-bar">
            <div class="monaco-action-bar vertical">
                <ul
                        class="actions-container"
                        role="toolbar"
                        aria-label="活动视图切换器">
                    <li
                            class="action-item"
                            class:checked={panelType == 'config'}
                            role="button"
                            draggable="true"
                            tabindex="0"
                            title="配置"
                            on:click={() =>togglePanel('config')}>
                        <div class="action-label config"/>
                    </li>
                    <li
                            class="action-item"
                            class:checked={panelType == 'explore'}
                            role="button"
                            draggable="true"
                            tabindex="0"
                            title="文件管理器"
                            on:click={() =>togglePanel('explore')}>
                        <div class="action-label explore"/>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</div>
