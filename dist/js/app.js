
(function () {
    
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
        polylinePoints = [],
        highScore = 0,
        totalPoints = 0;

    var getStoredHighScore = function() {
        var stored = window.localStorage.getItem('boggleHighScore');
        return stored ? parseInt(stored, 10) : 0;
    };

    var setStoredHighScore = function(score) {
        highScore = score;
        window.localStorage.setItem('boggleHighScore', score);
    };

    var updateScoreDisplay = function() {
        document.getElementById('points').textContent = totalPoints + ' Point(s)';
    };

    var updateHighScoreDisplay = function() {
        document.getElementById('high-score').textContent = 'High Score: ' + highScore;
    };

    var getPointsForWord = function(w) {
        var len = getLetterCount(w);
        if (len >= 8) return 11;
        if (len === 7) return 5;
        if (len === 6) return 3;
        if (len === 5) return 2;
        if (len === 4) return 1;
        if (len === 3) return 1;
        return 0;
    };

    var getLetterCount = function(w) {
        if (!w) return 0;
        var i = 0, count = 0;
        while (i < w.length) {
            var ch = w.charAt(i);
            var next = (i + 1 < w.length) ? w.charAt(i + 1) : '';
            // treat 'Qu' or 'qu' as two letters
            if ((ch === 'Q' || ch === 'q') && (next === 'u' || next === 'U')) {
                count += 2;
                i += 2;
            } else {
                count += 1;
                i += 1;
            }
        }
        return count;
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
        let dice = BOGGLE_CONFIG.BOGGLE_DICE.slice();
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


    var readFile = function (file, conf, separator) {
        var rawFile = new XMLHttpRequest();
        rawFile.open("GET", file, false);
        rawFile.onreadystatechange = function () {
            if (rawFile.readyState === 4) {
                if (rawFile.status === 200 || rawFile.status == 0) {
                    // var allText = rawFile.responseText;
                    // alert(allText);
                    let contents = rawFile.responseText;
                    if (contents) {
                        if (conf === 'dict')
                            wordsList = contents.split(separator).map(item => item.trim());
                        if (conf === 'board')
                            boardConf = contents.split(separator).map(item => item.trim());
                    }
                }
            }
        }
        rawFile.send(null);
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
                        totalPoints += pts;
                        updateScoreDisplay();
                        if (totalPoints > highScore) {
                            setStoredHighScore(totalPoints);
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
                        poly.setAttribute('stroke','#4CAF50');
                        poly.setAttribute('stroke-width','6');
                        poly.setAttribute('stroke-linecap','round');
                        poly.setAttribute('stroke-linejoin','round');
                        svgOverlay.appendChild(poly);
                    }
                    poly.setAttribute('points', polylinePoints.join(' '));
                }
            } catch (e) {}
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
        } else {
            readFile(BOGGLE_CONFIG.BOARD_CONFIG_FILE_PATH, 'board', ',');
        }

        boardObj = new board(BOGGLE_CONFIG.BOARD_WIDTH, BOGGLE_CONFIG.BOARD_HEIGHT);
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

        function updateClock() {
            var t = getTimeRemaining(endtime);

            minutesSpan.innerHTML = ('0' + t.minutes).slice(-2);
            secondsSpan.innerHTML = ('0' + t.seconds).slice(-2);

            if (t.total <= 0) {
                clearInterval(timeinterval);
                gameOver = true;
            }
        }

        updateClock();
        timeinterval = setInterval(updateClock, 1000);
    };


    var onStartGame = function () {
        gameOver = false;
        resetTurn();
        goodWords = [];
        badWords = [];
        document.getElementById('right-list').innerHTML = '';
        document.getElementById('wrong-list').innerHTML = '';
        document.getElementById('error-msg').textContent = '';
        totalPoints = 0;
        updateScoreDisplay();
        highScore = getStoredHighScore();
        updateHighScoreDisplay();
        var deadline = new Date(Date.parse(new Date()) + BOGGLE_CONFIG.GAME_TIME * 1000);
        initializeClock('clockdiv', deadline);
    };

    createBoard();
    readFile(BOGGLE_CONFIG.DICTIONARY_FILE_PATH, 'dict', '\n');
    bindEvents();

    console.log('app loaded');

    // //======find test======
    // console.log(boardObj.find('TAPAA'))
    // // console.log(boardObj.find('ASS'))
    // // console.log(boardObj.find('ASSROX'))
    // console.log(boardObj.find('ASSRO'))
    // //======find test======

})();