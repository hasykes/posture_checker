// Copyright (c) 2018 ml5
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

/* ===
ml5 Example
PoseNet example using p5.js
=== */

let video;
let poseNet;
let poses = [];
const width = 640;
const height = 480;

const slouchHeight = 325;
const shoulderLine = {
  x1: 0,
  y1: slouchHeight,
  x2: width,
  y2: slouchHeight,
};

let postureFailCount = 0;
let sendNotification = false;
let allowNotification = false;
let deskIsRaised = false;
const deskDelay = 21000;
const slouchFailCount = 1000;
const fetchOpts = { headers: { mode: "no-cors" } };

function setup() {
  createCanvas(width, height);
  video = createCapture(VIDEO);
  video.size(width, height);

  // Create a new poseNet method with a single detection
  poseNet = ml5.poseNet(video, modelReady);
  // This sets up an event that fills the global variable "poses"
  // with an array every time new poses are detected
  poseNet.on("pose", function (results) {
    poses = results;
  });
  // Hide the video element, and just show the canvas
  video.hide();
}

function modelReady() {
  select("#status").html("Model Loaded");
}

function draw() {
  image(video, 0, 0, width, height);

  stroke("red");
  line(shoulderLine.x1, shoulderLine.y1, shoulderLine.x2, shoulderLine.y2);

  // We can call both functions to draw all keypoints and the skeletons
  //console.log(poses);
  estimatePosture();
  drawKeypoints();
  drawSkeleton();
}

// A function to draw ellipses over the detected keypoints
function drawKeypoints() {
  // Loop through all the poses detected
  for (let i = 0; i < poses.length; i++) {
    // For each pose detected, loop through all the keypoints
    let pose = poses[i].pose;
    for (let j = 0; j < pose.keypoints.length; j++) {
      // A keypoint is an object describing a body part (like rightArm or leftShoulder)
      let keypoint = pose.keypoints[j];
      // Only draw an ellipse is the pose probability is bigger than 0.2
      if (keypoint.score > 0.2) {
        fill(255, 255, 255);
        noStroke();
        ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
      }
    }
  }
}

// A function to draw the skeletons
function drawSkeleton() {
  // Loop through all the skeletons detected
  for (let i = 0; i < poses.length; i++) {
    let skeleton = poses[i].skeleton;
    // For every skeleton, loop through all body connections
    for (let j = 0; j < skeleton.length; j++) {
      let partA = skeleton[j][0];
      let partB = skeleton[j][1];
      stroke(255, 255, 255);
      line(
        partA.position.x,
        partA.position.y,
        partB.position.x,
        partB.position.y
      );
    }
  }
}

function estimatePosture() {
  if (poses.length > 0) {
    const distanceBetweenShoudlers =
      poses[0].pose.keypoints[5].position.x -
      poses[0].pose.keypoints[6].position.x;
    select("#distanceBetweenShoulders").html(`${distanceBetweenShoudlers}`);

    const distanceFromShouldersToNose =
      poses[0].pose.keypoints[0].position.y -
      poses[0].pose.keypoints[6].position.y;
    select("#distanceFromShouldersToNose").html(
      `${distanceFromShouldersToNose}`
    );

    const leftShoulderHeight = poses[0].pose.keypoints[5].position.y;
    select("#leftShoulderHeight").html(`${leftShoulderHeight}`);

    const rightShoulderHeight = poses[0].pose.keypoints[6].position.y;
    select("#rightShoulderHeight").html(`${rightShoulderHeight}`);

    if (
      (poses[0].pose.keypoints[5].position.y > slouchHeight) & //both shoulders should slouch before we fire off a notification
      (poses[0].pose.keypoints[6].position.y > slouchHeight) &
      !deskIsRaised
    ) {
      postureFailCount += 1;
      console.log(
        sendNotification,
        allowNotification,
        deskIsRaised,
        postureFailCount
      );
      if (
        (postureFailCount >= slouchFailCount) &
        !sendNotification &
        !deskIsRaised
      ) {
        //toy with failCount for desired delay
        sendNotification = true;
        postureFailCount = 0;
        if (allowNotification) {
          desktopNotify("It looks like you're slouching... Straighten up!");
        }
        select("#deskButton").html(`${!deskIsRaised ? "Lower" : "Raise"} Desk`);
        fetch("http://192.168.4.251/UP", fetchOpts);
        deskIsRaised = true;
        setTimeout(() => {
          fetch("http://192.168.4.251/STOP", fetchOpts);
        }, deskDelay); //wait 21 seconds before sending stop signal
      } else {
        sendNotification = false;
      }
    }
  }

  //select("#distanceFromShouldersToNose").html(`${}`);
}

function captureGoodPosture() {}

function captureBadPosture() {}

function desktopNotify(notificationText = "defaultNotification") {
  let notify;

  if (!window.Notification) {
    console.log("Browser does not support notifications.");
  } else {
    // check if permission is already granted
    if (Notification.permission === "granted") {
      // show notification here
      notify = new Notification("Posture Checker", { body: notificationText });
    } else {
      // request permission from user
      Notification.requestPermission()
        .then(function (permission) {
          if (permission === "granted") {
            notify = new Notification("Posture Checker", {
              body: notificationText,
            });
          } else {
            console.log("User blocked notifications.");
          }
        })
        .catch(function (err) {
          console.error(err);
        });
    }
  }
}

function handleCheck(e) {
  if (e.target.checked) {
    return (allowNotification = true);
  }

  return (allowNotification = false);
}

function handleDesk(e) {
  e.preventDefault();
  select("#deskButton").html(`${!deskIsRaised ? "Lower" : "Raise"} Desk`);
  fetch(`http://192.168.4.251/${deskIsRaised ? "DOWN" : "UP"}`, fetchOpts);
  setTimeout(() => {
    fetch(`http://192.168.4.251/STOP`, fetchOpts);
  }, deskDelay);

  deskIsRaised = !deskIsRaised;
}
/*
const notifyInterval = setInterval(() => {
  if (sendNotification) {
    desktopNotify();
  }
}, 1000);
*/

/*
Pose KeyPoints
0: nose
1: left_eye
2: right_eye
3: left_ear
4: right_ear
5: left_shoulder
6: right_shoulder
7: left_elbow
8: right_elbow
9: left_wrist
10: right_wrist
11: left_hip
12: right_hip
13: left_knee
14: right_knee
15: left_ankle
16: right_ankle
*/
