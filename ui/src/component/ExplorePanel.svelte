<script lang="ts">
    import SideBar from "./SideBar.svelte";
    import ListTree from "./ListTree.svelte";
    import ContextMenu from "./ContextMenu.svelte";
    import {bytesToSize, getFileInfo, getNow, getNowTerminal, openFolder} from "./utils";
    import Modal from "./Modal.svelte";

    const explore = require('./app/utils/explore');
    let Client = require('./app/utils/sftp'), sftpClient;
    export let theme, showTab;
    let showInfo = false, titleInfo: string, dataInfo = {};
    let loading = false, menuX, menuY, menuShow = false, nowItem, menu = [
        {name: '文件管理器中打开', key: 'openInFolder', icon: 'icofont-folder-open', show: showTab.type == "terminal"},
        {name: '进入目录', key: 'intoFolder', icon: 'icofont-hand-right'},
        {type: 'separator'},
        {name: '复制路径', key: 'copy', icon: 'icofont-ui-copy'},
        {name: '复制名称', key: 'copy-name', icon: 'icofont-copy'},
        {name: '属性', key: 'info', icon: 'icofont-info-circle', show: showTab.type == "terminal"},
    ];
    let tree = [], tools = [
        {key: 'newFolder', icon: 'icofont-ui-folder', title: '新建文件夹'},
        {key: 'newFile', icon: 'icofont-patient-file', title: '新建文件'},
        {key: 'refresh', icon: 'icofont-refresh', title: '刷新'},
        {key: 'upload', icon: 'icofont-upload-alt', title: '上传文件'},
        {key: 'download', icon: 'icofont-download', title: '下载文件'},
    ];
    if (showTab.type != "terminal") {
        sftpClient = new Client();
        sftpClient.init(showTab.config).then(() => {
            showTree(null);
        });
    }
    const showTree = (now) => {
        loading = true;
        if (showTab.type == "terminal") {
            explore.getData(now ? now.path : null).then(list => {
                if (now) {
                    now.children = list;
                    tree = [...tree];
                } else {
                    tree = list;
                }
                loading = false;
            });
        } else {
            sftpClient.getData(now ? now.path : null).then(list => {
                if (now) {
                    now.children = list;
                    tree = [...tree];
                } else {
                    tree = list;
                }
                loading = false;
            });
        }
    }
    showTree(null);
    const showChildren = (d) => {
        const {expanded, data}: any = d.detail;
        if (expanded) {
            showTree(data);
        } else {
        }
    }
    const toolClick = ({detail}) => {

    }
    const treeClick = ({detail}) => {
    }
    const menuClick = ({detail}) => {
        switch (detail.key) {
            case "openInFolder": {
                openFolder(nowItem.path);
                break;
            }
            case "intoFolder": {
                getNowTerminal().cdTargetFolder(nowItem.path);
                break;
            }
            case "copy": {
                navigator.clipboard.writeText(nowItem.path);
                break;
            }
            case "copy-name": {
                navigator.clipboard.writeText(nowItem.name);
                break;
            }
            case "info": {
                const info = getFileInfo(nowItem.path);
                const permString = '0' + (info.mode & parseInt('777', 8)).toString(8);
                dataInfo = {
                    atime: getNow(info.atime),
                    birthtime: getNow(info.birthtime),
                    mtime: getNow(info.mtime),
                    size: bytesToSize(info.size),
                    permission: permString
                };
                titleInfo = nowItem.name + '-属性';
                showInfo = true;
                break;
            }
            default:
                console.log('null');
        }
    }
    const treeRightClick = ({detail}) => {
        menuX = detail.x;
        menuY = detail.y;
        nowItem = detail.data;
        menuShow = !menuShow;
    }
</script>

<style>
    table {
        font-family: arial, sans-serif;
        border-collapse: collapse;
        width: 100%;
    }

    td, th {
        border: 1px solid var(--focus-border);
        text-align: left;
        padding: 8px;
    }

    tr:nth-child(even) {
        background-color: var(--focus);
    }
</style>

<SideBar bind:theme={theme} title="文件管理器" {tools} on:toolClick={toolClick}>
    <div class="monaco-progress-container">
        <div class="progress-bit"
             style="background-color: {theme.colors['progressBar.background']};opacity:1;display:{loading?'block':'none'}"/>
    </div>
    <div style="width: 100%;height: calc(100% - 2px);overflow: auto;">
        <ListTree bind:theme={theme} bind:data={tree} on:rightClick={treeRightClick} on:click={treeClick}
                  on:toggle={showChildren}/>
    </div>
</SideBar>
<ContextMenu bind:theme={theme} bind:data={menu} on:click={menuClick} bind:show={menuShow}
             bind:x={menuX} bind:y={menuY}
             width="150"/>
<Modal bind:show={showInfo} {theme} bind:title={titleInfo} width="300">
    <table>
        <tr>
            <th>访问时间</th>
            <th>{dataInfo.atime}</th>
        </tr>
        <tr>
            <td>创建时间</td>
            <td>{dataInfo.birthtime}</td>
        </tr>
        <tr>
            <td>修改时间</td>
            <td>{dataInfo.mtime}</td>
        </tr>
        <tr>
            <td>文件大小</td>
            <td>{dataInfo.size}</td>
        </tr>
        <tr>
            <td>文件权限</td>
            <td>{dataInfo.permission}</td>
        </tr>
    </table>
</Modal>