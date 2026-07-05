import { loadGameAssets } from './assets.js';
import { createGameState, getLetterCount, getPointsForWord as getWordPoints } from './game.js';
import { Board } from './board.js';
import { solveBoard } from './solver.js';

(function () {
    
    var initTheme = function() {
        var currentTheme = window.localStorage.getItem('boggleTheme') || 'dark';
        var iconEl = document.querySelector('.theme-icon');
        if (currentTheme === 'light') {
            document.body.classList.add('light-theme');
            if (iconEl) iconEl.textContent = '☀️';
        } else {
            document.body.classList.remove('light-theme');
            if (iconEl) iconEl.textContent = '🌙';
        }
    };

    var toggleTheme = function() {
        var iconEl = document.querySelector('.theme-icon');
        if (document.body.classList.contains('light-theme')) {
            document.body.classList.remove('light-theme');
            if (iconEl) iconEl.textContent = '🌙';
            window.localStorage.setItem('boggleTheme', 'dark');
        } else {
            document.body.classList.add('light-theme');
            if (iconEl) iconEl.textContent = '☀️';
            window.localStorage.setItem('boggleTheme', 'light');
        }
    };

    var getMinWordLength = function() {
        var minLen = window.localStorage.getItem('boggleMinWordLen') || 'auto';
        if (minLen !== 'auto') {
            return parseInt(minLen, 10);
        }
        return (BOGGLE_CONFIG.BOARD_WIDTH === 5) ? 4 : 3;
    };

    var loadSettings = function() {
        var savedDuration = window.localStorage.getItem('boggleGameDuration');
        if (savedDuration !== null) {
            BOGGLE_CONFIG.GAME_TIME = parseInt(savedDuration, 10);
        }
        
        var selectDur = document.getElementById('game-duration');
        if (selectDur) {
            selectDur.value = BOGGLE_CONFIG.GAME_TIME.toString();
        }
        
        var selectLen = document.getElementById('min-word-len');
        if (selectLen) {
            selectLen.value = window.localStorage.getItem('boggleMinWordLen') || 'auto';
        }
    };

    var loadPlayerStats = function() {
        var defaultStats = {
            gamesPlayed: 0,
            totalPoints: 0,
            longestWord: "",
            highScores: []
        };
        var statsStr = window.localStorage.getItem('bogglePlayerStats');
        if (statsStr) {
            try {
                return JSON.parse(statsStr);
            } catch {
                // Ignore parsing errors and return default stats
                return defaultStats;
            }
        }
        return defaultStats;
    };

    var savePlayerStats = function(stats) {
        window.localStorage.setItem('bogglePlayerStats', JSON.stringify(stats));
    };

    var recordGameStats = function(score, grid) {
        if (!boardObj || !boardObj.canvasMatrix || boardObj.canvasMatrix.length === 0) {
            return;
        }

        var stats = loadPlayerStats();
        
        stats.gamesPlayed += 1;
        stats.totalPoints += score;

        var currentLongest = stats.longestWord || "";
        goodWords.forEach(function(word) {
            if (word.length > currentLongest.length) {
                currentLongest = word;
            }
        });
        stats.longestWord = currentLongest;

        var dateStr = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' });
        stats.highScores.push({
            score: score,
            grid: grid,
            date: dateStr
        });

        stats.highScores.sort(function(a, b) {
            return b.score - a.score;
        });
        stats.highScores = stats.highScores.slice(0, 5);

        savePlayerStats(stats);
    };

    var renderPlayerStats = function() {
        var stats = loadPlayerStats();
        
        document.getElementById('stats-played').textContent = stats.gamesPlayed;
        
        var avg = stats.gamesPlayed > 0 ? Math.round(stats.totalPoints / stats.gamesPlayed) : 0;
        document.getElementById('stats-avg').textContent = avg;
        
        document.getElementById('stats-longest').textContent = stats.longestWord ? stats.longestWord.toUpperCase() : '-';

        var rowsContainer = document.getElementById('leaderboard-rows');
        if (rowsContainer) {
            rowsContainer.innerHTML = '';
            
            for (var i = 0; i < 5; i++) {
                var entry = stats.highScores[i];
                var tr = document.createElement('tr');
                
                if (entry) {
                    tr.innerHTML = '<td>' + (i + 1) + '</td>' +
                                   '<td>' + entry.score + '</td>' +
                                   '<td>' + entry.grid + '</td>' +
                                   '<td>' + entry.date + '</td>';
                } else {
                    tr.innerHTML = '<td>' + (i + 1) + '</td><td>-</td><td>-</td><td>-</td>';
                }
                rowsContainer.appendChild(tr);
            }
        }
    };

    initTheme();
    
    var BOGGLE_CONFIG = {
        BOARD_WIDTH : 4,
        BOARD_HEIGHT : 4,
        BOARD_CONFIG_FILE_PATH : 'TestBoard.txt',
        DICTIONARY_FILE_PATH : 'dictionary.txt',
        GAME_TIME : 120,
        USE_RANDOM_BOARD : false,
        BOGGLE_DICE : [
            'AAEEGN', 'ABBJOO', 'ACHOPS', 'AFFKPS',
            'AOOTTW', 'CIMOTU', 'DEILRX', 'DELRVY',
            'DISTTY', 'EEGHNW', 'EEINSU', 'EHRTVW',
            'EIOSST', 'ELRTTY', 'HIMNQU', 'HLNNRZ'
        ],
        BOGGLE_5X5_DICE : [
            'AAAFRS', 'AAEEEE', 'AAFIRS', 'ADENNN', 'AEEEEM',
            'AEEGMU', 'AEGMNN', 'AFIRSY', 'BJKQXZ', 'CCNWUT',
            'CEIILT', 'CEILPT', 'CEIPST', 'DDLNOR', 'DDHNOT',
            'DHHLOR', 'DHLNOR', 'EIIITT', 'EMOTTT', 'ENSSSU',
            'FIPRSY', 'GORRVW', 'HIPRRY', 'NOOTUW', 'OOOTUW'
        ]
    };

    var boardObj,
        word = '',
        wordsList = [],
        boardConf = [],
        neigbourArr = [],
        visitedArr = [],
        goodWords = [],
        badWords = [],
        timeinterval,
        gameOver = true,
        isPointerActive = false,
        suppressClick = false,
        isAutoSubmitEnabled = true,
        svgOverlay = null,
        polylinePoints = [];
    const state = createGameState();

    var getStoredHighScore = function() {
        var stored = window.localStorage.getItem('boggleHighScore');
        return stored ? parseInt(stored, 10) : 0;
    };

    var setStoredHighScore = function(score) {
        state.highScore = score;
        window.localStorage.setItem('boggleHighScore', score);
    };

    var updateScoreDisplay = function() {
        document.getElementById('points').textContent = state.totalPoints + ' Point(s)';
    };

    var updateHighScoreDisplay = function() {
        document.getElementById('high-score').textContent = 'High Score: ' + state.highScore;
    };

    var getPointsForWord = function(w) {
        return getWordPoints(w, getLetterCount);
    };

    var shuffleArray = function(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            let temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
        return arr;
    };

    var generateRandomBoard = function() {
        let dice;
        if (BOGGLE_CONFIG.BOARD_WIDTH === 5) {
            dice = BOGGLE_CONFIG.BOGGLE_5X5_DICE.slice();
        } else {
            dice = BOGGLE_CONFIG.BOGGLE_DICE.slice();
        }
        shuffleArray(dice);
        let letters = [];
        let cellCount = BOGGLE_CONFIG.BOARD_WIDTH * BOGGLE_CONFIG.BOARD_HEIGHT;
        for (let i = 0; i < cellCount; i++) {
            let faces = dice[i];
            let face = faces[Math.floor(Math.random() * faces.length)];
            // In classic Boggle the 'Q' face is displayed as 'Qu'
            if (face === 'Q') face = 'Qu';
            letters.push(face);
        }
        return letters;
    };

    var clearBoard = function() {
        let boardContainer = document.getElementById('board');
        boardContainer.innerHTML = '';
    };

    var bindBoardTiles = function() {
        var colNode = document.getElementsByClassName("col");
        for (let i = 0; i < colNode.length; i++) {
            colNode[i].addEventListener('click', onTileClick, false);
        }
    };

    var resetTurn = function () {
        word = '';
        neigbourArr = [];
        visitedArr = [];

        document.getElementById('entered').value = '';
        let selectedEls = document.getElementsByClassName('selected');
        while (selectedEls.length > 0) {
            selectedEls[0].classList.remove('selected');
        }
    };


    var loadAssets = async function () {
        try {
            const assets = await loadGameAssets(BOGGLE_CONFIG.BOARD_CONFIG_FILE_PATH, BOGGLE_CONFIG.DICTIONARY_FILE_PATH);
            wordsList = assets.dictionary;
            boardConf = assets.boardConfig;
        } catch {
            document.getElementById('error-msg').textContent = 'Unable to load game assets.';
        }
    };

    var onTileClick = function (event) {
        if (suppressClick || isPointerActive) return; // ignore click when drawing with pointer
        //if it is an active neighbor
        //clear the array push 8 neighbor in an array after checking boundary condition and visited node
        //make only 8 neighbour to active state all other tiles are disabled (we can check i, j at the beigining)
        //create an word string outside and push the letter to it

        let el = event.target,
            x = parseInt(el.dataset.i),
            y = parseInt(el.dataset.j);
        document.getElementById('error-msg').textContent = '';

        if (gameOver) {
            alert('Start a New Game By Clicking Start Game Button');
            return;
        }

        var isValidClick = function (x, y, neigbourArr, visitedArr) {
            let isValid = false;
            for (let p = 0; p < neigbourArr.length; p++) {
                if (neigbourArr[p][0] === x && neigbourArr[p][1] === y) {
                    isValid = true;
                    break;
                }
            }

            for (let p = 0; p < visitedArr.length; p++) {
                if (visitedArr[p][0] === x && visitedArr[p][1] === y) {
                    isValid = false;
                    break;
                }
            }
            return isValid;
        };

        if (neigbourArr.length === 0 || isValidClick(x, y, neigbourArr, visitedArr)) {
            //check boundary
            neigbourArr = [];
            // x = parseInt(x); y = parseInt(y);
            neigbourArr.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1], [x + 1, y - 1], [x + 1, y + 1], [x - 1, y + 1], [x - 1, y - 1]);
            word += el.textContent;
            visitedArr.push([x, y]);

            console.log("Valid Click");
            console.log(word);


            el.classList.add('selected');

        }

        //if clicked on same element
        else if (visitedArr[visitedArr.length - 1][0] === x && visitedArr[visitedArr.length - 1][1] === y) {
            neigbourArr = [];
            visitedArr.splice(-1, 1);
            if (visitedArr.length > 0) {
                x = visitedArr[visitedArr.length - 1][0];
                y = visitedArr[visitedArr.length - 1][1];
                neigbourArr.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1], [x + 1, y - 1], [x + 1, y + 1], [x - 1, y + 1], [x - 1, y - 1]);
            }
            word = word.slice(0, -1);

            console.log("same Click");
            console.log(word);

            if (event.target.classList.contains('selected')) {
                event.target.classList.toggle('selected');
            }
        }
        document.getElementById('entered').value = word;
    };

    var onAddWord = function () {
        let liEl = document.createElement('li');
        let wordText;
        let wordsContainer;
        document.getElementById('error-msg').textContent = '';
        word = document.getElementById('entered').value; //If users chose to enter a word from keyboard

        if (gameOver) {
            alert('Start a New Game');
            return;
        }
        if (word.length === 0) {
            return;
        }

        word = word.toString().toLowerCase();//added toString just to safeguard beacuse we are accepting input from user
        
        var minLen = getMinWordLength();
        if (word.length < minLen) {
            document.getElementById('error-msg').textContent = 'Word must be at least ' + minLen + ' letters';
            return;
        }

        if(boardObj.find(word)) {
            document.getElementById('error-msg').textContent = 'Word found in the board';
            
            if (validateWord()) {
                if (goodWords.indexOf(word) > -1) {
                    //word already selected
                    document.getElementById('error-msg').textContent = 'word already added';
                } else {
                        // good word
                        goodWords.push(word);
                        wordText = document.createTextNode(word);
                        wordsContainer = document.getElementById('right-list');
                        // compute points for the word and update totals
                        var pts = getPointsForWord(word);
                        state.totalPoints += pts;
                        updateScoreDisplay();
                        if (state.totalPoints > state.highScore) {
                            setStoredHighScore(state.totalPoints);
                            updateHighScoreDisplay();
                        }
                        liEl.setAttribute('title', 'Word is present in the board and in dictionary');
                        liEl.appendChild(wordText);
                        wordsContainer.appendChild(liEl);
                }
            } else {
                //word found in board but not in dict -- bad word
                badWords.push(word);
                wordText = document.createTextNode(word);
                wordsContainer = document.getElementById('wrong-list');
                liEl.setAttribute('title', 'Word is present in the board but not in dictionary');
                liEl.appendChild(wordText);
                wordsContainer.appendChild(liEl);
            }
        } else {
            //Word not found in board -- bad word
            badWords.push(word);
            wordText = document.createTextNode(word);
            wordsContainer = document.getElementById('wrong-list');
            liEl.className = 'not-board-word';
            liEl.setAttribute('title', 'Word is not present in the board');
            liEl.appendChild(wordText);
            wordsContainer.appendChild(liEl);
        }

        resetTurn();

    };

    var validateWord = function () {
        var indices = [];
        for (let i = 0; i < word.length; i++) {
            if (word[i] === '*')
                indices.push(i);
        }
        if (indices.length === 0 && wordsList.indexOf(word.toLowerCase()) > -1) {
            console.log('word is there');
            return true;
        }

        for (let i = wordsList.length - 1; i >= 0; i--) {
            if (wordsList[i].length === word.length) {
                let equal = true;
                //each word
                for (let j = word.length - 1; j >= 0; j--) {
                    if (indices.indexOf(j) === -1) {
                        if (word[j].toLowerCase() !== wordsList[i][j].toLowerCase()) {
                            equal = false;
                            break; //not match
                        }
                    }
                }
                if (equal) {
                    console.log('word found, the word is - ' + wordsList[i]);
                    word = wordsList[i]; //May be dangerous need to check
                    return equal;
                }

            }
        }
        console.log('word is not present');
        return false;
    };

    var onAddWordWrapper = function () {
        var enteredWord = document.getElementById('entered').value;
        document.getElementById('error-msg').textContent = '';
        if (/^[a-zA-Z*]+$/.test(enteredWord)) {
            onAddWord();
        } else {
            document.getElementById('error-msg').textContent = 'Oops! Word can contain only alphabets and asterisk (*)';
        }
    };

    var bindEvents = function () {
        document.getElementById('add-word').onclick = onAddWordWrapper;
        document.getElementById('start-game').onclick = onStartGame;
        document.getElementById('reset-turn').onclick = resetTurn;
        
        var themeToggleBtn = document.getElementById('theme-toggle');
        if (themeToggleBtn) {
            themeToggleBtn.onclick = toggleTheme;
        }

        var inputWordBox = document.getElementById("entered");
        var autoSubmitToggle = document.getElementById('auto-submit-toggle');
        var randomBoardBtn = document.getElementById('random-board');

        if (autoSubmitToggle) {
            autoSubmitToggle.checked = isAutoSubmitEnabled;
            autoSubmitToggle.addEventListener('change', function () {
                isAutoSubmitEnabled = this.checked;
            });
        }

        if (randomBoardBtn) {
            randomBoardBtn.addEventListener('click', function () {
                createBoard(true);
                resetTurn();
            }, false);
        }

        var gridSizeSelect = document.getElementById('grid-size-select');
        if (gridSizeSelect) {
            gridSizeSelect.addEventListener('change', function () {
                var size = parseInt(this.value, 10);
                BOGGLE_CONFIG.BOARD_WIDTH = size;
                BOGGLE_CONFIG.BOARD_HEIGHT = size;
                createBoard(true);
                resetTurn();
                updateGameStateUI();
            });
        }

        var settingsBtn = document.getElementById('settings-btn');
        var settingsModal = document.getElementById('settings-modal');
        var closeSettingsBtn = document.getElementById('close-settings');
        var saveSettingsBtn = document.getElementById('save-settings');

        if (settingsBtn && settingsModal) {
            settingsBtn.onclick = function() {
                var selectDur = document.getElementById('game-duration');
                if (selectDur) selectDur.value = BOGGLE_CONFIG.GAME_TIME.toString();
                var selectLen = document.getElementById('min-word-len');
                if (selectLen) selectLen.value = window.localStorage.getItem('boggleMinWordLen') || 'auto';
                
                settingsModal.classList.add('open');
            };
        }

        if (closeSettingsBtn && settingsModal) {
            closeSettingsBtn.onclick = function() {
                settingsModal.classList.remove('open');
            };
        }

        if (settingsModal) {
            settingsModal.onclick = function(event) {
                if (event.target === settingsModal) {
                    settingsModal.classList.remove('open');
                }
            };
        }

        if (saveSettingsBtn && settingsModal) {
            saveSettingsBtn.onclick = function() {
                var selectDur = document.getElementById('game-duration');
                var selectLen = document.getElementById('min-word-len');
                
                var newDuration = selectDur ? parseInt(selectDur.value, 10) : 120;
                var newMinLen = selectLen ? selectLen.value : 'auto';
                
                window.localStorage.setItem('boggleGameDuration', newDuration);
                window.localStorage.setItem('boggleMinWordLen', newMinLen);
                
                BOGGLE_CONFIG.GAME_TIME = newDuration;
                
                settingsModal.classList.remove('open');
                
                if (gameOver) {
                    var deadline = new Date(Date.parse(new Date()) + BOGGLE_CONFIG.GAME_TIME * 1000);
                    initializeClock('clockdiv', deadline);
                    createBoard(true);
                    updateGameStateUI();
                } else {
                    document.getElementById('error-msg').textContent = 'Settings saved. They will apply in the next game.';
                }
            };
        }

        var endGameBtn = document.getElementById('end-game');
        if (endGameBtn) {
            endGameBtn.onclick = function() {
                if (!gameOver) {
                    clearInterval(timeinterval);
                    gameOver = true;
                    updateGameStateUI();
                    renderMissedWords();
                    recordGameStats(state.totalPoints, BOGGLE_CONFIG.BOARD_WIDTH + 'x' + BOGGLE_CONFIG.BOARD_HEIGHT);
                }
            };
        }

        var statsBtn = document.getElementById('stats-btn');
        var statsModal = document.getElementById('stats-modal');
        var closeStatsBtn = document.getElementById('close-stats');
        var resetStatsBtn = document.getElementById('reset-stats');

        if (statsBtn && statsModal) {
            statsBtn.onclick = function() {
                renderPlayerStats();
                statsModal.classList.add('open');
            };
        }

        if (closeStatsBtn && statsModal) {
            closeStatsBtn.onclick = function() {
                statsModal.classList.remove('open');
            };
        }

        if (statsModal) {
            statsModal.onclick = function(event) {
                if (event.target === statsModal) {
                    statsModal.classList.remove('open');
                }
            };
        }

        if (resetStatsBtn) {
            resetStatsBtn.onclick = function() {
                if (window.confirm('Are you sure you want to reset all your stats and high scores?')) {
                    var defaultStats = {
                        gamesPlayed: 0,
                        totalPoints: 0,
                        longestWord: "",
                        highScores: []
                    };
                    savePlayerStats(defaultStats);
                    renderPlayerStats();
                }
            };
        }

        // pointer events for swipe/draw selection
        var boardEl = document.getElementById('board');
        boardEl.addEventListener('mousedown', startPointer, false);
        boardEl.addEventListener('touchstart', startPointer, false);
        document.addEventListener('mousemove', movePointer, false);
        document.addEventListener('touchmove', movePointer, { passive: false });
        document.addEventListener('mouseup', endPointer, false);
        document.addEventListener('touchend', endPointer, false);
        document.addEventListener('touchcancel', endPointer, false);

        inputWordBox.addEventListener("keydown", function (e) {
            if (e.keyCode === 13) {
                onAddWordWrapper();
            }
        });
    }

    var getColElementFromPoint = function(x, y) {
        var isSafeHit = function(rect, x, y) {
            let marginX = rect.width * 0.2;
            let marginY = rect.height * 0.2;
            return x > rect.left + marginX && x < rect.right - marginX && y > rect.top + marginY && y < rect.bottom - marginY;
        };

        var addCandidate = function(el, list, seen) {
            while (el && el !== document.body && el !== document.documentElement) {
                if (el.classList && el.classList.contains('col')) {
                    if (!seen.has(el)) {
                        seen.add(el);
                        list.push(el);
                    }
                    return;
                }
                el = el.parentNode;
            }
        };

        let candidates = [];
        let seen = new Set();

        addCandidate(document.elementFromPoint(x, y), candidates, seen);
        if (document.elementsFromPoint) {
            let els = document.elementsFromPoint(x, y);
            for (let i = 0; i < els.length; i++) {
                addCandidate(els[i], candidates, seen);
            }
        }

        let radius = 30;
        let step = 10;
        for (let dx = -radius; dx <= radius; dx += step) {
            for (let dy = -radius; dy <= radius; dy += step) {
                if (dx === 0 && dy === 0) continue;
                addCandidate(document.elementFromPoint(x + dx, y + dy), candidates, seen);
            }
        }

        if (candidates.length === 0) {
            return null;
        }

        // Filter out corner hits by requiring a safe central hit inside the tile.
        candidates = candidates.filter(function(el) {
            let rect = el.getBoundingClientRect();
            return isSafeHit(rect, x, y);
        });

        if (candidates.length === 0) {
            return null;
        }

        let best = null;
        let bestDist = Infinity;
        for (let i = 0; i < candidates.length; i++) {
            let rect = candidates[i].getBoundingClientRect();
            let cx = rect.left + rect.width / 2;
            let cy = rect.top + rect.height / 2;
            let dx = cx - x;
            let dy = cy - y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < bestDist) {
                bestDist = dist;
                best = candidates[i];
            }
        }
        return best;
    };

    var getPointerPosition = function(e) {
        if (e.touches && e.touches.length) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        if (e.changedTouches && e.changedTouches.length) {
            return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
        }
        return { x: e.clientX, y: e.clientY };
    };

    var addTileElement = function(el) {
        if (!el) return;
        let x = parseInt(el.dataset.i), y = parseInt(el.dataset.j);

        if (visitedArr.length > 0) {
            let last = visitedArr[visitedArr.length - 1];
            if (last[0] === x && last[1] === y) {
                return;
            }
        }

        var isValidClickLocal = function (x, y, neigbourArr, visitedArr) {
            let isValid = false;
            for (let p = 0; p < neigbourArr.length; p++) {
                if (neigbourArr[p][0] === x && neigbourArr[p][1] === y) {
                    isValid = true;
                    break;
                }
            }

            for (let p = 0; p < visitedArr.length; p++) {
                if (visitedArr[p][0] === x && visitedArr[p][1] === y) {
                    isValid = false;
                    break;
                }
            }
            return isValid;
        };

        if (neigbourArr.length === 0 || isValidClickLocal(x, y, neigbourArr, visitedArr)) {
            neigbourArr = [];
            neigbourArr.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1], [x + 1, y - 1], [x + 1, y + 1], [x - 1, y + 1], [x - 1, y - 1]);
            word += el.textContent;
            visitedArr.push([x, y]);

            el.classList.add('selected');

            // update svg polyline
            try {
                let rect = el.getBoundingClientRect();
                let boardRect = document.getElementById('board').getBoundingClientRect();
                let cx = rect.left + rect.width / 2 - boardRect.left;
                let cy = rect.top + rect.height / 2 - boardRect.top;
                polylinePoints.push(cx + ',' + cy);
                if (svgOverlay) {
                    let poly = svgOverlay.querySelector('polyline');
                    if (!poly) {
                        poly = document.createElementNS('http://www.w3.org/2000/svg','polyline');
                        poly.setAttribute('fill','none');
                        poly.setAttribute('stroke','#a855f7');
                        poly.setAttribute('stroke-width','6');
                        poly.setAttribute('stroke-linecap','round');
                        poly.setAttribute('stroke-linejoin','round');
                        svgOverlay.appendChild(poly);
                    }
                    poly.setAttribute('points', polylinePoints.join(' '));
                }
            } catch (error) {
                console.warn(error);
            }
        }
        document.getElementById('entered').value = word;
    };

    var startPointer = function(e) {
        if (gameOver) return;
        if (e.type === 'mousedown' && e.button !== 0) {
            return;
        }

        var pos = getPointerPosition(e);
        var el = getColElementFromPoint(pos.x, pos.y);
        if (!el) return;

        console.log('startPointer fired', e.type, pos);
        e.preventDefault();
        e.stopPropagation();
        suppressClick = true;
        isPointerActive = true;
        resetTurn();
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';
        document.body.style.msUserSelect = 'none';

        let boardEl = document.getElementById('board');
        // create svg overlay once
        if (!svgOverlay) {
            svgOverlay = document.createElementNS('http://www.w3.org/2000/svg','svg');
            svgOverlay.setAttribute('style','position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;');
            // ensure board has relative positioning
            if (getComputedStyle(boardEl).position === 'static') boardEl.style.position = 'relative';
            boardEl.appendChild(svgOverlay);
        } else {
            polylinePoints = [];
            let poly = svgOverlay.querySelector('polyline');
            if (poly) poly.setAttribute('points','');
        }

        addTileElement(el);
    };

    var movePointer = function(e) {
        if (!isPointerActive) return;
        e.preventDefault();
        e.stopPropagation();
        var pos = getPointerPosition(e);
        let el = getColElementFromPoint(pos.x, pos.y);
        if (el) addTileElement(el);
    };

    var endPointer = function(e) {
        if (!isPointerActive) return;
        isPointerActive = false;
        // restore selection behavior
        document.body.style.userSelect = '';
        document.body.style.webkitUserSelect = '';
        document.body.style.msUserSelect = '';

        if (svgOverlay) {
            let poly = svgOverlay.querySelector('polyline');
            if (poly) {
                poly.setAttribute('points', '');
            }
        }
        polylinePoints = [];

        // selection complete; auto-submit if enabled
        if (isAutoSubmitEnabled && word && word.length > 0) {
            onAddWordWrapper();
        }
        setTimeout(function() {
            suppressClick = false;
        }, 0);
    };

    var createBoard = function (useRandom) {
        clearBoard();
        if (useRandom === undefined) {
            useRandom = BOGGLE_CONFIG.USE_RANDOM_BOARD;
        }

        if (useRandom) {
            boardConf = generateRandomBoard();
        } else if (!boardConf.length) {
            boardConf = generateRandomBoard();
        }

        boardObj = new Board(BOGGLE_CONFIG.BOARD_WIDTH, BOGGLE_CONFIG.BOARD_HEIGHT);
        boardObj.initilizeCanvas(boardConf);
        boardObj.render();
        bindBoardTiles();
    };

    var getTimeRemaining = function (endtime) {
        var t = Date.parse(endtime) - Date.parse(new Date());
        var seconds = Math.floor((t / 1000) % 60);
        var minutes = Math.floor((t / 1000 / 60) % 60);

        return {
            'total': t,
            'minutes': minutes,
            'seconds': seconds
        };
    };

    var initializeClock = function (id, endtime) {
        if (timeinterval)
            clearInterval(timeinterval);
        var clock = document.getElementById(id);
        var minutesSpan = clock.querySelector('.minutes');
        var secondsSpan = clock.querySelector('.seconds');

        if (BOGGLE_CONFIG.GAME_TIME === 0) {
            minutesSpan.innerHTML = 'ZE';
            secondsSpan.innerHTML = 'N';
            return;
        }

        function updateClock() {
            var t = getTimeRemaining(endtime);

            minutesSpan.innerHTML = ('0' + t.minutes).slice(-2);
            secondsSpan.innerHTML = ('0' + t.seconds).slice(-2);

            if (t.total <= 0) {
                clearInterval(timeinterval);
                gameOver = true;
                updateGameStateUI();
                renderMissedWords();
                recordGameStats(state.totalPoints, BOGGLE_CONFIG.BOARD_WIDTH + 'x' + BOGGLE_CONFIG.BOARD_HEIGHT);
            }
        }

        updateClock();
        timeinterval = setInterval(updateClock, 1000);
    };


    var updateGameStateUI = function() {
        var consoleEl = document.querySelector('.game-console');
        var startGameBtn = document.getElementById('start-game');
        var endGameBtn = document.getElementById('end-game');
        if (gameOver) {
            if (consoleEl) consoleEl.classList.add('game-inactive');
            if (startGameBtn) startGameBtn.classList.add('pulse');
            if (endGameBtn) endGameBtn.style.display = 'none';
        } else {
            if (consoleEl) consoleEl.classList.remove('game-inactive');
            if (startGameBtn) startGameBtn.classList.remove('pulse');
        }
    };

    var onStartGame = function () {
        gameOver = false;
        updateGameStateUI();
        createBoard(true);
        resetTurn();
        goodWords = [];
        badWords = [];
        document.getElementById('right-list').innerHTML = '';
        document.getElementById('wrong-list').innerHTML = '';
        var missedContainer = document.getElementById('missed-list');
        if (missedContainer) missedContainer.innerHTML = '';
        document.getElementById('error-msg').textContent = '';
        state.totalPoints = 0;
        updateScoreDisplay();
        state.highScore = getStoredHighScore();
        updateHighScoreDisplay();
        
        var endGameBtn = document.getElementById('end-game');
        if (endGameBtn) {
            endGameBtn.style.display = (BOGGLE_CONFIG.GAME_TIME === 0) ? 'inline-flex' : 'none';
        }

        var deadline = new Date(Date.parse(new Date()) + BOGGLE_CONFIG.GAME_TIME * 1000);
        initializeClock('clockdiv', deadline);
    };

    var renderMissedWords = function() {
        var missedContainer = document.getElementById('missed-list');
        if (!missedContainer) return;
        missedContainer.innerHTML = '';
        
        var solvedWords = solveBoard(boardObj.canvasMatrix, wordsList, getMinWordLength());
        var missed = solvedWords.filter(function(word) {
            return goodWords.indexOf(word) === -1;
        });

        missed.sort(function(a, b) {
            if (b.length !== a.length) {
                return b.length - a.length;
            }
            return a.localeCompare(b);
        });

        missed.forEach(function(word) {
            var liEl = document.createElement('li');
            var wordText = document.createTextNode(word + ' (' + getPointsForWord(word) + ')');
            liEl.appendChild(wordText);
            liEl.setAttribute('title', word.length + ' letters, worth ' + getPointsForWord(word) + ' point(s)');
            missedContainer.appendChild(liEl);
        });
    };

    loadAssets().then(function () {
        loadSettings();
        createBoard();
        bindEvents();
        updateGameStateUI();
    });

    console.log('app loaded');

    // //======find test======
    // console.log(boardObj.find('TAPAA'))
    // // console.log(boardObj.find('ASS'))
    // // console.log(boardObj.find('ASSROX'))
    // console.log(boardObj.find('ASSRO'))
    // //======find test======

})();