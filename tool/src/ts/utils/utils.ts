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