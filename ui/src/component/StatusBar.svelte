<script lang="ts">
    export let theme, msg, statusList = [];
</script>

<style>
    .statusbar {
        color: var(--statusbar-color);
        box-sizing: border-box;
        cursor: default;
        width: 100%;
        height: 22px;
        font-size: 12px;
        position: absolute;
        bottom: 0px;
        -webkit-user-select: none;
        padding-left: 10px;
        padding-right: 10px;
    }

    .statusbar > .statusbar-item {
        display: inline-block;
        line-height: 22px;
        height: 100%;
        vertical-align: top;
        padding-left: 3px;
        padding-right: 3px;
        cursor: pointer;
        float: left;
        height: 100%;
        font-family: 'Icofont';
    }

    .statusbar > .statusbar-item:hover {
        background: var(--focus);
    }

    .statusbar > .status-msg {
        line-height: 22px;
        color: var(--statusbar-color);
        margin-right: 10px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
</style>

<div class="statusbar"
     style="background: {theme.colors['statusBar.background']}; --statusbar-color: {theme.colors['statusBar.foreground']};">
    {#each statusList as s, i}
        {#if s}
            <div class="statusbar-item" title="{s.title}">
                <i class="{s.icon}"></i>
                {s.name}
            </div>
        {/if}
    {/each}
    <div class="status-msg" title="{msg}">
        {msg}
    </div>
</div>
