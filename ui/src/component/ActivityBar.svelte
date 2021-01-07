<script>
  export let theme, msg;
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();
  let action = "";
  const toggleTemplate = () => {
    if (action == "template") {
      action = "";
    } else {
      action = "template";
    }
  };
  const toggleScript = () => {
    if (action == "script") {
      action = "";
    } else {
      action = "script";
    }
  };
</script>

<style>
  .activitybar {
    width: 50px;
    height: calc(100%-22px);
    top: 30px;
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
    background: var(--activity-focus);
  }

  .activitybar > .content .monaco-action-bar .action-label {
    display: flex;
    overflow: hidden;
    height: 40px;
    line-height: 40px;
    margin-right: 0;
    padding: 0 0 0 50px;
    box-sizing: border-box;
    font-size: 15px;
    cursor: pointer;
    background: var(--activity-color);
  }

  .activitybar > .content .monaco-action-bar .action-label:hover {
    background: var(--activity-focus);
  }

  .activitybar .monaco-action-bar .action-label.template {
    -webkit-mask: url("data:image/svg+xml;charset=utf-8,%3Csvg fill='none' height='28' viewBox='0 0 28 28' width='28' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M14.965 7H6.049S4 7.078 4 9v15s0 2 2.049 2l11.267-.004C19.364 26 19.364 24 19.364 24V12.509zm-1.746 2v5h4.097v10H6.049V9zm5.642-6h-8.699s-2.065.016-2.08 2h8.21v.454L20.317 10h1.095v12c2.048 0 2.048-1.995 2.048-1.995V8.648z' fill='%23fff'/%3E%3C/svg%3E")
      no-repeat 50% 50%;
  }

  .activitybar .monaco-action-bar .action-label.script {
    -webkit-mask: url("data:image/svg+xml;charset=utf-8,%3Csvg fill='none' height='28' viewBox='0 0 1024 1024' width='25' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M960 384l-128 128V320H192v448h384l-128 128H64V64h896v320z m-119.808 194.24l90.5088 90.5152L576 1024H486.4v-91.4048l353.792-354.3488z m45.216-45.2864l48.0832-48.1536L1024 575.3088l-48.0832 48.1536-90.5088-90.5088z' fill='%23fff'/%3E%3C/svg%3E")
      no-repeat 50% 50%;
  }
</style>

<div
  class="activitybar"
  style="background: {theme.colors['activityBar.background']}; --activity-color:
  {theme.colors['activityBar.inactiveForeground']};--activity-focus: {theme.colors['activityBar.foreground']};"
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
            class:checked={action == 'template'}
            role="button"
            draggable="true"
            tabindex="0"
            title="生成模板"
            on:click={toggleTemplate}>
            <div class="action-label template" />
          </li>
          <li
            class="action-item"
            class:checked={action == 'script'}
            role="button"
            draggable="true"
            tabindex="0"
            title="数据脚本"
            on:click={toggleScript}>
            <div class="action-label script" />
          </li>
        </ul>
      </div>
    </div>
  </div>
</div>
