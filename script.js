const columns = 'abcdefgh';
const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],         [0, 1],
    [1, -1], [1, 0], [1, 1]
];
let thisPuzzleMoveSeq;
let boardState, topMove, secondBestMove;
let currentTurn = 'black';
let puzzles = [];
let currentPuzzleIndex = -1;

// Load solved puzzles from localStorage (if any)
function loadSolvedPuzzles() {
    const solved = localStorage.getItem('solvedPuzzles');
    return solved ? JSON.parse(solved) : [];
}

// Save solved puzzles to localStorage
function saveSolvedPuzzles(solvedPuzzles) {
    localStorage.setItem('solvedPuzzles', JSON.stringify(solvedPuzzles));
}

function loadBookmarkedPuzzles() {
    const bookmarked = localStorage.getItem('bookmarkedPuzzles');
    return bookmarked ? JSON.parse(bookmarked) : [];
}

function saveBookmarkedPuzzles(bookmarkedPuzzles) {
    localStorage.setItem('bookmarkedPuzzles', JSON.stringify(bookmarkedPuzzles));
}

// Load the puzzle file from localStorage if it exists
function loadPuzzleFileFromLocalStorage() {
    const puzzleFile = localStorage.getItem('puzzleFile');
    if (puzzleFile) {
        puzzles = puzzleFile.trim().split('\n');
        currentPuzzleIndex = -1;
        loadNextPuzzle();
    }
}

// Save puzzle file content to localStorage
function savePuzzleFileToLocalStorage(fileContent) {
    localStorage.setItem('puzzleFile', fileContent);
}

document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Flush localStorage when a new file is uploaded
    localStorage.removeItem('puzzleFile');
    localStorage.removeItem('solvedPuzzles');

    const reader = new FileReader();
    reader.onload = function(e) {
        const fileContent = e.target.result;
        puzzles = fileContent.trim().split('\n');
        currentPuzzleIndex = -1;

        // Save the puzzle file to localStorage
        savePuzzleFileToLocalStorage(fileContent);
        loadNextPuzzle();
    };
    reader.readAsText(file);
});

function getMoves() {
    navigator.clipboard.writeText(thisPuzzleMoveSeq);
    document.getElementById('feedback').innerText = "Copied to clipboard";
};

function createBoard() {
    const boardElement = document.getElementById('board');
    boardElement.innerHTML = '';
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            let cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = r;
            cell.dataset.col = c;
            cell.onclick = () => handleMove(r, c);
            if (boardState[r][c] !== null) {
                let piece = document.createElement('div');
                piece.classList.add(boardState[r][c]);
                cell.appendChild(piece);
            }
            boardElement.appendChild(cell);
        }
    }
}

function resetBoard() {
    boardState = Array(8).fill(null).map(() => Array(8).fill(null));
    boardState[3][3] = 'white';
    boardState[3][4] = 'black';
    boardState[4][3] = 'black';
    boardState[4][4] = 'white';
}

function isValidMove(row, col, color) {
    if (boardState[row][col] !== null) return false;
    let opponent = color === 'black' ? 'white' : 'black';
    let valid = false;
    for (let [dr, dc] of directions) {
        let r = row + dr, c = col + dc, flipped = false;
        while (r >= 0 && r < 8 && c >= 0 && c < 8 && boardState[r][c] === opponent) {
            r += dr;
            c += dc;
            flipped = true;
        }
        if (flipped && r >= 0 && r < 8 && c >= 0 && c < 8 && boardState[r][c] === color) {
            valid = true;
            break;
        }
    }
    return valid;
}

function makeMove(row, col, color) {
    if (!isValidMove(row, col, color)) return false;
    boardState[row][col] = color;
    let opponent = color === 'black' ? 'white' : 'black';
    for (let [dr, dc] of directions) {
        let r = row + dr, c = col + dc, toFlip = [];
        while (r >= 0 && r < 8 && c >= 0 && c < 8 && boardState[r][c] === opponent) {
            toFlip.push([r, c]);
            r += dr;
            c += dc;
        }
        if (toFlip.length > 0 && r >= 0 && r < 8 && c >= 0 && c < 8 && boardState[r][c] === color) {
            for (let [fr, fc] of toFlip) {
                boardState[fr][fc] = color;
            }
        }
    }
    return true;
}

function applyMoves(moves) {
    resetBoard();
    let turn = 'black';
    for (let i = 0; i < moves.length; i += 2) {
        let col = columns.indexOf(moves[i]);
        let row = parseInt(moves[i + 1]) - 1;
        makeMove(row, col, turn);
        turn = turn === 'black' ? 'white' : 'black';
    }
    createBoard();
    return turn;
}

function updateCounter() {
    const solvedPuzzles = loadSolvedPuzzles();
    const solved = solvedPuzzles.includes(currentPuzzleIndex) ? ' &#10004;' : '';
    document.getElementById('counter').innerHTML = `Puzzle: ${currentPuzzleIndex + 1}/${puzzles.length}${solved}`;
}

function loadNextPuzzle(steps = 1) {
    if (puzzles.length === 0) return;
    currentPuzzleIndex = Math.min(currentPuzzleIndex + steps, puzzles.length - 1);
    loadPuzzle();
}

function loadPrevPuzzle(steps = 1) {
    if (puzzles.length === 0) return;
    currentPuzzleIndex = Math.max(currentPuzzleIndex - steps, 0);
    loadPuzzle();
}

function loadPuzzle() {
    const puzzleParts = puzzles[currentPuzzleIndex].split(' ');
    if (puzzleParts.length < 2) return;

    const moveSeq = puzzleParts[0];
    thisPuzzleMoveSeq = moveSeq;
    topMove = puzzleParts[1];
    secondBestMove = puzzleParts.length > 2 ? puzzleParts[2] : null;

    let turn = applyMoves(moveSeq);
    document.getElementById('feedback').innerHTML = "Select the best move for " + (turn == 'black' ? "<div class='circle-black'></div>" : "<div class='circle-white'></div>");
    updateCounter();
}

function handleMove(row, col) {
    let move = columns[col] + (row + 1);
    if (move === topMove) {
        const solvedPuzzles = loadSolvedPuzzles();
        solvedPuzzles.push(currentPuzzleIndex);  // Mark puzzle as solved
        saveSolvedPuzzles(solvedPuzzles); // Save to localStorage
        document.getElementById('feedback').innerText = "Correct!";
    } else if (move === secondBestMove) {
        document.getElementById('feedback').innerText = "Good, but not the best move. Try again!";
    } else {
        document.getElementById('feedback').innerText = "Incorrect. Try again!";
    }
    updateCounter(); // Update the counter after the move
}

function revealAnswer() {
    document.getElementById('feedback').innerText = "Best move: " + topMove;
}

function bookmark() {
    const bookmarked = loadBookmarkedPuzzles();
    if (!bookmarked.includes(currentPuzzleIndex)) {
        bookmarked.push(currentPuzzleIndex);
        saveBookmarkedPuzzles(bookmarked);
    }
}

// Move to the first unsolved puzzle
function moveToFirstUnsolvedPuzzle() {
    const solvedPuzzles = loadSolvedPuzzles();
    for (let i = 0; i < puzzles.length; i++) {
        if (!solvedPuzzles.includes(i)) {
            currentPuzzleIndex = i;
            loadPuzzle();
            break;
        }
    }
}

// Load puzzle file from localStorage when the page reloads
window.onload = loadPuzzleFileFromLocalStorage;

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js')
        .then((registration) => {
            console.log('Service Worker registered with scope: ', registration.scope);
        })
        .catch((error) => {
            console.log('Service Worker registration failed: ', error);
        });
}
