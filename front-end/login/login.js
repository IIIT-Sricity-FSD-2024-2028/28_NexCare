// ================= NAVBAR SCROLL EFFECT =================
const navbar = document.getElementById("navbar");
window.addEventListener("scroll", () => {
    if (navbar) {
        navbar.classList.toggle("scrolled", window.scrollY > 20);
    }
});

// ================= COUNTER ANIMATION =================
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
        start += step;
        if (start >= target) {
            element.textContent = target.toLocaleString() + "+";
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(start).toLocaleString();
        }
    }, 16);
}

// ================= INTERSECTION OBSERVER =================
const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("active");
        if (entry.target.classList.contains("stat-number")) {
            const target = parseInt(entry.target.dataset.target);
            animateCounter(entry.target, target);
            obs.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll(".login-section, .hero-image").forEach(el => observer.observe(el));

// ================= BUTTON HOVER EFFECT =================
document.querySelectorAll(".btn-signin, .btn-google").forEach(button => {
    button.addEventListener("mouseenter", () => button.style.transform = "scale(1.01)");
    button.addEventListener("mouseleave", () => button.style.transform = "scale(1)");
});

document.addEventListener("DOMContentLoaded", () => {
    console.log("NexCare Original Design Re-integrated");
});