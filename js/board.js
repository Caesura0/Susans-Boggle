
var board = function (width, height) {
    this.canvasMatrix = [],
    this.width = parseInt(width),
    this.height = parseInt(height);
};

board.prototype.initilizeCanvas = function (valueArr) {
    //create a w x h matrix and initialize with values provided
    while(valueArr.length) {
        this.canvasMatrix.push(valueArr.splice(0,this.width));
    }    
}

board.prototype.render = function() {
    console.log('Rendering Started from board constructor');
    let boardContainer = document.getElementById('board');
    
    for (let i = 0; i < this.height; i++) {
        let rowDiv = document.createElement('div');
        rowDiv.className = 'row';
        for (let j = 0; j < this.width; j++) {
            let colDiv = document.createElement('div');
            colDiv.className = 'col';
            let letterTxt = document.createTextNode(this.canvasMatrix[i][j] );
            colDiv.appendChild(letterTxt);
            colDiv.dataset.i = i;
            colDiv.dataset.j = j;
            rowDiv.appendChild(colDiv);
        }
        boardContainer.appendChild(rowDiv);
    }
    
};

board.prototype.find = function (inputString) {
    var that = this;

    //eligible Condition to add letter into the queue
    var checkValidity = function (x, y, prefix, visitedTrail) {
        //boundary condition
        if (x >= 0 && x < that.height && y >= 0 && y < that.width) {

            var isVisited = function(x, y, visitedArr){
                for (let p = 0; p < visitedArr.length; p++) {
                    if(visitedArr[p].i === x && visitedArr[p].j === y){
                        return true;
                    }
                }
                return false;
            };

            var checkPrefixMatch = function(boardWord, inputString){
                var indices = [];
                for (let i = 0; i < boardWord.length; i++) {
                    if (boardWord[i] === '*')
                        indices.push(i);
                }
                if (indices.length === 0 && inputString.toLowerCase().startsWith(boardWord.toLowerCase()) ) {
                    console.log('prefix is found in direct match');
                    return true;
                }
        
                if (boardWord.length <= inputString.length) {
                    let equal = true;
                    //check whether board word is a pefix of inputstring ignoring the *
                    for (let j = 0; j < boardWord.length; j++) {
                        if (indices.indexOf(j) === -1) {
                            if (boardWord[j].toLowerCase() !== inputString[j].toLowerCase()) {
                                equal = false;
                                return equal; //not match
                            }
                        }
                    }
                    console.log('prefix found, the prefix is - ' + boardWord);                        
                    return equal;
                }
            };

            //if boardWord is a prefix of inputString and if its not visited earlier       
            if (checkPrefixMatch((prefix + that.canvasMatrix[x][y]), inputString) && !isVisited(x, y, visitedTrail) ){
                console.log('- - - - - - - - - ');
                console.log('Prefix='+ prefix );
                return true;
            }            
        }
        return false;
    };

    //not very fond of recursion
    var q = new queue();

    for (let i = 0; i < this.height; i++) {
        for (let j = 0; j < this.width; j++) {
            if((inputString[0].toLowerCase() === this.canvasMatrix[i][j].toLowerCase()) || this.canvasMatrix[i][j] === '*')  {
                q.enqueue([ i, j, this.canvasMatrix[i][j], [{i:i, j:j}] ]);
            }
        }
    }

    console.log(q);

    var addNeighbour = function(neighbourX, neighbourY, prefix, visited){
        let visitedTrail = visited.slice(); //copy the array to avoid refernce
        if (checkValidity(neighbourX, neighbourY, prefix, visitedTrail)) {
            visitedTrail.push({i:neighbourX, j:neighbourY});
            console.log('~~~~~~~~~~~~~~~~~');
            console.log(visitedTrail);
            q.enqueue([neighbourX,
                neighbourY, 
                prefix + that.canvasMatrix[neighbourX][neighbourY],
                visitedTrail
            ]);
        }
    };

    var checkWordFound = function(boardWord, inputString){
        var indices = [];
        for (let i = 0; i < boardWord.length; i++) {
            if (boardWord[i] === '*')
                indices.push(i);
        }
        if (indices.length === 0 && inputString.toLowerCase() === boardWord.toLowerCase()) {
            console.log('word is found in direct match');
            return true;
        }

        if (inputString.length === boardWord.length) {
            let equal = true;
            //each word
            for (let j = boardWord.length - 1; j >= 0; j--) {
                if (indices.indexOf(j) === -1) {
                    if (boardWord[j].toLowerCase() !== inputString[j].toLowerCase()) {
                        equal = false;
                        break; //not match
                    }
                }
            }
            if (equal) {
                console.log('word found, the word is - ' + inputString);
                boardWord = inputString; //May be dangerous need to check
                return equal;
            }

        }

        console.log('word is not found yet');
        return false;

    };

    //run untill the queue is exhausted
    while (!q.isEmpty()) {
        let item = q.dequeue();
        console.log('==================');
        console.log(item);
        if(checkWordFound(item[2], inputString)) {
            console.log('word found');
            return true;
        }   
        
        let x = item[0],
        y = item[1],
        prefix = item[2],
        visitedTrail = item[3];

        //check for adjecent 8 pixels - right, left, top, bottom and four corners
        addNeighbour(x+1, y, prefix, visitedTrail);
        addNeighbour(x-1, y, prefix, visitedTrail);
        addNeighbour(x, y+1, prefix, visitedTrail);
        addNeighbour(x, y-1, prefix, visitedTrail);
        addNeighbour(x+1, y-1, prefix, visitedTrail);
        addNeighbour(x+1, y+1, prefix, visitedTrail);
        addNeighbour(x-1, y+1, prefix, visitedTrail);
        addNeighbour(x-1, y-1, prefix, visitedTrail);

    }
    return false;

};

console.log('board loaded');