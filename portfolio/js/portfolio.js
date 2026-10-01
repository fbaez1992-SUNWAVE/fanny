(() => {
  document.documentElement.classList.add("motion-ready");
  if ("scrollRestoration" in history && !window.location.hash) {
    history.scrollRestoration = "manual";
  }

  window.addEventListener(
    "load",
    () => {
      if (!window.location.hash) window.scrollTo(0, 0);
    },
    { once: true }
  );

  const canHover = window.matchMedia("(pointer: fine)").matches;

  const attachTilt = (element, intensity = 6, scale = 1.01) => {
    if (!element || !canHover) return;

    element.addEventListener("mousemove", (e) => {
      const rect = element.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      element.style.transform = `perspective(1200px) rotateY(${x * intensity}deg) rotateX(${-y * intensity}deg) scale3d(${scale}, ${scale}, ${scale})`;
    });

    element.addEventListener("mouseleave", () => {
      element.style.transform = "perspective(1200px) rotateY(0deg) rotateX(0deg) scale3d(1, 1, 1)";
    });
  };

  const introTitle = document.querySelector(".intro h2");
  if (introTitle) {
    introTitle.innerHTML = `Arquitectura interior pensada desde la <em>atmósfera.</em>`;
  }

  attachTilt(document.querySelector(".hero__visual"), 7, 1.01);

  const projects = Array.from(document.querySelectorAll("[data-project]"));

  projects.forEach((project) => {
    const gallery = project.querySelector("[data-gallery]");
    if (!gallery) return;

    const allItems = Array.from(gallery.querySelectorAll(".gallery-item"));
    if (!allItems.length) return;

    const tabsContainer = project.querySelector(".project-tabs");
    const toolbar = document.createElement("div");
    toolbar.className = "project-toolbar";

    if (tabsContainer) {
      tabsContainer.parentNode.insertBefore(toolbar, tabsContainer);
      toolbar.appendChild(tabsContainer);
    } else {
      project.insertBefore(toolbar, gallery);
    }

    const viewToggle = document.createElement("button");
    viewToggle.type = "button";
    viewToggle.className = "view-toggle-btn";
    viewToggle.textContent = "Ver mosaico";
    toolbar.appendChild(viewToggle);

    const firstStageImg = allItems[0].querySelector("img");
    const firstStageSrc = firstStageImg?.getAttribute("src") || "";
    const firstStageAlt = firstStageImg?.getAttribute("alt") || "";

    const stage = document.createElement("div");
    stage.className = "project-stage";
    stage.innerHTML = `
      <img class="stage-ambient-glow" src="${firstStageSrc}" alt="" aria-hidden="true">
      <div class="stage-viewport" role="button" tabindex="0" aria-label="Ampliar imagen activa">
        <img class="stage-backdrop" src="${firstStageSrc}" alt="" aria-hidden="true">
        <img class="stage-main-img" src="${firstStageSrc}" alt="${firstStageAlt}" decoding="async">
        <div class="stage-bar">
          <div class="stage-meta">
            <span class="stage-meta__caption"></span>
          </div>
          <div class="stage-controls">
            <button type="button" class="stage-btn" data-stage-prev aria-label="Vista anterior">Anterior</button>
            <button type="button" class="stage-btn" data-stage-next aria-label="Siguiente vista">Siguiente</button>
            <button type="button" class="stage-btn" data-stage-zoom>Ampliar</button>
          </div>
        </div>
      </div>
    `;

    project.insertBefore(stage, gallery);

    const viewport = stage.querySelector(".stage-viewport");
    const ambientGlow = stage.querySelector(".stage-ambient-glow");
    const backdropImg = stage.querySelector(".stage-backdrop");
    const mainImg = stage.querySelector(".stage-main-img");
    const captionEl = stage.querySelector(".stage-meta__caption");
    const prevBtn = stage.querySelector("[data-stage-prev]");
    const nextBtn = stage.querySelector("[data-stage-next]");
    const zoomBtn = stage.querySelector("[data-stage-zoom]");

    let activeIndex = 0;

    const getVisibleItems = () =>
      allItems.filter((item) => !item.hasAttribute("hidden"));

    const updateStage = (targetIndex, shouldScroll = true) => {
      const visible = getVisibleItems();
      if (!visible.length) return;

      activeIndex = (targetIndex + visible.length) % visible.length;
      const currentItem = visible[activeIndex];
      const img = currentItem.querySelector("img");
      const btn = currentItem.querySelector(".media-button");
      const fullCaption =
        btn?.getAttribute("data-caption") || img?.alt || "";

      allItems.forEach((it) => it.classList.remove("is-selected"));
      currentItem.classList.add("is-selected");

      const w = Number(img.getAttribute("width")) || 16;
      const h = Number(img.getAttribute("height")) || 9;
      viewport.classList.toggle("is-VERTICAL", h > w);

      mainImg.style.opacity = "0.25";
      setTimeout(() => {
        mainImg.src = img.src;
        mainImg.alt = img.alt;
        backdropImg.src = img.src;
        ambientGlow.src = img.src;
        mainImg.style.opacity = "1";
      }, 90);

      captionEl.textContent = fullCaption;
      if (shouldScroll && !gallery.classList.contains("is-grid-mode")) {
        currentItem.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center"
        });
      }
    };

    allItems.forEach((item) => {
      const btn = item.querySelector(".media-button");
      btn?.addEventListener("click", (e) => {
        if (!gallery.classList.contains("is-grid-mode")) {
          e.stopImmediatePropagation();
          const visible = getVisibleItems();
          const idx = visible.indexOf(item);
          if (idx !== -1) updateStage(idx);
        }
      });
    });

    prevBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      updateStage(activeIndex - 1);
    });
    nextBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      updateStage(activeIndex + 1);
    });

    const openCurrentInLightbox = (e) => {
      if (e?.target.closest("[data-stage-prev], [data-stage-next]")) return;
      const visible = getVisibleItems();
      const currentItem = visible[activeIndex];
      const btn = currentItem?.querySelector(".media-button");
      if (btn) openLightboxFromButton(btn, visible);
    };

    zoomBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openCurrentInLightbox();
    });
    viewport.addEventListener("click", openCurrentInLightbox);
    viewport.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        updateStage(activeIndex - 1);
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        updateStage(activeIndex + 1);
      }

      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openCurrentInLightbox();
      }
    });
    attachTilt(viewport, 4, 1.006);

    viewToggle.addEventListener("click", () => {
      const isGrid = gallery.classList.toggle("is-grid-mode");
      viewToggle.classList.toggle("is-active", isGrid);
      viewToggle.textContent = isGrid
        ? "Volver al visor"
        : "Ver mosaico";
    });

    if (tabsContainer) {
      const tabs = Array.from(tabsContainer.querySelectorAll("[data-filter]"));
      tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
          const filter = tab.getAttribute("data-filter");
          tabs.forEach((t) => {
            const active = t === tab;
            t.classList.toggle("is-active", active);
            t.setAttribute("aria-pressed", String(active));
          });

          allItems.forEach((item) => {
            const kind = item.getAttribute("data-kind");
            const show = filter === "all" || kind === filter;
            item.toggleAttribute("hidden", !show);
          });

          updateStage(0);
        });
      });
    }

    updateStage(0, false);
  });

  document.querySelectorAll("[data-compare]").forEach((card) => {
    const range = card.querySelector(".compare-range");
    if (!range) return;
    const syncSplit = () => {
      card.style.setProperty("--split", `${range.value}%`);
    };
    range.addEventListener("input", syncSplit);
    syncSplit();
  });

  const lightbox = document.getElementById("lightbox");
  const lbImg = lightbox?.querySelector(".lightbox__image");
  const lbCaption = lightbox?.querySelector(".lightbox__caption");
  const lbClose = lightbox?.querySelector(".lightbox__close");
  const lbPrev = lightbox?.querySelector(".lightbox__nav--prev");
  const lbNext = lightbox?.querySelector(".lightbox__nav--next");

  let lbGroup = [];
  let lbIndex = 0;

  function renderLightbox() {
    if (!lbGroup.length || !lbImg) return;
    const item = lbGroup[lbIndex];
    const btn = item.querySelector(".media-button");
    const img = item.querySelector("img");
    lbImg.src = img.src;
    lbImg.alt = img.alt || "";
    lbCaption.textContent =
      btn?.getAttribute("data-caption") || img.alt || "";
  }

  function openLightboxFromButton(button, customGroup) {
    if (!lightbox) return;
    const parentGallery = button.closest("[data-gallery]");
    lbGroup =
      customGroup ||
      Array.from(
        parentGallery.querySelectorAll(".gallery-item:not([hidden])")
      );
    const parentItem = button.closest(".gallery-item");
    lbIndex = Math.max(0, lbGroup.indexOf(parentItem));
    renderLightbox();
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
  }

  document.querySelectorAll(".media-button").forEach((btn) => {
    btn.addEventListener("click", () => openLightboxFromButton(btn));
  });

  lbClose?.addEventListener("click", closeLightbox);
  lbPrev?.addEventListener("click", () => {
    lbIndex = (lbIndex - 1 + lbGroup.length) % lbGroup.length;
    renderLightbox();
  });
  lbNext?.addEventListener("click", () => {
    lbIndex = (lbIndex + 1) % lbGroup.length;
    renderLightbox();
  });

  lightbox?.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  window.addEventListener("keydown", (e) => {
    if (!lightbox?.classList.contains("is-open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") lbPrev?.click();
    if (e.key === "ArrowRight") lbNext?.click();
  });

  const sections = document.querySelectorAll("[data-section]");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        }
      });
    },
    { threshold: 0.08 }
  );
  sections.forEach((sec) => observer.observe(sec));
})();
