export function getUniqueValues(values: string[]) {
    let visited: { [ name: string ]: boolean } = {};
    let result: string[] = [];
    for(let item of values) {
        if(!visited[item]) {
            result.push(item);
            visited[item] = true;
        }
    }
    return result;
}

export function isDistinctValues(values: string[]) {
    let visited: { [ name: string ]: boolean } = {};
    for(let item of values) {
        if(visited[item]) {
            return false;
        } else {
            visited[item] = true;
        }
    }
    return true;
}

export function isSameArray(a: string[], b: string[]) {
    return a.length == b.length && a.every((p, i) => b[i] == p);
}

export function isSubset(small: string[], large: string[]) {
    return small.every(a => large.indexOf(a) >= 0);
}