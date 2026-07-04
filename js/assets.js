export async function loadTextAsset(path) {
    const response = await fetch(path);
    if (!response.ok) {
        throw new Error(`Unable to load ${path}: ${response.status}`);
    }
    return response.text();
}

export async function loadGameAssets(boardPath, dictionaryPath) {
    const [boardText, dictionaryText] = await Promise.all([
        loadTextAsset(boardPath),
        loadTextAsset(dictionaryPath)
    ]);

    return {
        boardConfig: boardText
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
        dictionary: dictionaryText
            .split('\n')
            .map((item) => item.trim())
            .filter(Boolean)
    };
}
