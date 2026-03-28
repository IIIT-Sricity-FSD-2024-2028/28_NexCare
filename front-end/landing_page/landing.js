// ================= NAVBAR SCROLL EFFECT =================
const navbar = document.getElementById("navbar");

window.addEventListener("scroll", () => {
    if (navbar) {
        navbar.classList.toggle("scrolled", window.scrollY > 20);
    }
});


// ================= SMOOTH SCROLL =================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", function (e) {
        const target = document.querySelector(this.getAttribute("href"));

        if (target) {
            e.preventDefault();
            target.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    });
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

        // Counter animation
        if (entry.target.classList.contains("stat-number")) {

            const target = parseInt(entry.target.dataset.target);
            animateCounter(entry.target, target);

            obs.unobserve(entry.target);
        }

    });

}, {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
});


// Observe elements
document.querySelectorAll(
    ".feature-card, .role-card, .step, .benefit-card, .testimonial-card, .dashboard-card-preview, .stat-card-large"
).forEach(el => {
    el.classList.add("reveal");
    observer.observe(el);
});


// Observe stats
document.querySelectorAll(".stat-number").forEach(stat => {
    observer.observe(stat);
});


// Section headers animation
document.querySelectorAll(".section-header").forEach(header => {
    header.classList.add("reveal");
    observer.observe(header);
});


// ================= HERO LOAD ANIMATION =================
window.addEventListener("load", () => {

    const heroContent = document.querySelector(".hero-content");
    const heroIllustration = document.querySelector(".hero-illustration");

    if (heroContent) {
        heroContent.style.opacity = "1";
        heroContent.style.transform = "translateY(0)";
    }

    if (heroIllustration) {
        heroIllustration.style.opacity = "1";
        heroIllustration.style.transform = "translateX(0)";
    }

});


// ================= FOOTER YEAR =================
const yearElement = document.getElementById("current-year");

if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
}


// ================= PARALLAX EFFECT =================
window.addEventListener("scroll", () => {

    const heroIllustration = document.querySelector(".hero-illustration");

    if (!heroIllustration) return;

    const scroll = window.pageYOffset;

    if (scroll < window.innerHeight) {
        heroIllustration.style.transform =
            `translateY(${scroll * 0.1}px)`;
    }

});


// ================= BUTTON HOVER EFFECT =================
document.querySelectorAll(
    ".btn-primary, .btn-outline, .btn-white, .btn-outline-white"
).forEach(button => {

    button.addEventListener("mouseenter", () => {
        button.style.transform = "scale(1.05)";
    });

    button.addEventListener("mouseleave", () => {
        button.style.transform = "scale(1)";
    });

    button.addEventListener("mousedown", () => {
        button.style.transform = "scale(0.95)";
    });

    button.addEventListener("mouseup", () => {
        button.style.transform = "scale(1.05)";
    });

});


// ================= ACTIVE NAV LINK =================
window.addEventListener("scroll", () => {

    const sections = document.querySelectorAll("section[id]");
    const navLinks = document.querySelectorAll(".nav-link");

    let current = "";

    sections.forEach(section => {

        const top = section.offsetTop;

        if (window.pageYOffset >= top - 200) {
            current = section.getAttribute("id");
        }

    });

    navLinks.forEach(link => {

        link.classList.remove("active");

        if (link.getAttribute("href") === `#${current}`) {
            link.classList.add("active");
        }

    });

});


// ================= IMAGE LAZY LOAD =================
if ("IntersectionObserver" in window) {

    const imageObserver = new IntersectionObserver((entries, obs) => {

        entries.forEach(entry => {

            if (!entry.isIntersecting) return;

            const img = entry.target;

            if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute("data-src");
            }

            obs.unobserve(img);

        });

    });

    document.querySelectorAll("img[data-src]").forEach(img => {
        imageObserver.observe(img);
    });

}


// ================= PAGE LOAD =================
document.addEventListener("DOMContentLoaded", () => {

    document.body.classList.add("loaded");

    console.log("NexCare landing page loaded");

});


// ================= RESIZE OPTIMIZATION =================
let resizeTimer;

window.addEventListener("resize", () => {

    clearTimeout(resizeTimer);

    resizeTimer = setTimeout(() => {

        console.log("Window resized");

    }, 250);

});


// ================= DEBOUNCE FUNCTION =================
function debounce(func, wait) {

    let timeout;

    return function (...args) {

        clearTimeout(timeout);

        timeout = setTimeout(() => {
            func.apply(this, args);
        }, wait);

    };

}