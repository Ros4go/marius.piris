// JavaScript pour de futures interactions
console.log("Page de CV chargée");
  
/* ===== SECTION VIDEO ===== */

const video = document.getElementById("bg-video");

video.addEventListener("loadedmetadata", () => {
  video.currentTime = 10;
});

const playBtn = document.getElementById("play-toggle");
const muteBtn = document.getElementById("mute-toggle");
const fullscreenBtn = document.getElementById("fullscreen-toggle");

playBtn.addEventListener("click", () => {
  if (video.paused) {
    video.play();
    playBtn.src = "../assets/icons/pause.png";
  } else {
    video.pause();
    playBtn.src = "../assets/icons/play.png";
  }
});

muteBtn.addEventListener("click", () => {
  video.muted = !video.muted;
  muteBtn.src = video.muted ? "../assets/icons/muted.png" : "../assets/icons/unmuted.png";
});

fullscreenBtn.addEventListener("click", () => {
  if (!document.fullscreenElement) {
    video.requestFullscreen();
    fullscreenBtn.src = "../assets/icons/fullscreen.png";
  } else {
    document.exitFullscreen();
    fullscreenBtn.src = "../assets/icons/fullscreen.png";
  }
});

const menuToggle = document.getElementById("menu-toggle");
const menuItems = document.getElementById("menu-items");

menuToggle.addEventListener("click", () => {
  menuToggle.classList.toggle("change");
  menuItems.classList.toggle("show");
});
