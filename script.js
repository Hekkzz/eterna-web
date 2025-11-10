// ==== Menú responsive ====
const menuBtn = document.getElementById("menu-btn");
const navMenu = document.getElementById("nav-menu");

if (menuBtn && navMenu) {
  menuBtn.addEventListener("click", () => {
    navMenu.classList.toggle("show");
  });
}

// ==== Animación suave al hacer clic en enlaces ====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({
        behavior: "smooth"
      });
    }
  });
});

// ==== Animación al hacer scroll ====
const sections = document.querySelectorAll(".section");
if (sections.length > 0) {
  window.addEventListener("scroll", () => {
    const triggerBottom = window.innerHeight * 0.85;
    sections.forEach(section => {
      const sectionTop = section.getBoundingClientRect().top;
      if (sectionTop < triggerBottom) {
        section.classList.add("visible");
      }
    });
  });
}

// ===== CARRUSEL DE PUBLICIDAD AUTOMÁTICO =====
let currentSlideIndex = 0;
let autoSlideInterval;

// Inicializar el carrusel cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  initSlider();
});

function initSlider() {
  // Iniciar el auto-deslizamiento
  startAutoSlide();
}

// Cambiar slide
function moveSlide(direction) {
  const slides = document.querySelectorAll(".slider-wrapper-full .slide");
  const dots = document.querySelectorAll(".dot-minimal");
  
  if (slides.length === 0) return;
  
  // Remover clase active del slide actual
  slides[currentSlideIndex].classList.remove("active");
  dots[currentSlideIndex].classList.remove("active");
  
  // Calcular nuevo índice
  currentSlideIndex += direction;
  
  // Loop circular
  if (currentSlideIndex >= slides.length) {
    currentSlideIndex = 0;
  } else if (currentSlideIndex < 0) {
    currentSlideIndex = slides.length - 1;
  }
  
  // Activar nuevo slide
  slides[currentSlideIndex].classList.add("active");
  dots[currentSlideIndex].classList.add("active");
}

// Ir a un slide específico
function currentSlide(index) {
  const slides = document.querySelectorAll(".slider-wrapper-full .slide");
  const dots = document.querySelectorAll(".dot-minimal");
  
  if (slides.length === 0) return;
  
  // Remover clase active
  slides[currentSlideIndex].classList.remove("active");
  dots[currentSlideIndex].classList.remove("active");
  
  // Establecer nuevo índice
  currentSlideIndex = index;
  
  // Activar nuevo slide
  slides[currentSlideIndex].classList.add("active");
  dots[currentSlideIndex].classList.add("active");
  
  // Reiniciar el auto-slide
  stopAutoSlide();
  startAutoSlide();
}

// Auto-deslizamiento
function startAutoSlide() {
  stopAutoSlide(); // Limpiar cualquier intervalo existente
  autoSlideInterval = setInterval(() => {
    moveSlide(1);
  }, 4000); // Cambiar cada 4 segundos
}

function stopAutoSlide() {
  if (autoSlideInterval) {
    clearInterval(autoSlideInterval);
  }
}

// Soporte para gestos táctiles (swipe) en móviles
let touchStartX = 0;
let touchEndX = 0;

const sliderWrapper = document.querySelector(".slider-wrapper-full");
if (sliderWrapper) {
  sliderWrapper.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].screenX;
  });

  sliderWrapper.addEventListener("touchend", (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  });
}

function handleSwipe() {
  const swipeThreshold = 50; // Mínimo de píxeles para considerar un swipe
  
  if (touchEndX < touchStartX - swipeThreshold) {
    // Swipe hacia la izquierda (siguiente)
    moveSlide(1);
    stopAutoSlide();
    startAutoSlide();
  }
  
  if (touchEndX > touchStartX + swipeThreshold) {
    // Swipe hacia la derecha (anterior)
    moveSlide(-1);
    stopAutoSlide();
    startAutoSlide();
  }
}