const URL = "./my-pose-model/";

let model, webcam, ctx, labelContainer, maxPredictions;

// Start button function
async function init() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    // Model loading
    model = await tmPose.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    // Webcam up start
    const size = 300;
    const flip = true; 
    webcam = new tmPose.Webcam(size, size, flip);
    await webcam.setup();
    await webcam.play();

    // Canvas connecting
    const canvas = document.getElementById("canvas");
    canvas.width = size;
    canvas.height = size;
    ctx = canvas.getContext("2d");

    // Label container
    labelContainer = document.getElementById("label-container");

    // Loop starting
    window.requestAnimationFrame(loop);
}

// updating frames
async function loop(timestamp) {
    webcam.update();
    await predict();
    window.requestAnimationFrame(loop);
}

// Pose recognition
async function predict() {
    const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
    const prediction = await model.predict(posenetOutput);

    // which pose has the highest score
    let highestScore = 0;
    let detectedPose = "";

    for (let i = 0; i < maxPredictions; i++) {
        if (prediction[i].probability > highestScore) {
            highestScore = prediction[i].probability;
            detectedPose = prediction[i].className;
        }
    }

    // the console log so you can see what it detects
    console.log("Gedetecteerd:", detectedPose, highestScore.toFixed(2));

    
    drawPose(pose);
}

// Drawing the skeleton of the pose
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