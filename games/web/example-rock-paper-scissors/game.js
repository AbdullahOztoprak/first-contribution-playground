/**
 * Rock Paper Scissors - Example Web Game Submission
 * Author: @platform-bot
 * Category: Web Game
 * Difficulty: Beginner
 */

let playerScore = 0;
let computerScore = 0;

const choices = ['rock', 'paper', 'scissors'];
const emojis = { rock: '🪨', paper: '📄', scissors: '✂️' };

function getComputerChoice() {
    return choices[Math.floor(Math.random() * choices.length)];
}

function getResult(player, computer) {
    if (player === computer) return 'draw';
    if (
        (player === 'rock' && computer === 'scissors') ||
        (player === 'paper' && computer === 'rock') ||
        (player === 'scissors' && computer === 'paper')
    ) {
        return 'win';
    }
    return 'lose';
}

function play(playerChoice) {
    const computerChoice = getComputerChoice();
    const result = getResult(playerChoice, computerChoice);

    const resultEl = document.getElementById('result');
    const playerEl = document.getElementById('player-score');
    const computerEl = document.getElementById('computer-score');

    const playerEmoji = emojis[playerChoice];
    const computerEmoji = emojis[computerChoice];

    if (result === 'win') {
        playerScore++;
        resultEl.innerHTML = `${playerEmoji} vs ${computerEmoji} — <strong style="color: #2ecc71">You win!</strong>`;
    } else if (result === 'lose') {
        computerScore++;
        resultEl.innerHTML = `${playerEmoji} vs ${computerEmoji} — <strong style="color: #e74c3c">You lose!</strong>`;
    } else {
        resultEl.innerHTML = `${playerEmoji} vs ${computerEmoji} — <strong style="color: #f39c12">It's a draw!</strong>`;
    }

    playerEl.textContent = playerScore;
    computerEl.textContent = computerScore;
}

function resetGame() {
    playerScore = 0;
    computerScore = 0;
    document.getElementById('player-score').textContent = '0';
    document.getElementById('computer-score').textContent = '0';
    document.getElementById('result').innerHTML = '';
}
