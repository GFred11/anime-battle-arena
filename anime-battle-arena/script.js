// model
const MODEL_URL = "../my-pose-model/";

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

//  local storage stats
function getStats() {
    return {
        wins:   parseInt(localStorage.getItem("wins"))   || 0,
        losses: parseInt(localStorage.getItem("losses")) || 0,
        draws:  parseInt(localStorage.getItem("draws"))  || 0
    };
}

function saveStats(type) {
    const stats = getStats();
    stats[type]++;
    localStorage.setItem("wins",   stats.wins);
    localStorage.setItem("losses", stats.losses);
    localStorage.setItem("draws",  stats.draws);
}

function showStats() {
    const stats = getStats();
    document.getElementById("stat-wins").textContent   = stats.wins;
    document.getElementById("stat-losses").textContent = stats.losses;
    document.getElementById("stat-draws").textContent  = stats.draws;
}

const enemyKeys = Object.keys(characters);

// game state
let playerHP = 150;
let enemyHP = 150;
let round = 1;
let battleActive = false;
let playerLocked = false;
let lockedPoseKey = "";
let poseDetectionActive = false; 
let model, webcam, ctx, labelContainer, maxPredictions;

// camera startingg
async function init() {
    const modelURL = MODEL_URL + "model.json";
    const metadataURL = MODEL_URL + "metadata.json";

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
    document.getElementById("camera-permission").style.display = "none";

    window.requestAnimationFrame(loop);

    startCountdown();
}

// count down 
function startCountdown() {
    const moveBox = document.getElementById("player-move");
    let count = 5;

    moveBox.textContent = "Get ready! " + count + "...";
    moveBox.style.color = "#e8c84a";

    const timer = setInterval(() => {
        count--;

        if (count > 0) {
            moveBox.textContent = "Get ready! " + count + "...";
        } else {
            clearInterval(timer);
            moveBox.textContent = "DO YOUR POSE NOW!";
            moveBox.style.color = "#4ae84a";
            poseDetectionActive = true; 

            setTimeout(() => {
                if (!playerLocked) {
                    moveBox.textContent = "No pose detected... try again!";
                    moveBox.style.color = "#e84a4a";
                    poseDetectionActive = false;

                    setTimeout(() => startCountdown(), 2000);
                }
            }, 3000);
        }
    }, 1000);
}

// camera loop
async function loop() {
    webcam.update();
    await predict();
    window.requestAnimationFrame(loop);
}

// pose recognition
async function predict() {
    const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
    const prediction = await model.predict(posenetOutput);

    let highestScore = 0;
    let detectedPose = "";

    for (let i = 0; i < maxPredictions; i++) {
        if (prediction[i].probability > highestScore) {
            highestScore = prediction[i].probability;
            detectedPose = prediction[i].className;
        }
    }

    // detect when countdown finishes
    if (poseDetectionActive && highestScore > 0.85 && characters[detectedPose] && !playerLocked) {
        poseDetectionActive = false;
        playerLocked = true;
        lockedPoseKey = detectedPose;
        startBattle(detectedPose);
    }

    drawPose(pose);
}

// start battle
function startBattle(playerPose) {
    battleActive = true;

    const player = characters[playerPose];
    const randomKey = enemyKeys[Math.floor(Math.random() * enemyKeys.length)];
    const enemy = characters[randomKey];

    if (round === 1) {
        document.getElementById("player-name").textContent = player.name;
        document.getElementById("player-badge").textContent = player.badge;

        const playerImg = document.getElementById("player-img");
        playerImg.src = player.img;
        playerImg.style.opacity = "1";
        playerImg.style.filter = "none";
        playerImg.style.transition = "opacity 0.5s ease";
    }

    document.getElementById("player-move").textContent = player.move;
    document.getElementById("player-move").style.color = "#4ae84a";

    // Enemy wisselt elke ronde
    document.getElementById("enemy-name").textContent = enemy.name;
    document.getElementById("enemy-badge").textContent = enemy.badge;
    document.getElementById("enemy-move").textContent = enemy.move;
    document.getElementById("enemy-img").src = enemy.img;

    // damage calculation
    let playerDamage = 0;
    let enemyDamage = 0;

    if (player.power > enemy.power) {
        enemyDamage = player.power - enemy.power;
    } else if (enemy.power > player.power) {
        playerDamage = enemy.power - player.power;
    } else {
        playerDamage = 50;
        enemyDamage = 50;
    }

    playerHP = Math.max(0, playerHP - playerDamage);
    enemyHP = Math.max(0, enemyHP - enemyDamage);

    updateHP();
    setTimeout(() => showResult(playerHP, enemyHP), 1000);
}

// hp bars updating
function updateHP() {
    const playerPercent = (playerHP / 150) * 100;
    const enemyPercent = (enemyHP / 150) * 100;

    document.getElementById("player-hp-fill").style.width = playerPercent + "%";
    document.getElementById("enemy-hp-fill").style.width = enemyPercent + "%";
    document.getElementById("player-hp-text").textContent = playerHP + " / 150";
    document.getElementById("enemy-hp-text").textContent = enemyHP + " / 150";
}

function showResult(playerHP, enemyHP) {
    const resultBox = document.getElementById("result-box");
    const overlay   = document.getElementById("result-overlay");
    const title     = document.getElementById("result-title");
    const subtitle  = document.getElementById("result-subtitle");

    if (playerHP <= 0 && enemyHP <= 0) {
        resultBox.textContent = "DRAW!";
        title.textContent     = "DRAW!";
        title.className       = "result-title draw";
        subtitle.textContent  = "Both fighters are defeated!";
        saveStats("draws");
        setTimeout(() => { showStats(); overlay.classList.add("active"); }, 1500);

    } else if (playerHP <= 0) {
        resultBox.textContent = "YOU LOSE!";
        title.textContent     = "YOU LOSE!";
        title.className       = "result-title lose";
        subtitle.textContent  = "The enemy was too strong...";
        saveStats("losses");
        setTimeout(() => { showStats(); overlay.classList.add("active"); }, 1500);

    } else if (enemyHP <= 0) {
        resultBox.textContent = "YOU WIN!";
        title.textContent     = "YOU WIN!";
        title.className       = "result-title win";
        subtitle.textContent  = "Your pose defeated the enemy!";
        saveStats("wins");
        setTimeout(() => { showStats(); overlay.classList.add("active"); }, 1500);

    } else {
        round++;
        document.getElementById("round-badge").textContent = "ROUND " + round;
        resultBox.textContent = "ROUND " + round;
        setTimeout(() => {
            battleActive = false;
            startBattle(lockedPoseKey);
        }, 2000);
    }
}

// restart
function playAgain() {
    playerHP = 150;
    enemyHP = 150;
    round = 1;
    battleActive = false;
    playerLocked = false;
    lockedPoseKey = "";
    poseDetectionActive = false;

    document.getElementById("result-overlay").classList.remove("active");
    document.getElementById("round-badge").textContent = "ROUND 1";
    document.getElementById("result-box").textContent = "WAITING...";
    document.getElementById("result-box").style.color = "#e8c84a";
    document.getElementById("player-hp-fill").style.width = "100%";
    document.getElementById("enemy-hp-fill").style.width = "100%";
    document.getElementById("player-hp-text").textContent = "150 / 150";
    document.getElementById("enemy-hp-text").textContent = "150 / 150";
    document.getElementById("enemy-move").textContent = "AI PICKS RANDOM";

    const playerImg = document.getElementById("player-img");
    playerImg.src = "";
    playerImg.style.opacity = "0";

    startCountdown();
}

// views skeleton
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

// click anywhere t start
document.addEventListener("click", function startOnClick() {
    init();
    document.removeEventListener("click", startOnClick);
});