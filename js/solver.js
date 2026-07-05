export function isWordInDictionary(word, wordsList) {
    let low = 0;
    let high = wordsList.length - 1;
    const target = word.toLowerCase();
    while (low <= high) {
        let mid = Math.floor((low + high) / 2);
        let current = wordsList[mid].toLowerCase();
        if (current === target) {
            return true;
        }
        if (current < target) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return false;
}

export function hasPrefix(prefix, wordsList) {
    let low = 0;
    let high = wordsList.length - 1;
    const targetPrefix = prefix.toLowerCase();
    while (low <= high) {
        let mid = Math.floor((low + high) / 2);
        let current = wordsList[mid].toLowerCase();
        if (current.startsWith(targetPrefix)) {
            return true;
        }
        if (current < targetPrefix) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return false;
}

export function solveBoard(boardMatrix, wordsList, customMinLength) {
    const foundWords = new Set();
    const height = boardMatrix.length;
    if (height === 0) return [];
    const width = boardMatrix[0].length;
    const visited = Array.from({ length: height }, () => Array(width).fill(false));
    
    // Minimum word length
    let minLength;
    if (customMinLength && customMinLength !== 'auto') {
        minLength = parseInt(customMinLength, 10);
    } else {
        minLength = (width === 5) ? 4 : 3;
    }

    function dfs(r, c, currentString) {
        let letter = boardMatrix[r][c];
        
        let newString = currentString + letter;
        
        if (!hasPrefix(newString, wordsList)) {
            return;
        }

        if (newString.length >= minLength && isWordInDictionary(newString, wordsList)) {
            foundWords.add(newString.toLowerCase());
        }

        visited[r][c] = true;

        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                let nr = r + dr;
                let nc = c + dc;
                if (nr >= 0 && nr < height && nc >= 0 && nc < width && !visited[nr][nc]) {
                    dfs(nr, nc, newString);
                }
            }
        }

        visited[r][c] = false;
    }

    for (let r = 0; r < height; r++) {
        for (let c = 0; c < width; c++) {
            dfs(r, c, "");
        }
    }

    return Array.from(foundWords).sort();
}
