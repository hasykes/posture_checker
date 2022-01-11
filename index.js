let capture;
let net; //poseNet Global
let videoEle;

//Posenet paramas
const scaleFactor = 0.5;
const flipHorizontal = false;
const outputStride = 16;

//runs once at the start
async function setup() {
  createCanvas(320, 320);
  let constraints = {
    video: {
      mandatory: {
        minWidth: 320,
        minHeight: 320,
      },
      optional: [{ maxFrameRate: 1 }],
    },
    audio: false,
  };
  capture = await createCapture(constraints);
  capture.size(320, 320);
  capture.hide();
  videoEle = document.querySelector("video");

  //load the PoseNet model
  net = await posenet.load();
}

async function draw() {
  background(250);
  image(capture, 0, 0, 320, 320);

  // images and video(webcam)
  const poses = await runPoseNet();
  //console.log(poses);
  console.log(poses.keypoints[0].position.x, poses.keypoints[0].position.y);
  for (let i = 0; i < poses.keypoints.length; i++) {
    if (poses.keypoints[i].position.x > 0) {
      ellipse(poses.keypoints[i].position.x, poses.keypoints[i].position.y, 5);
    }
  }
  stroke(255, 255, 255);
  strokeWeight(1);
  // construct skeleton structure by joining 2 parts with line
  // for (let j = 0; j < poses.skeleton.length; j++) {
  //   line(
  //     poses.skeleton[j][0].position.x,
  //     poses.skeleton[j][0].position.y,
  //     poses.skeleton[j][1].position.x,
  //     poses.skeleton[j][1].position.y
  //   );
  // }
  noLoop();
  setTimeout(() => loop(), 5000);
}

async function runPoseNet() {
  const poses = await net.estimateSinglePose(
    videoEle,
    scaleFactor,
    flipHorizontal,
    outputStride
  );

  return poses;
}
