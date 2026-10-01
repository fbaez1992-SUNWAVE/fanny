const sections = document.querySelectorAll("[data-section]");
const comparisons = document.querySelectorAll("[data-compare]");

document.documentElement.classList.add("motion-ready");

const reveal = (section) => section.classList.add("is-visible");

sections.forEach((section) => {
  const rect = section.getBoundingClientRect();
  if (rect.top < window.innerHeight && rect.bottom > 0) {
    reveal(section);
  }
});

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          reveal(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );

  sections.forEach((section) => observer.observe(section));
} else {
  sections.forEach(reveal);
}

window.addEventListener("beforeprint", () => {
  sections.forEach(reveal);
});

comparisons.forEach((comparison) => {
  const range = comparison.querySelector(".compare-frame__range");

  if (!range) {
    return;
  }

  const setSplit = () => {
    const value = Number(range.value);
    comparison.style.setProperty("--split", `${value}%`);
    range.setAttribute("aria-valuetext", `${value}% obra ejecutada`);
  };

  range.addEventListener("input", setSplit);
  setSplit();
});
