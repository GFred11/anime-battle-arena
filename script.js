const URL = "../my-pose-model/";

// character data
const characters = {
    "Luffy gear second p": {
        name: "Monkey D Luffy",
        move: "Gear Second Mode",
        power: 50,
        img: "/images/gear2luffy.jpg",
        badge: "Gear Second"
    },
    "naruto shadow clone": {
        name: "Naruto Uzumaki",
        move: "Shadow Clone Jutsu",
        power: 100,
        img: "/images/narutopose.avif",
        badge: "Shadow Clone"
    },
    "goku instant transm": {
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

