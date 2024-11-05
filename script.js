const API_URL = 'https://guesstheweight-backend.onrender.com/get-weight'; 
const IMAGE_API_URL = 'https://guesstheweight-backend.onrender.com/generate-image';
const postLeaderboardAPI = 'https://guesstheweight-backend.onrender.com/leaderboard';
const leaderboardAPI = 'https://guesstheweight-backend.onrender.com/getleaderboard';

let lastWeight = 0;
let gameActive = true;
let history = [];
let historyNames = []; 
let count = 0;

let leaderboard = [];

function isSimilar(newName) {
    return historyNames.some(previousName => newName.includes(previousName) || previousName.includes(newName));
}

document.getElementById('submitButton').addEventListener('click', async () => {
    const objectInput = document.getElementById('objectInput');
    const objectName = objectInput.value.trim();

    if (!objectName || objectName.split(' ').length > 1) {
        alert("Please enter a single word only.");
        return;
    }

    if (isSimilar(objectName)) {
        alert("This word is too similar to a previous entry. Please enter a different object.");
        return;
    }

    objectInput.value = '';

    if (!gameActive) {
        resetGame();
    } else {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ object: objectName }),
            });

            const data = await response.json();

            if (response.ok) {
                let weight = typeof data.weight === "string" ? parseFloat(data.weight.replace(/,/g, '')) : data.weight;

                if (history.length > 0) {
                    document.getElementById('result').innerText = `Yep, the ${objectName}'s weight is indeed bigger. It's ${weight} kg`;
                } else {
                    document.getElementById('result').innerText = `The ${objectName}'s weight is ${weight} kg`;
                }

                if (lastWeight === 0 || weight > lastWeight) {
                    lastWeight = weight;
                    count++;
                    document.getElementById('count').innerHTML = 'Count: ' + count;

                    const imageResponse = await fetch(IMAGE_API_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ object: objectName }),
                    });

                    const imageData = await imageResponse.json();

                    if (imageResponse.ok) {
                        const img = document.createElement('img');
                        img.src = imageData.imageUrl;
                        img.alt = objectName;
                        img.style.width = '250px';
                        img.style.height = '250px';

                        const objectDiv = document.createElement('div');
                        objectDiv.classList.add('object-entry');
                        const h2 = document.createElement('h2');
                        h2.innerHTML = `${objectName} (${weight} kg)`;
                        objectDiv.appendChild(h2);
                        objectDiv.appendChild(img);

                        history.push(objectDiv);
                        historyNames.push(objectName);

                        leaderboard.push({ name: objectName, weight: weight });
                        updateLeaderboard();

                        if (history.length > 2) {
                            history.shift();
                            historyNames.shift();
                        }

                        const historyDiv = document.getElementById('history');
                        historyDiv.innerHTML = '';
                        history.forEach(entry => historyDiv.appendChild(entry)); 
                    } else {
                        document.getElementById('result').innerText += " | Image Error: " + (imageData.error || "Could not generate the image.");
                    }
                } else {
                    alert(`${objectName} is lighter than the previous object. Game over!`);
                    openScoreSubmissionModal();
                }
            } else {
                document.getElementById('result').innerText = "Error: " + (data.error || "Could not find the weight.");
            }
        } catch (error) {
            console.error('Error:', error);
            document.getElementById('result').innerText = "Error fetching weight.";
        }
    }
});

function openScoreSubmissionModal() {
    const scoreModal = document.getElementById('scoreModal');
    scoreModal.style.display = 'block';
}

document.getElementById('scoreForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const playerName = document.getElementById('playerName').value.trim();
    const playerScore = count;

    try {
        const response = await fetch(postLeaderboardAPI, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: playerName, score: playerScore }),
        });

        const data = await response.json();

        if (response.ok) {
            alert('Score submitted successfully!');
        } else {
            alert('Error: ' + (data.error || 'Failed to submit score.'));
        }
    } catch (error) {
        console.error('Error submitting score:', error);
        alert('Error submitting score. Please try again later.');
    }

    document.getElementById('scoreModal').style.display = 'none';
    resetGame();
});

function resetGame() {
    lastWeight = 0;
    gameActive = true;
    document.getElementById('result').innerText = '';
    history = []; 
    historyNames = [];
    count = 0;
    document.getElementById('count').innerHTML = 'Count: 0';
    document.getElementById('history').innerHTML = '';
}

function updateLeaderboard() {
    const leaderboardDiv = document.getElementById('leaderboard');
    leaderboardDiv.innerHTML = '';

    leaderboard.sort((a, b) => b.weight - a.weight);

    leaderboard.forEach(entry => {
        const p = document.createElement('p');
        p.textContent = `${entry.name}: ${entry.weight} points`;
        leaderboardDiv.appendChild(p);
    });
}

document.getElementById('viewLeaderboardButton').addEventListener('click', async () => {
    const modal = document.getElementById('leaderboardModal');
    const leaderboardDiv = document.getElementById('leaderboard');
    leaderboardDiv.innerHTML = '';

    try {
        const response = await fetch(leaderboardAPI);
        if (!response.ok) {
            throw new Error('Failed to fetch leaderboard data.');
        }
        
        const leaderboardData = await response.json();

        leaderboardData.forEach(entry => {
            const p = document.createElement('p');
            p.textContent = `${entry.name}: ${entry.score} points`;
            leaderboardDiv.appendChild(p);
        });

        modal.style.display = 'block';
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        alert('Error fetching leaderboard. Please try again later.');
    }
});

document.getElementById('closeLeaderboard').addEventListener('click', () => {
    const modal = document.getElementById('leaderboardModal');
    modal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    const modal = document.getElementById('leaderboardModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

document.getElementById('objectInput').addEventListener('keydown', async (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        document.getElementById('submitButton').click();
    }
});

document.getElementById('closeScoreModal').addEventListener('click', () => {
    document.getElementById('scoreModal').style.display = 'none';
});
