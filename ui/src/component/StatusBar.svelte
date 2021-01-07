<script>
  export let theme, msg;
  
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

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
  }

  .statusbar > .statusbar-item {
    display: inline-block;
    line-height: 22px;
    height: 100%;
    vertical-align: top;
    padding-left: 3px;
    padding-right: 3px;
    cursor: pointer;
  }

  .statusbar > .statusbar-item:hover {
    background: var(--focus);
  }

  .statusbar > .statusbar-item > .statusbar-item-console {
    float: left;
    width: 16px;
    height: 100%;
    background: var(--statusbar-color);
    -webkit-mask: url("data:image/svg+xml;charset=utf-8,%3Csvg width='11' height='11' viewBox='0 0 1024 1024' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M631.668364 0v320H930.909091V1024H93.090909V0h538.577455zM698.181818 0l232.727273 232.727273h-232.727273V0zM232.727273 418.909091v139.636364h232.727272V418.909091H232.727273z m-46.545455 279.272727v139.636364h605.090909v-139.636364H186.181818z' fill='%23000'/%3E%3C/svg%3E")
      no-repeat 50% 50%;
  }

  .statusbar > .statusbar-item > .statusbar-item-termianl {
    float: left;
    width: 16px;
    height: 100%;
    background: var(--statusbar-color);
    -webkit-mask: url("data:image/svg+xml;charset=utf-8,%3Csvg width='11' height='11' viewBox='0 0 1024 1024' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M928 256h-832v-59.136C96 158.848 126.848 128 164.928 128h694.144c38.08 0 68.928 30.912 68.928 68.928V256z m0 64v507.072c0 38.016-30.848 68.864-68.928 68.864H164.928A68.928 68.928 0 0 1 96 827.072V319.936h832zM431.232 562.688a31.872 31.872 0 0 0-7.552-12.096L333.12 460.16a32 32 0 1 0-45.248 45.248l72.128 72.128-69.376 69.44a32 32 0 0 0 45.248 45.248l90.496-90.496a32 32 0 0 0 4.864-39.04zM544 640a32 32 0 0 0 0 64h128a32 32 0 0 0 0-64h-128z' fill='%23000'/%3E%3C/svg%3E")
      no-repeat 50% 50%;
  }

  .statusbar > .status-msg {
    line-height: 22px;
    color: var(--statusbar-color);
    float: right;
    margin-right: 10px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: calc(100% - 160px);
  }
</style>

<div
  class="statusbar"
  style="background: {theme.colors['statusBar.background']}; --statusbar-color: {theme.colors['statusBar.foreground']};">
  <div class="statusbar-item" on:click={() => dispatch("toggleConsole")}>
    <div class="statusbar-item-console" />
    Console
  </div>
  <div class="statusbar-item" on:click={() => dispatch("toggleTerminal")}>
    <div class="statusbar-item-termianl" />
    Terminal
  </div>
  <div class="status-msg" title="{msg}">
    {msg}
  </div>
</div>
