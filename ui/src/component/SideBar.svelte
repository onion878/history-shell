<script>
  export let theme, msg;
  console.log(theme);
  let show = false,
    toolFocus = false,
    expanded = false,
    active = "";
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
    padding-left: 20px;
    overflow: hidden;
    display: flex;
    cursor: pointer;
    background-position: 2px;
    background-repeat: no-repeat;
    background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M10.072 8l-4.357 4.357.618.619L11 8.309v-.618L6.333 3.024l-.618.619L10.072 8z' fill='%23424242'/%3E%3C/svg%3E");
  }

  .panel > .panel-header.dark {
    background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M10.072 8l-4.357 4.357.618.619L11 8.309v-.618L6.333 3.024l-.618.619L10.072 8z' fill='%23C5C5C5'/%3E%3C/svg%3E");
  }

  .panel > .panel-header.expanded {
    background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M7.976 10.072l4.357-4.357.62.618L8.284 11h-.618L3 6.333l.619-.618 4.357 4.357z' fill='%23424242'/%3E%3C/svg%3E");
  }

  .panel > .panel-header.dark.expanded {
    background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M7.976 10.072l4.357-4.357.62.618L8.284 11h-.618L3 6.333l.619-.618 4.357 4.357z' fill='%23C5C5C5'/%3E%3C/svg%3E");
  }

  .panel > .panel-header h3.title {
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    font-size: 11px;
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
    transition: transform 50ms ease;
    position: relative;
  }

  .monaco-action-bar .action-item.active {
    transform: scale(1.27);
  }

  .panel > .panel-header > .actions .action-label.icon {
    width: 24px;
    height: 22px;
    background-size: 16px;
    background-position: 50%;
    background-repeat: no-repeat;
    margin-right: 0;
    padding-right: 12px;
    padding-left: 12px;
  }

  .panel
    > .panel-header
    > .actions
    .action-label.icon.explorer-action.new-file {
    background: url("data:image/svg+xml;charset=utf-8,%3Csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M7 3H4V0H3v3H0v1h3v3h1V4h3V3zm6.9 1.6l-3.4-3.5-.3-.1H5v1h4v4h4v7H4V8H3v5.5l.5.5h10l.5-.5V5l-.1-.4zm-.997.4L10 2v3h2.903z' fill='%23424242'/%3E%3C/svg%3E")
      50% no-repeat;
  }

  .panel
    > .panel-header.dark
    > .actions
    .action-label.icon.explorer-action.new-file {
    background: url("data:image/svg+xml;charset=utf-8,%3Csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M7 3H4V0H3v3H0v1h3v3h1V4h3V3zm6.9 1.6l-3.4-3.5-.3-.1H5v1h4v4h4v7H4V8H3v5.5l.5.5h10l.5-.5V5l-.1-.4zm-.997.4L10 2v3h2.903z' fill='%23C5C5C5'/%3E%3C/svg%3E")
      50% no-repeat;
  }

  .panel
    > .panel-header
    > .actions
    .action-label.icon.explorer-action.new-folder {
    background: url("data:image/svg+xml;charset=utf-8,%3Csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M7 3H4V0H3v3H0v1h3v3h1V4h3V3zM5.5 7H5V6h.3l.8-.9.4-.1H14V4H8V3h6.5l.5.5v10l-.5.5h-13l-.5-.5V5h1v8h12V6H6.7l-.8.9-.4.1z' fill='%23424242'/%3E%3C/svg%3E")
      50% no-repeat;
  }

  .panel
    > .panel-header.dark
    > .actions
    .action-label.icon.explorer-action.new-folder {
    background: url("data:image/svg+xml;charset=utf-8,%3Csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M7 3H4V0H3v3H0v1h3v3h1V4h3V3zM5.5 7H5V6h.3l.8-.9.4-.1H14V4H8V3h6.5l.5.5v10l-.5.5h-13l-.5-.5V5h1v8h12V6H6.7l-.8.9-.4.1z' fill='%23C5C5C5'/%3E%3C/svg%3E")
      50% no-repeat;
  }

  .panel
    > .panel-header
    > .actions
    .action-label.icon.explorer-action.refresh-explorer {
    background: url("data:image/svg+xml;charset=utf-8,%3Csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M5.563 2.516A6.001 6.001 0 0 0 8 14 6 6 0 0 0 9.832 2.285l-.302.953A5.002 5.002 0 0 1 8 13a5 5 0 0 1-2.88-9.088l.443-1.396z' fill='%23424242'/%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M5 3H2V2h3.5l.5.5V6H5V3z' fill='%23424242'/%3E%3C/svg%3E")
      50% no-repeat;
  }

  .panel
    > .panel-header.dark
    > .actions
    .action-label.icon.explorer-action.refresh-explorer {
    background: url("data:image/svg+xml;charset=utf-8,%3Csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M5.563 2.516A6.001 6.001 0 0 0 8 14 6 6 0 0 0 9.832 2.285l-.302.953A5.002 5.002 0 0 1 8 13a5 5 0 0 1-2.88-9.088l.443-1.396z' fill='%23C5C5C5'/%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M5 3H2V2h3.5l.5.5V6H5V3z' fill='%23C5C5C5'/%3E%3C/svg%3E")
      50% no-repeat;
  }

  .panel
    > .panel-header
    > .actions
    .action-label.icon.explorer-action.collapse-explorer {
    background: url("data:image/svg+xml;charset=utf-8,%3Csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M9 9H4v1h5V9z' fill='%23424242'/%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M5 3l1-1h7l1 1v7l-1 1h-2v2l-1 1H3l-1-1V6l1-1h2V3zm1 2h4l1 1v4h2V3H6v2zm4 1H3v7h7V6z' fill='%23424242'/%3E%3C/svg%3E")
      50% no-repeat;
  }

  .panel
    > .panel-header.dark
    > .actions
    .action-label.icon.explorer-action.collapse-explorer {
    background: url("data:image/svg+xml;charset=utf-8,%3Csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M9 9H4v1h5V9z' fill='%23C5C5C5'/%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M5 3l1-1h7l1 1v7l-1 1h-2v2l-1 1H3l-1-1V6l1-1h2V3zm1 2h4l1 1v4h2V3H6v2zm4 1H3v7h7V6z' fill='%23C5C5C5'/%3E%3C/svg%3E")
      50% no-repeat;
  }
</style>

<div
  class="sidebar"
  style="background: {theme.colors['sideBar.background']}; color: {theme.colors['sideBar.foreground']};">
  <div class="composite title">
    <div class="title-label">
      <h2 title="文件管理">文件浏览器</h2>
    </div>
  </div>
  <div class="content">
    <div class="panel">
      <div
        class="panel-header expanded"
        class:dark={theme['theme'] == 'vs-dark'}
        class:expanded
        tabindex="0"
        role="toolbar"
        aria-label="文件资源管理器部分"
        aria-expanded="true"
        draggable="true"
        style="background-color: {theme.colors['panel.background']};height:
        22px; line-height: 22px;"
        on:click={() => {
          if (!toolFocus) {
            expanded = !expanded;
          }
        }}
        on:mouseover={() => (show = true)}
        on:mouseout={() => (show = false)}>
        <h3 class="title" title="demo">172.17.0.1</h3>
        <div class="actions" style="flex: 1;display: {show ? 'block' : 'none'}">
          <div class="monaco-toolbar">
            <div class="monaco-action-bar animated">
              <ul
                class="actions-container"
                role="toolbar"
                aria-label="demo操作">
                <li
                  on:mouseout={() => (toolFocus = false)}
                  on:mouseover={() => (toolFocus = true)}
                  class="action-item"
                  role="presentation"
                  class:active={active == 'new-file'}>
                  <i
                    on:mouseup={() => (active = '')}
                    on:mousedown={() => (active = 'new-file')}
                    class="action-label icon explorer-action new-file"
                    role="button"
                    title="新建模板" />
                </li>
                <li
                  on:mouseout={() => (toolFocus = false)}
                  on:mouseover={() => (toolFocus = true)}
                  class="action-item"
                  role="presentation"
                  class:active={active == 'new-folder'}>
                  <i
                    on:mouseup={() => (active = '')}
                    on:mousedown={() => (active = 'new-folder')}
                    class="action-label icon explorer-action new-folder"
                    role="button"
                    title="新建模板文件夹" />
                </li>
                <li
                  on:mouseout={() => (toolFocus = false)}
                  on:mouseover={() => (toolFocus = true)}
                  class="action-item"
                  role="presentation"
                  class:active={active == 'refresh-explorer'}>
                  <i
                    on:mouseup={() => (active = '')}
                    on:mousedown={() => (active = 'refresh-explorer')}
                    class="action-label icon explorer-action refresh-explorer"
                    role="button"
                    title="刷新模板" />
                </li>
                <li
                  on:mouseout={() => (toolFocus = false)}
                  on:mouseover={() => (toolFocus = true)}
                  class="action-item"
                  role="presentation"
                  class:active={active == 'collapse-explorer'}>
                  <i
                    on:mouseup={() => (active = '')}
                    on:mousedown={() => (active = 'collapse-explorer')}
                    class="action-label icon explorer-action collapse-explorer"
                    role="button"
                    title="折叠模板文件夹" />
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
