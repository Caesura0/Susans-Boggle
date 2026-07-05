export async function loadTextAsset(path) {
    const candidates = [];
    
    // 1. Plain relative path (e.g. "dictionary.txt")
    candidates.push(path);
    
    // 2. Relative public path (e.g. "public/dictionary.txt")
    candidates.push(`public/${path}`);
    
    // 3. Absolute path (e.g. "/dictionary.txt")
    if (!path.startsWith('/')) {
        candidates.push(`/${path}`);
        candidates.push(`/public/${path}`);
    }
    
    // 4. Handle subdirectory without trailing slash (e.g., path is /Susans-Boggle, should resolve to /Susans-Boggle/dictionary.txt)
    if (typeof window !== 'undefined' && window.location) {
        const pathname = window.location.pathname;
        if (!pathname.endsWith('/')) {
            const lastSlash = pathname.lastIndexOf('/');
            const hasExtension = pathname.substring(lastSlash + 1).includes('.');
            if (hasExtension) {
                const dir = pathname.substring(0, lastSlash + 1);
                candidates.push(`${dir}${path}`);
                candidates.push(`${dir}public/${path}`);
            } else {
                candidates.push(`${pathname}/${path}`);
                candidates.push(`${pathname}/public/${path}`);
            }
        } else {
            candidates.push(`${pathname}${path}`);
            candidates.push(`${pathname}public/${path}`);
        }
    }
    
    // Filter duplicates
    const uniqueCandidates = [...new Set(candidates)];
    
    let lastError = null;
    for (const url of uniqueCandidates) {
        try {
            console.log(`Attempting to load asset from: ${url}`);
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Status ${response.status}`);
            }
            const text = await response.text();
            
            // Check if it's HTML (common redirect/fallback behavior)
            const trimmed = text.trim();
            if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html') || trimmed.startsWith('<DOCTYPE')) {
                throw new Error(`Returned HTML instead of plain text asset`);
            }
            
            console.log(`Successfully loaded asset from: ${url}`);
            return text;
        } catch (err) {
            console.warn(`Failed to load asset from ${url}: ${err.message}`);
            lastError = err;
        }
    }
    
    throw new Error(`Unable to load ${path}: ${lastError ? lastError.message : 'Unknown error'}`);
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
