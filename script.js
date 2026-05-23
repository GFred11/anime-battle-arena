const URL = "../my-pose-model/";

// character data
const characters = {
    "Luffy gear second pose": {
        name: "Monkey D Luffy",
        move: "Gear Second Mode",
        power: 50,
        img: "/images/gear2luffy.jpg",
        badge: "Gear Second"
    },
    "naruto shadow clone pose": {
        name: "Naruto Uzumaki",
        move: "Shadow Clone Jutsu",
        power: 100,
        img: "/images/narutopose.avif",
        badge: "Shadow Clone"
    },
    "goku instant transmission pose": {
        name: "Son Goku",
        move: "Instant Transmission",
        power: 150,
        img: "/images/gokupose.avif",
        badge: "Instant Trans..."
    }
};

const enemyKeys = Object.keys(characters);

// game state
let playerHP = 150;
let enemyHP = 150;
let round = 1;
let battleActive = false;
let model, webcam, ctx, labelContainer, maxPredictions;

//  TM starting
async function init() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    model = await tmPose.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    const size = 300;
    webcam = new tmPose.Webcam(size, size, true);
    await webcam.setup();
    await webcam.play();

    const canvas = document.getElementById("canvas");
    canvas.width = size;
    canvas.height = size;
    ctx = canvas.getContext("2d");

    labelContainer = document.getElementById("label-container");

    window.requestAnimationFrame(loop);
}

// Camera looping
async function loop() {
    webcam.update();
    await predict();
    window.requestAnimationFrame(loop);
}

// pose recognition
async function predict() {
    const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
    const prediction = await model.predict(posenetOutput);

    // finding the best pose
    let highestScore = 0;
    let detectedPose = "";

    for (let i = 0; i < maxPredictions; i++) {
        if (prediction[i].probability > highestScore) {
            highestScore = prediction[i].probability;
            detectedPose = prediction[i].className;
        }
    }

    if (highestScore > 0.85 && characters[detectedPose] && !battleActive) {
        startBattle(detectedPose);
    }

    drawPose(pose);
}

// ── battle starting
function startBattle(playerPose) {
    battleActive = true;

    const player = characters[playerPose];

    // Random enemy kiezen
    const randomKey = enemyKeys[Math.floor(Math.random() * enemyKeys.length)];
    const enemy = characters[randomKey];

    // UI updaten – speler
    document.getElementById("player-name").textContent = player.name;
    document.getElementById("player-badge").textContent = player.badge;
    document.getElementById("player-move").textContent = player.move;
    document.getElementById("player-img").src = player.img;

    // UI updaten – enemy
    document.getElementById("enemy-name").textContent = enemy.name;
    document.getElementById("enemy-badge").textContent = enemy.badge;
    document.getElementById("enemy-move").textContent = enemy.move;
    document.getElementById("enemy-img").src = enemy.img;

    // Damage berekenen
    let playerDamage = 0;
    let enemyDamage = 0;

    if (player.power > enemy.power) {
        enemyDamage = player.power - enemy.power;
    } else if (enemy.power > player.power) {
        playerDamage = enemy.power - player.power;
    } else {
        // Gelijke kracht = beide -50
        playerDamage = 50;
        enemyDamage = 50;
    }

    // HP aanpassen
    playerHP = Math.max(0, playerHP - playerDamage);
    enemyHP = Math.max(0, enemyHP - enemyDamage);

    // HP bars updaten
    updateHP();

    // Resultaat tonen
    setTimeout(() => {
        showResult(playerHP, enemyHP);
    }, 1000);
}

// ── HP bars updatingg
function updateHP() {
    const playerPercent = (playerHP / 150) * 100;
    const enemyPercent = (enemyHP / 150) * 100;

    document.getElementById("player-hp-fill").style.width = playerPercent + "%";
    document.getElementById("enemy-hp-fill").style.width = enemyPercent + "%";
    document.getElementById("player-hp-text").textContent = playerHP + " / 150";
    document.getElementById("enemy-hp-text").textContent = enemyHP + " / 150";
}

// ── results tonen
function showResult(playerHP, enemyHP) {
    const resultBox = document.getElementById("result-box");

    if (playerHP <= 0 && enemyHP <= 0) {
        resultBox.textContent = "DRAW!";
        resultBox.style.color = "#e8c84a";
    } else if (playerHP <= 0) {
        resultBox.textContent = "YOU LOSE!";
        resultBox.style.color = "#e84a4a";
    } else if (enemyHP <= 0) {
        resultBox.textContent = "YOU WIN!";
        resultBox.style.color = "#4ae84a";
    } else {
        

        round++;
        document.getElementById("round-badge").textContent = "ROUND " + round;
        resultBox.textContent = "ROUND " + round;
        setTimeout(() => {
            battleActive = false;
        }, 2000);
        return;
    }

    // win or lose!
    setTimeout(() => {
        window.location.href = "result.html";
    }, 3000);
}

// drawing skeleton
function drawPose(pose) {
    if (webcam.canvas) {
        ctx.drawImage(webcam.canvas, 0, 0);
        if (pose) {
            const minPartConfidence = 0.5;
            tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
            tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
        }
    }
}

// auto starting
init();