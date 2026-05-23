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