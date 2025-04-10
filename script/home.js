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

/*
const sections = document.querySelectorAll("main > section");
let isScrolling = false;

let currentIndex = 0;

window.addEventListener("wheel", (e) => {
  if (isScrolling) return;

  if (e.deltaY > 0 && currentIndex < sections.length - 1) {
    currentIndex++;
  } else if (e.deltaY < 0 && currentIndex > 0) {
    currentIndex--;
  } else {
    return;
  }

  isScrolling = true;
  sections[currentIndex].scrollIntoView({ behavior: "smooth" });

  setTimeout(() => {
    isScrolling = false;
  }, 500); // délai pour éviter le spam
});
*/

(function () {
  const slider = document.querySelector('.carousel-gallery');
  const prevBtn = document.querySelector('.carousel-prev');
  const nextBtn = document.querySelector('.carousel-next');
  const items = slider.querySelectorAll('.carousel-element'); // ← SEULEMENT les bons éléments
  let isDown = false;
  let startX, scrollLeft;

  // Drag Scroll
  slider.addEventListener('mousedown', e => {
    isDown = true;
    slider.classList.add('dragging');
    startX = e.pageX - slider.offsetLeft;
    scrollLeft = slider.scrollLeft;
  });

  slider.addEventListener('mouseleave', () => stopDragging());
  slider.addEventListener('mouseup', () => {
    stopDragging();
    centerOnNearest();
  });

  slider.addEventListener('mousemove', e => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - slider.offsetLeft;
    const walk = (x - startX) * 2;
    slider.scrollLeft = scrollLeft - walk;
  });

  function stopDragging() {
    isDown = false;
    slider.classList.remove('dragging');
  }

  // Centrage sur l'élément le plus proche
  function centerOnNearest() {
    const sliderCenter = slider.scrollLeft + slider.offsetWidth / 2;
    let closest = null;
    let closestDist = Infinity;

    items.forEach(item => {
      const itemCenter = item.offsetLeft + item.offsetWidth / 2;
      const dist = Math.abs(itemCenter - sliderCenter);
      if (dist < closestDist) {
        closest = item;
        closestDist = dist;
      }
    });

    if (closest) {
      smoothScrollTo(closest.offsetLeft - (slider.offsetWidth - closest.offsetWidth) / 2);
    }
  }

  function smoothScrollTo(targetScrollLeft) {
    const duration = 400;
    const start = slider.scrollLeft;
    const distance = targetScrollLeft - start;
    const startTime = performance.now();

    function animate(time) {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 0.5 - Math.cos(progress * Math.PI) / 2;
      slider.scrollLeft = start + distance * ease;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }

  // Navigation avec les boutons
  function scrollToNext(dir = 1) {
    const sliderCenter = slider.scrollLeft + slider.offsetWidth / 2;
    const sorted = [...items].sort((a, b) => {
      const aCenter = a.offsetLeft + a.offsetWidth / 2;
      const bCenter = b.offsetLeft + b.offsetWidth / 2;
      return Math.abs(aCenter - sliderCenter) - Math.abs(bCenter - sliderCenter);
    });

    const current = sorted[0];
    let targetIndex = [...items].indexOf(current) + dir;

    if (targetIndex < 0) targetIndex = 0;
    if (targetIndex >= items.length) targetIndex = items.length - 1;

    const target = items[targetIndex];
    slider.scrollTo({ left: target.offsetLeft - (slider.offsetWidth - target.offsetWidth) / 2, behavior: 'smooth' });
  }

  prevBtn.addEventListener('click', () => scrollToNext(-1));
  nextBtn.addEventListener('click', () => scrollToNext(1));

  window.addEventListener('load', () => {
    const second = items[1];
    if (second) {
      const targetScroll = second.offsetLeft - (slider.offsetWidth - second.offsetWidth) / 2;
      slider.scrollLeft = targetScroll;
    }
  });
})();

(function() {
  const galleryImages = document.querySelectorAll('.circle-gallery img');

  // Création des éléments popup et overlay
  const popup = document.createElement('img');
  popup.className = 'image-popup';

  const overlay = document.createElement('div');
  overlay.className = 'image-popup-overlay';

  document.body.appendChild(popup);
  document.body.appendChild(overlay);

  // Click sur une image
  galleryImages.forEach(img => {
    img.addEventListener('click', () => {
      const isActive = popup.classList.contains('active');
      if (isActive && popup.src === img.src) {
        // Si déjà ouverte avec la même image => on ferme
        popup.classList.remove('active');
        overlay.classList.remove('active');
      } else {
        // Sinon on ouvre / change d’image
        popup.src = img.src;
        popup.classList.add('active');
        overlay.classList.add('active');
      }
    });
  });

  // Click en dehors (overlay) pour fermer
  overlay.addEventListener('click', () => {
    popup.classList.remove('active');
    overlay.classList.remove('active');
  });

  // Click sur l’image ouverte = fermer aussi
  popup.addEventListener('click', () => {
    popup.classList.remove('active');
    overlay.classList.remove('active');
  });
})();