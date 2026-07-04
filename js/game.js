export function createGameState() {
    return {
        word: '',
        neighbourArr: [],
        visitedArr: [],
        goodWords: [],
        badWords: [],
        gameOver: true,
        isPointerActive: false,
        suppressClick: false,
        isAutoSubmitEnabled: true,
        svgOverlay: null,
        polylinePoints: [],
        highScore: 0,
        totalPoints: 0
    };
}

export function getPointsForWord(word, getLetterCount) {
    const len = getLetterCount(word);
    if (len >= 8) return 11;
    if (len === 7) return 5;
    if (len === 6) return 3;
    if (len === 5) return 2;
    if (len === 4 || len === 3) return 1;
    return 0;
}

export function getLetterCount(word) {
    if (!word) return 0;
    let i = 0;
    let count = 0;
    while (i < word.length) {
        const ch = word.charAt(i);
        const next = i + 1 < word.length ? word.charAt(i + 1) : '';
        if ((ch === 'Q' || ch === 'q') && (next === 'u' || next === 'U')) {
            count += 2;
            i += 2;
        } else {
            count += 1;
            i += 1;
        }
    }
    return count;
}
