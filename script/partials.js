document.addEventListener("DOMContentLoaded", () => {
    loadComponent("header", "../partials/header.html", () => {
        setActiveNavLink();
        setupTheme(); 
    });
    requestAnimationFrame(() => {
      document.querySelector("header").style.position = "sticky";
    });
    loadComponent("footer", "../partials/footer.html");
  });
  
function loadComponent(id, url, callback) {
    fetch(url)
      .then(response => response.text())
      .then(data => {
        document.getElementById(id).innerHTML = data;
        if (callback) callback();
      })
      .catch(error => console.error(`Erreur de chargement de ${url}:`, error));
}

function setupTheme() {
    const currentTheme = localStorage.getItem("theme");
    const body = document.body;
  
    if (currentTheme === "dark") {
      body.classList.add("dark-mode");
    }
  
    const toggle = document.getElementById("toggle-theme");
    if (toggle) {
      updateThemeIcon(); // met l'icône correcte dès le début
  
      toggle.addEventListener("click", () => {
        body.classList.toggle("dark-mode");
        const newTheme = body.classList.contains("dark-mode") ? "dark" : "light";
        localStorage.setItem("theme", newTheme);
        updateThemeIcon();
      });
    }
}
  
function updateThemeIcon() {
    const icon = document.getElementById("toggle-theme");
    if (!icon) return;
  
    const isDark = document.body.classList.contains("dark-mode");
    icon.textContent = isDark ? "☀️" : "🌙";
}   
  
function setActiveNavLink() {
    const currentPage = window.location.pathname.split("/").pop(); // ex: "home.html"
    const links = document.querySelectorAll("nav a");
  
    links.forEach(link => {
      const linkHref = link.getAttribute("href");
      if (!linkHref) return;
  
      const linkPage = linkHref.split("/").pop(); // extrait "home.html" de "../pages/home.html"
      if (linkPage === currentPage) {
        link.classList.add("active");
      }
    });
}  