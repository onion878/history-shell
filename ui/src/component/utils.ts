export function isEmpty(val) {
    if (val !== undefined && val != null && (val + '').trim() !== '') return false; else return true;
}

export function validateData(data, ignore) {
    let index = 0;
    for (let k in data) {
        if (!(ignore && ignore[k])) {
            if (isEmpty(data[k])) {
                index++;
            }
        }
    }
    return index == 0;
}

const allTerminal = {};

export function addTerminal(id, terminal) {
    allTerminal[id] = terminal;
}

export function getTerminal(id) {
    return allTerminal[id];
}

export function closeTerminal(id) {
    allTerminal[id].destroy();
}