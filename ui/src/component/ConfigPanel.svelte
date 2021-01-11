<script lang="ts">
    import {createEventDispatcher} from "svelte";
    import SideBar from './SideBar.svelte';
    import ListTree from './ListTree.svelte';
    import Modal from './Modal.svelte';
    import Input from './Input.svelte';
    import ContextMenu from './ContextMenu.svelte';
    import {validateData, isEmpty} from './utils';
    import {showConfirm, showError} from './dialog';

    export let theme;

    const dispatch = createEventDispatcher();
    let addFolderFlag = false, addSSHFlag = false;

    const config = require('./app/data/config-data');
    // tools
    let tools = [
        {key: 'group', icon: 'icofont-ui-folder', title: '新建文件夹'},
        {key: 'config', icon: 'icofont-database-add', title: '新建配置'},
        {key: 'refresh', icon: 'icofont-refresh', title: '刷新'},
        {key: 'expand', icon: 'icofont-rounded-expand', title: '展开全部'},
        {key: 'collapse', icon: 'icofont-rounded-collapse', title: '收缩全部'},
    ];
    // get all config tree data
    let tree = [];
    const getAllTree = () => {
        config.getAllData().then(data => {
            tree = data;
        });
    };
    getAllTree();
    const toggleAll = (list, flag) => {
        list.forEach(l => {
            if (l.type == 'folder') {
                l.expanded = flag;
                if (l.children.length > 0) {
                    toggleAll(l.children, flag);
                }
            }
        });
    };
    // tree data parent id
    let parentId;
    const toolClick = ({detail}) => {
        if (detail.key == 'group') {
            parentId = null;
            addFolderFlag = !addFolderFlag;
        } else if (detail.key == 'config') {
            parentId = null;
            addSSHFlag = !addSSHFlag;
        } else if (detail.key == 'refresh') {
            getAllTree();
        } else if (detail.key == 'expand') {
            toggleAll(tree, true);
            tree = [...tree];
        } else {
            toggleAll(tree, false);
            tree = [...tree];
        }
    }
    // new group config
    let groupName = '', groupId;
    const saveGroup = () => {
        if (isEmpty(groupName)) {
            showError("请输入名称!");
            return;
        }
        addFolderFlag = false;
        config.insert(groupId, {
            type: 'folder',
            key: 'folder',
            parentId: parentId,
            name: groupName
        }).then(() => getAllTree());
        groupName = '';
    }
    // new ssh config
    let editData = {name: null, host: null, port: 22, username: null, password: null};
    const saveSSH = () => {
        if (!validateData(editData, {parentId: true, children: true, icon: true, id: true})) {
            showError("请填写完所有数据!");
            return;
        }
        addSSHFlag = false;
        config.insert(editData.id, {
            type: 'file',
            key: 'ssh',
            parentId: parentId, ...editData
        }).then(() => getAllTree());
        dispatch('addSSH', editData);
        editData = {name: null, host: null, port: 22, username: null, password: null};
    }
    // tree right click
    let menuX, menuY, menuShow = false, nowItem;
    let menu = [
        {name: '新建组', key: 'group', icon: 'icofont-ui-folder'},
        {name: '新建SSH配置', key: 'config', icon: 'icofont-database-add'},
        {type: 'separator'},
        {name: '复制', key: 'copy', icon: 'icofont-ui-copy'},
        {name: '编辑', key: 'edit', icon: 'icofont-ui-edit'},
        {name: '删除', key: 'delete', icon: 'icofont-ui-delete'},
    ];
    const treeRightClick = ({detail}) => {
        menuX = detail.x;
        menuY = detail.y;
        menuShow = !menuShow;
        nowItem = detail.data;
    }
    const getListId = (item) => {
        let list = [];
        list.push(item.id);
        if (item.type == 'folder') {
            item.children.forEach(l => {
                list = list.concat(getListId(l));
            });
        }
        return list;
    }
    const menuClick = ({detail}) => {
        if (detail.key == 'group') {
            parentId = nowItem.id;
            addFolderFlag = !addFolderFlag;
        } else if (detail.key == 'config') {
            parentId = nowItem.id;
            addSSHFlag = !addSSHFlag;
        } else if (detail.key == 'copy') {
            parentId = nowItem.parentId;
            if (nowItem.type == 'folder') {
                groupId = null;
                groupName = nowItem.name;
                addFolderFlag = !addFolderFlag;
            } else {
                editData = nowItem;
                editData.id = null;
                addSSHFlag = !addSSHFlag;
            }
        } else if (detail.key == 'edit') {
            parentId = nowItem.parentId;
            if (nowItem.type == 'folder') {
                groupId = nowItem.id;
                groupName = nowItem.name;
                addFolderFlag = !addFolderFlag;
            } else {
                editData = nowItem;
                addSSHFlag = !addSSHFlag;
            }
        } else {
            showConfirm(`确认删除[${nowItem.name}]吗?`).then(({response}) => {
                if (response === 1) {
                    config.deleteByIdList(getListId(nowItem)).then(() => getAllTree());
                }
            })
        }
    }
    // return list tree click func
    const treeClick = ({detail}) => {
        dispatch('treeClick', detail);
    }
</script>
<style>

</style>

<SideBar bind:theme={theme} title="所有配置" {tools} on:toolClick={toolClick}>
    <ListTree bind:theme={theme} bind:data={tree} on:rightClick={treeRightClick} on:click={treeClick}/>
</SideBar>
<ContextMenu bind:theme={theme} bind:data={menu} on:click={menuClick} bind:show={menuShow} bind:x={menuX} bind:y={menuY}
             width="120"/>
<Modal bind:theme={theme} bind:show={addFolderFlag} title="新建组" on:save={saveGroup}>
    <Input bind:theme={theme} placeholder="名称" bind:value={groupName}/>
</Modal>
<Modal bind:theme={theme} bind:show={addSSHFlag} title="新建SSH连接" on:save={saveSSH}>
    <Input bind:theme={theme} placeholder="名称" bind:value={editData.name}/>
    <Input bind:theme={theme} placeholder="主机" bind:value={editData.host}/>
    <Input bind:theme={theme} placeholder="端口" bind:value={editData.port}/>
    <Input bind:theme={theme} placeholder="用户名" bind:value={editData.username}/>
    <Input bind:theme={theme} placeholder="密码" type="password" bind:value={editData.password}/>
</Modal>