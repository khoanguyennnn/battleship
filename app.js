const gamesBoardContainer = document.querySelector('#gamesboard-container')
const optionContainer = document.querySelector('.option-container')
const flipButton = document.querySelector('#flip-button')
const startButton = document.querySelector('#start-button')
const infoDisplay = document.querySelector('#info')
const turnDisplay = document.querySelector('#turn-display')
const finishDisplay = document.querySelector('#finish-display')
const playerTurnDisplay = document.querySelector('.player')
const finishGame = document.querySelector('.game-finish')

var computerTurn = 'Computer\'s Turn!'
var yourTurn = 'Your Turn!'

// Hide and show option
var div = document.querySelector('.ships-container')
var display = 1;

function hideShow(){
    if (display == 1) {
        div.style.display = 'block'
        display = 0
    }
    else{
        div.style.display = 'none'
        display = 1
    }
}

// Option choosing
let angle = 0

function flip(){
    const optionShips = Array.from(optionContainer.children)
    angle = angle === 0 ? 90 : 0
    optionShips.forEach(optionShip => optionShip.style.transform = `rotate(${angle}deg)`)
}

flipButton.addEventListener('click', flip)

// Creating Boards
const width = 10

function createBoard(color,user){
    const gameBoardContainer = document.createElement('div')
    gameBoardContainer.classList.add('game-board')
    gameBoardContainer.style.backgroundImage = color
    gameBoardContainer.id = user

    for (let i = 0; i < width* width; i++) {
        const block = document.createElement('div')
        block.classList.add('block')
        block.id = i
        gameBoardContainer.append(block)
    }

    gamesBoardContainer.append(gameBoardContainer)
}

createBoard("url(image/playerBlock.png)", 'player')

createBoard("url(image/computerBlock.png)", 'computer')

// Creating ships
class Ship{
    constructor(name, length){
        this.name = name
        this.length = length
    }
}

const destroyer = new Ship('destroyer', 2)
const submarine = new Ship('submarine', 3)
const cruiser = new Ship('cruiser', 3)
const battleship = new Ship('battleship', 4)
const carrier = new Ship('carrier', 5)

const ships = [destroyer, submarine, cruiser, battleship, carrier]
let notDropped

function getValidity(allBoardBlocks, isHorizontal, startIndex, ship){
    let validStart = isHorizontal ? startIndex <= width * width - ship.length ? startIndex :
    width * width - ship.length : 
    // handle vertical
    startIndex <= width* width - width * ship.length ? startIndex : 
        startIndex - ship.length * width + width

    let shipBlocks = []

    for(let i = 0; i< ship.length; i++){
        if(isHorizontal){
            shipBlocks.push(allBoardBlocks[Number(validStart) + i])
        } else {
            shipBlocks.push(allBoardBlocks[Number(validStart) + i*width])
        }
    }

    let valid

    if(isHorizontal){
        shipBlocks.every((_shipBlock, index) => 
            valid = shipBlocks[0].id % width !== width - (shipBlocks.length - (index + 1)))
    } else {
        shipBlocks.every((_shipBlock, index) =>
            valid = shipBlocks[0].id < 90 + (width * index + 1)
        )
    }

    const notTaken = shipBlocks.every(shipBlock => !shipBlock.classList.contains('taken'))

    return {shipBlocks, valid, notTaken}
}

function addShipPiece(user, ship, startId){
    const allBoardBlocks = document.querySelectorAll(`#${user} div`)
    let randomBoolean = Math.random() < 0.5
    let isHorizontal = user == 'player' ? angle === 0 : randomBoolean
    let randomStartIndex = Math.floor(Math.random() * width * width)
    
    let startIndex = startId ? startId : randomStartIndex

    const {shipBlocks, valid, notTaken} = getValidity(allBoardBlocks, isHorizontal, startIndex, ship)

    if(valid && notTaken){
        shipBlocks.forEach(shipBlock => {
            shipBlock.classList.add(ship.name)
            shipBlock.classList.add('taken')
        })
    } else {
       if (user === 'computer') addShipPiece(user, ship, startId)
       if(user === 'player') notDropped = true
    }
}

ships.forEach(ship => addShipPiece('computer',ship))

// Drag player ships
let draggedShip
const optionShips = Array.from(optionContainer.children)
optionShips.forEach(optionShip => optionShip.addEventListener('dragstart', dragStart))

const allPlayerBlocks = document.querySelectorAll('#player div')
allPlayerBlocks.forEach(playerBlock => {
    playerBlock.addEventListener('dragover', dragOver)
    playerBlock.addEventListener('drop', dropShip)
})

function dragStart(e){
    notDropped = false
    draggedShip = e.target
}

function dragOver(e) {
    e.preventDefault()
    const ship = ships[draggedShip.id]
    highlightArea(e.target.id, ship)
}

function dropShip(e) {
    const startId = e.target.id
    const ship = ships[draggedShip.id]
    addShipPiece('player',ship, startId)
    if(!notDropped){
        draggedShip.remove()
    }
}

// Add highlight
function highlightArea(startIndex, ship){
    const allBoardBlocks = document.querySelectorAll(('#player div'))
    let isHorizontal = angle === 0

    const { shipBlocks, valid, notTaken } = getValidity(allBoardBlocks, isHorizontal, startIndex, ship)
    
    if(valid && notTaken){
        shipBlocks.forEach(shipBlock => {
            shipBlock.classList.add('hover')
            setTimeout(() => shipBlock.classList.remove('hover'), 200)
        })
    }
}

let gameOver = false
let playerTurn

// Start Game
function startGame(){
    if(playerTurn === undefined){
        if(optionContainer.children.length != 0){
            infoDisplay.textContent = 'Please place all your pieces first!'
        } else {
           const allPlayerBlocks = document.querySelectorAll('#computer div')
            allPlayerBlocks.forEach(block => block.addEventListener('click', handleClick))
            playerTurn = true
            playerTurndisplay(yourTurn)
            infoDisplay.textContent = 'The game has started'
        }
        
    }
}

startButton.addEventListener('click', startGame)

let playerHits = []
let computerHits = []
const playerSunkShips = []
const computerSunkShips = []

function handleClick(e){
    if(!gameOver){
        if(e.target.classList.contains('boom') || e.target.classList.contains('empty') ){
            return handleClick(e)
        }
        if(e.target.classList.contains('taken') && !e.target.classList.contains('boom')){
            e.target.classList.add('boom')
            infoDisplay.textContent = 'You hit the computer ship!'
            let classes = Array.from(e.target.classList)
            classes = classes.filter(className => className !== 'block')
            classes = classes.filter(className => className !== 'boom')
            classes = classes.filter(className => className !== 'taken')
            playerHits.push(...classes)
            checkScore('player', playerHits, playerSunkShips)
            handleClick()
            return
        }
        if (!e.target.classList.contains('taken')){
            infoDisplay.textContent = 'You hit nothing this time'
            e.target.classList.add('empty')
        }

        
        playerTurn = false
        const allBoardBlocks = document.querySelectorAll('#computer div')
        allBoardBlocks.forEach(block => block.replaceWith(block.cloneNode(true)))
        
        playerTurndisplay(computerTurn)
    
        setTimeout(computerGo, 1500)
    }
}



// Define the computer go
let previousHit = null;
let presentHit = previousHit;
let previousHitDirection = null;
let possibleDirections = [];
var counter = 0;

function computerGo() {
    
    if(!gameOver){
        const playerBoard = document.querySelector('#player');
        const allBoardBlocks = document.querySelectorAll('#player div');
        setTimeout(() => {
            if (previousHit) {
                if (!previousHitDirection) {
                // determine direction for the first hit
                if (previousHit % width === 0) {
                    possibleDirections = ['down', 'right', 'up'];
                } else if (previousHit % width === width - 1) {
                    possibleDirections = ['down', 'left', 'up'];
                } else if (previousHit < width) {
                    possibleDirections = ['right', 'down', 'left'];
                } else if (previousHit < 100 && previousHit > 90){
                    possibleDirections = ['right', 'up', 'left'];
                } else {
                    possibleDirections = ['right', 'up', 'left', 'down'];
                }
                // randomly select direction
                previousHitDirection = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];
                }

                const nextBlock = document.querySelectorAll(`#player div`);
                
                // continue in previous direction if hit again
                if (previousHitDirection === 'right' ) {
                    presentHit = previousHit + 1;
                    
                    if (nextBlock[presentHit].classList.contains('taken') && !nextBlock[presentHit].classList.contains('boom')) {
                        previousHit = presentHit;
                        nextBlock[presentHit].classList.add('boom');
                        infoDisplay.textContent = 'The computer hit your ship!' 
                        let classes = Array.from(allBoardBlocks[presentHit].classList)
                        classes = classes.filter(className => className !== 'block')
                        classes = classes.filter(className => className !== 'boom')
                        classes = classes.filter(className => className !== 'taken')
                        computerHits.push(...classes)
                        checkScore('computer', computerHits, computerSunkShips)
                        return computerGo();
                    } else if(nextBlock[presentHit].classList.contains('taken') && nextBlock[presentHit].classList.contains('boom')){
                        previousHit = presentHit;
                        return computerGo();
                    }

                } else if (previousHitDirection === 'down') {
                    presentHit = previousHit + width;

                    if (nextBlock[presentHit].classList.contains('taken') && !nextBlock[presentHit].classList.contains('boom')) {
                        previousHit = presentHit;
                        nextBlock[presentHit].classList.add('boom');
                        infoDisplay.textContent = 'The computer hit your ship!' 
                        let classes = Array.from(allBoardBlocks[presentHit].classList)
                        classes = classes.filter(className => className !== 'block')
                        classes = classes.filter(className => className !== 'boom')
                        classes = classes.filter(className => className !== 'taken')
                        computerHits.push(...classes)
                        checkScore('computer', computerHits, computerSunkShips)
                        return computerGo();
                    } else if(nextBlock[presentHit].classList.contains('taken') && nextBlock[presentHit].classList.contains('boom')){
                        previousHit = presentHit;
                        return computerGo();
                    }
                } else if (previousHitDirection === 'left') {
                    presentHit = previousHit - 1;

                    if (nextBlock[presentHit].classList.contains('taken') && !nextBlock[presentHit].classList.contains('boom')) {
                        previousHit = presentHit;
                        nextBlock[presentHit].classList.add('boom');
                        infoDisplay.textContent = 'The computer hit your ship!' 
                        let classes = Array.from(allBoardBlocks[presentHit].classList)
                        classes = classes.filter(className => className !== 'block')
                        classes = classes.filter(className => className !== 'boom')
                        classes = classes.filter(className => className !== 'taken')
                        computerHits.push(...classes)
                        checkScore('computer', computerHits, computerSunkShips)
                        return computerGo();
                    } else if(nextBlock[presentHit].classList.contains('taken') && nextBlock[presentHit].classList.contains('boom')){
                        previousHit = presentHit;
                        return computerGo();
                    }
                    
                } else if (previousHitDirection === 'up') {
                    presentHit = previousHit - width;

                    if (nextBlock[presentHit].classList.contains('taken') && !nextBlock[presentHit].classList.contains('boom')) {
                        previousHit = presentHit;
                        nextBlock[presentHit].classList.add('boom');
                        infoDisplay.textContent = 'The computer hit your ship!' 
                        let classes = Array.from(allBoardBlocks[presentHit].classList)
                        classes = classes.filter(className => className !== 'block')
                        classes = classes.filter(className => className !== 'boom')
                        classes = classes.filter(className => className !== 'taken')
                        computerHits.push(...classes)
                        checkScore('computer', computerHits, computerSunkShips)
                        return computerGo();
                    } else if(nextBlock[presentHit].classList.contains('taken') && nextBlock[presentHit].classList.contains('boom')){
                        previousHit = presentHit;
                        return computerGo();
                    }
                    
                } 

                
                infoDisplay.textContent = 'Nothing hit this time'
                nextBlock[presentHit].classList.add('empty')
                playerTurndisplay(yourTurn)
                setTimeout(() =>{
                playerTurn = true
                
                infoDisplay.textContent = 'Please take your turn!'
                const allBoardBlocks = document.querySelectorAll('#computer div')
                allBoardBlocks.forEach(block => block.addEventListener('click', handleClick))
                }, 1000)
                
                console.log(previousHitDirection)
                console.log(allBoardBlocks[presentHit])

                // change direction if hit in the opposite direction
                possibleDirections = possibleDirections.filter(direction => direction !== previousHitDirection);
                previousHitDirection = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];

                console.log(previousHitDirection)
            } else {
                // choose random block if no previous hit or no valid block in previous direction
                let randomGo = Math.floor(Math.random()*width*width)  
                console.log(allBoardBlocks[randomGo])
                if((allBoardBlocks[randomGo].classList.contains('taken') &&
                        allBoardBlocks[randomGo].classList.contains('boom')) || 
                        allBoardBlocks[randomGo].classList.contains('empty')
                ){
                    computerGo()
                    return
                } else if(allBoardBlocks[randomGo].classList.contains('taken') &&
                            !allBoardBlocks[randomGo].classList.contains('boom')
                ){
                    allBoardBlocks[randomGo].classList.add('boom')
                    infoDisplay.textContent = 'The computer hit your ship!' 
                    let classes = Array.from(allBoardBlocks[randomGo].classList)
                    classes = classes.filter(className => className !== 'block')
                    classes = classes.filter(className => className !== 'boom')
                    classes = classes.filter(className => className !== 'taken')
                    computerHits.push(...classes)
                    checkScore('computer', computerHits, computerSunkShips)
                    previousHit = randomGo;
                    previousHitDirection = null;
                    return computerGo();
                } 
                else {
                    infoDisplay.textContent = 'Nothing hit this time'
                    allBoardBlocks[randomGo].classList.add('empty')
                    playerTurndisplay(yourTurn)
                    setTimeout(() =>{
                        playerTurn = true
                        
                        infoDisplay.textContent = 'Please take your turn!'
                        const allBoardBlocks = document.querySelectorAll('#computer div')
                        allBoardBlocks.forEach(block => block.addEventListener('click', handleClick))
                    }, 1000)
                }
                
            }
            
            if(computerSunkShips.length === 1){
                previousHit = null;
                previousHitDirection = undefined;
                computerSunkShips.length = 0;
                counter = counter + 1;
            }
            if (counter == 5) {
                computerSunkShips.length = counter;
            }
            
        }, 1000);
    }

}

const shipSunk = document.querySelector('.ship-sunk')
  
function checkScore(user, userHits, userSunkShips){
    function checkShip(shipName, shipLength){
        if(
            userHits.filter(storedShipName => storedShipName === shipName).length === shipLength
        ) {
           
            if(user === 'player'){
                infoDisplay.textContent = `You sunk the computer's ${shipName}`
                playerHits = userHits.filter(storedShipName => storedShipName !== shipName)
            }
            if(user === 'computer'){
                infoDisplay.textContent = `You sunk the your's ${shipName}`
                computerHits = userHits.filter(storedShipName => storedShipName !== shipName)
            }
            userSunkShips.push(shipName)
            shipSunk.style.display = 'inline-flex';
            setTimeout(() => {
                shipSunk.style.display = 'none';
            }, 1200);
        }
    }
    checkShip('destroyer', 2)
    checkShip('submarine', 3)
    checkShip('cruiser', 3)
    checkShip('battleship', 4)
    checkShip('carrier', 5)

    console.log('playerHits', playerHits)
    console.log('playerSunkShips', playerSunkShips)
    console.log('computerHis', computerHits)
    console.log('computerSunkShips', computerSunkShips)

    setTimeout(() => {
        if(playerSunkShips.length === 5){
            finishDisplay.textContent = 'You sunks all computer\'s ships. YOU WON!!!'
            finishGame.style.display = 'flex'
            gameOver = true
        }
        if(computerSunkShips.length === 5){
            finishDisplay.textContent = 'Computer sunks all your ships. You LOST!'
            finishGame.style.display = 'flex'
            gameOver = true
        }
    }, 2500);
    
}

function playerTurndisplay(turn){
    turnDisplay.textContent = turn
    playerTurnDisplay.style.display = 'flex'
    setTimeout(() => {
        playerTurnDisplay.style.display = 'none'
    }, 1500);
    
}



