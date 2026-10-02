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
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const siteHeader = document.querySelector(".site-header");
  const lightbox = document.getElementById("lightbox");
  const heroSection = document.querySelector(".hero");
  const heroLogoVideo = document.querySelector(".hero__logo-video");
  const heroLogoCanvas = document.querySelector(".hero__logo-canvas");

  const syncHeaderState = () => {
    siteHeader?.classList.toggle("is-hidden", window.scrollY > 80);
  };

  syncHeaderState();
  window.addEventListener("scroll", syncHeaderState, { passive: true });

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

  if (heroSection && heroLogoVideo && heroLogoCanvas) {
    const heroLogoStage = document.querySelector(".hero__logo-stage");
    const heroLogoSlot = document.querySelector(".hero__logo-slot");
    const logoCanvasContext = heroLogoCanvas.getContext("2d", { willReadFrequently: true });
    const logoSourceCanvas = document.createElement("canvas");
    const logoSourceContext = logoSourceCanvas.getContext("2d", { willReadFrequently: true });
    let logoCanvasBlocked = false;
    let logoFloating = false;
    let logoIntroComplete = false;
    let logoDuration = 0;
    let logoScrubAnchor = 0;
    let logoScrubRaf = null;
    let logoIntroRaf = null;
    let logoDrawRaf = null;
    let logoIntroTimer = null;
    const deadZone = 0.08;

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    const getLogoScrollProgress = () => {
      const scrubDistance = window.innerHeight * 1.35;
      const raw = clamp((window.scrollY - logoScrubAnchor) / scrubDistance, 0, 1);
      return raw <= deadZone ? 0 : (raw - deadZone) / (1 - deadZone);
    };

    const getLogoEndTime = () => Math.max(0, logoDuration - 0.08);

    const canSeekLogo = () => {
      if (!heroLogoVideo.seekable.length) return false;
      return heroLogoVideo.seekable.end(heroLogoVideo.seekable.length - 1) > 1;
    };

    const canScrubLogo = () => window.location.protocol === "file:" || canSeekLogo();

    const ensureLogoLayer = () => {
      let layer = document.querySelector(".logo-scroll-layer");

      if (!layer) {
        layer = document.createElement("div");
        layer.className = "logo-scroll-layer";
        document.body.prepend(layer);
      }

      return layer;
    };

    const placeLogoInScrollLayer = () => {
      if (logoFloating || !heroLogoStage || !heroLogoSlot) return;

      const rect = heroLogoSlot.getBoundingClientRect();
      heroLogoStage.style.setProperty("--logo-left", `${rect.left}px`);
      heroLogoStage.style.setProperty("--logo-top", `${rect.top}px`);
      heroLogoStage.style.setProperty("--logo-width", `${rect.width}px`);
      heroLogoStage.style.setProperty("--logo-height", `${rect.height}px`);
      heroLogoStage.classList.add("is-scroll-ghost");
      ensureLogoLayer().appendChild(heroLogoStage);
      logoFloating = true;
    };

    const updateLogoScrollMotion = (progress = getLogoScrollProgress()) => {
      if (!heroLogoStage || !logoFloating) return;

      const travel = reduceMotion ? 0 : window.innerHeight * 0.72;
      const eased = progress * progress * (3 - 2 * progress);
      const y = eased * travel;
      const scale = 1 - eased * 0.14;
      const opacity = clamp(1 - Math.max(0, progress - 0.68) / 0.32, 0, 1);

      heroLogoStage.style.transform = `translate3d(0, ${y}px, 0) scale(${scale})`;
      heroLogoStage.style.opacity = String(opacity);
    };

    const syncFloatingLogoRect = () => {
      if (!logoFloating || !heroLogoStage || !heroLogoSlot) return;

      const rect = heroLogoSlot.getBoundingClientRect();
      heroLogoStage.style.setProperty("--logo-left", `${rect.left}px`);
      heroLogoStage.style.setProperty("--logo-top", `${rect.top}px`);
      heroLogoStage.style.setProperty("--logo-width", `${rect.width}px`);
      heroLogoStage.style.setProperty("--logo-height", `${rect.height}px`);
      updateLogoScrollMotion();
    };

    const syncLogoCanvasSize = () => {
      const width = heroLogoVideo.videoWidth || 1280;
      const height = heroLogoVideo.videoHeight || 720;

      if (heroLogoCanvas.width === width && heroLogoCanvas.height === height) return;

      heroLogoCanvas.width = width;
      heroLogoCanvas.height = height;
      logoSourceCanvas.width = width;
      logoSourceCanvas.height = height;
    };

    const applyLogoChroma = (frame) => {
      const data = frame.data;

      for (let i = 0; i < data.length; i += 4) {
        const red = data[i];
        const green = data[i + 1];
        const blue = data[i + 2];
        const maxOther = Math.max(red, blue);
        const greenDominance = green - maxOther;
        const greenRatio = green / Math.max(1, maxOther);

        if (green > 35 && greenDominance > 12 && greenRatio > 1.12) {
          const spillCut = greenRatio > 1.35 ? 80 : 0;
          const alpha = Math.max(0, Math.min(255, 255 - (greenDominance - 12) * 10 - spillCut));
          data[i + 3] = Math.min(data[i + 3], alpha);
        }

        if (data[i + 3] > 0 && greenDominance > 5 && greenRatio > 1.08) {
          data[i + 1] = Math.min(green, maxOther * 0.9);
        }
      }

      return frame;
    };

    const drawLogoFrame = () => {
      if (logoCanvasBlocked || !logoCanvasContext || !logoSourceContext || !heroLogoVideo.videoWidth || !heroLogoVideo.videoHeight) return;

      syncLogoCanvasSize();

      const width = logoSourceCanvas.width;
      const height = logoSourceCanvas.height;

      try {
        logoSourceContext.drawImage(heroLogoVideo, 0, 0, width, height);
        const frame = logoSourceContext.getImageData(0, 0, width, height);
        logoSourceContext.putImageData(applyLogoChroma(frame), 0, 0);
      } catch (error) {
        logoCanvasBlocked = true;
        heroLogoStage?.classList.add("is-video-fallback");
        return;
      }

      logoCanvasContext.clearRect(0, 0, width, height);
      logoCanvasContext.drawImage(logoSourceCanvas, 0, 0, width, height);
    };

    const requestLogoDraw = () => {
      if (logoDrawRaf) return;

      logoDrawRaf = window.requestAnimationFrame(() => {
        logoDrawRaf = null;
        drawLogoFrame();
      });
    };

    const applyLogoScrub = () => {
      logoScrubRaf = null;
      if (!logoIntroComplete || !logoDuration) return;

      const progress = getLogoScrollProgress();
      const targetTime = getLogoEndTime() * (1 - progress);

      updateLogoScrollMotion(progress);

      if (canScrubLogo() && Math.abs(heroLogoVideo.currentTime - targetTime) > 0.025) {
        heroLogoVideo.currentTime = targetTime;
      }

      requestLogoDraw();
    };

    const requestLogoScrub = () => {
      if (!logoIntroComplete || logoScrubRaf) return;
      logoScrubRaf = window.requestAnimationFrame(applyLogoScrub);
    };

    const holdLogoEndFrame = () => {
      if (logoIntroComplete) return;

      logoDuration = heroLogoVideo.duration || logoDuration;
      if (!logoDuration) return;

      heroLogoVideo.pause();
      if (canScrubLogo()) {
        heroLogoVideo.currentTime = getLogoEndTime();
      }
      logoScrubAnchor = window.scrollY;
      logoIntroComplete = true;
      if (logoIntroRaf) window.cancelAnimationFrame(logoIntroRaf);
      if (logoIntroTimer) window.clearTimeout(logoIntroTimer);
      heroLogoVideo.removeEventListener("timeupdate", holdLogoNearEnd);
      placeLogoInScrollLayer();
      updateLogoScrollMotion(0);
      if (canScrubLogo()) requestLogoDraw();
    };

    const holdLogoNearEnd = () => {
      logoDuration = heroLogoVideo.duration || logoDuration;
      if (!logoDuration || heroLogoVideo.currentTime < getLogoEndTime()) return;
      holdLogoEndFrame();
    };

    const monitorLogoIntro = () => {
      drawLogoFrame();
      if (logoIntroComplete) return;
      logoDuration = heroLogoVideo.duration || logoDuration;

      if (logoDuration && heroLogoVideo.currentTime >= getLogoEndTime()) {
        holdLogoEndFrame();
        return;
      }

      logoIntroRaf = window.requestAnimationFrame(monitorLogoIntro);
    };

    const scheduleLogoIntroHold = () => {
      if (!logoDuration || logoIntroComplete) return;
      if (logoIntroTimer) window.clearTimeout(logoIntroTimer);

      const remainingMs = Math.max(0, (getLogoEndTime() - heroLogoVideo.currentTime) * 1000);
      logoIntroTimer = window.setTimeout(holdLogoEndFrame, remainingMs);
    };

    heroLogoVideo.loop = false;
    heroLogoVideo.currentTime = 0;

    heroLogoVideo.addEventListener("loadedmetadata", () => {
      logoDuration = heroLogoVideo.duration || 0;
      heroLogoVideo.currentTime = 0;
      syncLogoCanvasSize();
      scheduleLogoIntroHold();
      requestLogoDraw();
    });

    heroLogoVideo.addEventListener("loadeddata", requestLogoDraw);
    heroLogoVideo.addEventListener("seeked", requestLogoDraw);
    heroLogoVideo.addEventListener("timeupdate", holdLogoNearEnd);
    heroLogoVideo.addEventListener("ended", holdLogoEndFrame, { once: true });
    heroLogoVideo.play?.().then(scheduleLogoIntroHold).catch(() => {});
    logoIntroRaf = window.requestAnimationFrame(monitorLogoIntro);
    window.addEventListener("scroll", requestLogoScrub, { passive: true });
    window.addEventListener("resize", () => {
      syncLogoCanvasSize();
      syncFloatingLogoRect();
      requestLogoScrub();
      requestLogoDraw();
    });
  }

  attachTilt(document.querySelector(".hero__visual"), 7, 1.01);

  const projects = Array.from(document.querySelectorAll("[data-project]"));
  const curatedGalleryImages = {
    arrogante: [
      "IMG_0514.JPG.jpeg",
      "IMG_0516.JPG.jpeg",
      "IMG_0521.JPG.jpeg",
      "IMG_0546.JPG.jpeg",
      "IMG_0550.JPG.jpeg",
      "IMG_0552.JPG.jpeg",
      "IMG_0558.JPG.jpeg"
    ],
    "lil-silly": [
      "IMG_0532.JPG.jpeg",
      "IMG_0535.JPG.jpeg",
      "IMG_0607.JPG.jpeg",
      "IMG_0612.JPG.jpeg",
      "IMG_2331.PNG",
      "IMG_2333.JPG.jpeg",
      "IMG_2335.JPG.jpeg"
    ],
    "madam-zhou": [
      "IMG_2339.JPG.jpeg",
      "IMG_2340.JPG.jpeg",
      "IMG_2341.JPG.jpeg",
      "IMG_2342.JPG.jpeg",
      "WhatsApp%20Image%202026-10-01%20at%2000.09.28.jpeg",
      "WhatsApp%20Image%202026-10-01%20at%2000.09.43.jpeg"
    ],
    grds: [
      "WhatsApp%20Image%202026-09-30%20at%2021.00.51%20%282%29.jpeg",
      "WhatsApp%20Image%202026-09-30%20at%2021.00.52%20%281%29.jpeg",
      "WhatsApp%20Image%202026-09-30%20at%2021.00.53%20%282%29.jpeg",
      "WhatsApp%20Image%202026-09-30%20at%2021.00.54.jpeg",
      "WhatsApp%20Image%202026-10-01%20at%2000.10.59.jpeg",
      "WhatsApp%20Image%202026-10-01%20at%2000.12.37.jpeg"
    ],
    "not-your-nona": [
      "WhatsApp%20Image%202026-09-30%20at%2021.00.45.jpeg",
      "WhatsApp%20Image%202026-09-30%20at%2021.00.48.jpeg",
      "WhatsApp%20Image%202026-09-30%20at%2021.00.49%20%281%29.jpeg",
      "WhatsApp%20Image%202026-09-30%20at%2021.00.50%20%281%29.jpeg",
      "WhatsApp%20Image%202026-09-30%20at%2021.00.51.jpeg"
    ]
  };

  const curateGallery = (project, gallery) => {
    const allowed = curatedGalleryImages[project.id];
    if (!allowed) return;

    gallery.querySelectorAll(".gallery-item").forEach((item) => {
      const src = item.querySelector("img")?.getAttribute("src") || "";
      const keep = allowed.some((name) => src.endsWith(name));
      if (!keep) item.remove();
    });
  };

  projects.forEach((project) => {
    const gallery = project.querySelector("[data-gallery]");
    if (!gallery) return;

    curateGallery(project, gallery);

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
    viewToggle.setAttribute("aria-label", "Ver mosaico");
    viewToggle.innerHTML = '<span class="view-toggle-icon" aria-hidden="true"></span>';
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
      </div>
    `;

    project.insertBefore(stage, gallery);

    const viewport = stage.querySelector(".stage-viewport");
    const ambientGlow = stage.querySelector(".stage-ambient-glow");
    const backdropImg = stage.querySelector(".stage-backdrop");
    const mainImg = stage.querySelector(".stage-main-img");

    let activeIndex = 0;
    let autoplayId = null;
    let projectInView = false;
    let stageSwitchTimer = null;
    let swipeStart = null;
    let suppressStageClick = false;

    const getVisibleItems = () =>
      allItems.filter((item) => !item.hasAttribute("hidden"));

    const syncActiveThumb = (currentItem) => {
      if (gallery.classList.contains("is-grid-mode")) return;
      const targetLeft =
        currentItem.offsetLeft -
        gallery.clientWidth / 2 +
        currentItem.clientWidth / 2;

      gallery.scrollTo({
        left: Math.max(0, targetLeft),
        behavior: reduceMotion ? "auto" : "smooth"
      });
    };

    const updateStage = (targetIndex, shouldScroll = true) => {
      const visible = getVisibleItems();
      if (!visible.length) return;

      activeIndex = (targetIndex + visible.length) % visible.length;
      const currentItem = visible[activeIndex];
      const img = currentItem.querySelector("img");

      allItems.forEach((it) => it.classList.remove("is-selected"));
      currentItem.classList.add("is-selected");

      const w = Number(img.getAttribute("width")) || 16;
      const h = Number(img.getAttribute("height")) || 9;
      viewport.classList.toggle("is-VERTICAL", h > w);

      window.clearTimeout(stageSwitchTimer);
      mainImg.style.opacity = "0";

      stageSwitchTimer = window.setTimeout(() => {
        mainImg.src = img.src;
        mainImg.alt = img.alt;
        backdropImg.src = img.src;
        ambientGlow.src = img.src;
        window.requestAnimationFrame(() => {
          mainImg.style.opacity = "1";
        });
      }, 220);

      if (shouldScroll && !gallery.classList.contains("is-grid-mode")) {
        syncActiveThumb(currentItem);
      }
    };

    const startAutoplay = () => {
      if (reduceMotion || autoplayId || gallery.classList.contains("is-grid-mode")) return;

      autoplayId = window.setInterval(() => {
        const visible = getVisibleItems();
        const lightboxOpen = lightbox?.classList.contains("is-open");
        if (!projectInView || document.hidden || lightboxOpen || visible.length < 2) return;
        updateStage(activeIndex + 1, false);
      }, 4200);
    };

    const stopAutoplay = () => {
      if (!autoplayId) return;
      window.clearInterval(autoplayId);
      autoplayId = null;
    };

    const restartAutoplay = (delay = 6500) => {
      stopAutoplay();
      if (!projectInView || reduceMotion) return;
      window.setTimeout(() => {
        if (projectInView) startAutoplay();
      }, delay);
    };

    allItems.forEach((item) => {
      const btn = item.querySelector(".media-button");
      btn?.addEventListener("click", (e) => {
        if (!gallery.classList.contains("is-grid-mode")) {
          e.stopImmediatePropagation();
          const visible = getVisibleItems();
          const idx = visible.indexOf(item);
          if (idx !== -1) {
            updateStage(idx);
            restartAutoplay();
          }
        }
      });
    });

    const openCurrentInLightbox = (e) => {
      if (suppressStageClick) {
        e?.preventDefault();
        suppressStageClick = false;
        return;
      }

      const visible = getVisibleItems();
      const currentItem = visible[activeIndex];
      const btn = currentItem?.querySelector(".media-button");
      if (btn) openLightboxFromButton(btn, visible);
    };

    viewport.addEventListener("pointerdown", (e) => {
      if (!e.isPrimary) return;
      swipeStart = {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY
      };
      try {
        viewport.setPointerCapture?.(e.pointerId);
      } catch {
        /* Some mobile browsers manage pointer capture internally. */
      }
    });

    viewport.addEventListener("pointerup", (e) => {
      if (!swipeStart || swipeStart.id !== e.pointerId) return;

      const dx = e.clientX - swipeStart.x;
      const dy = e.clientY - swipeStart.y;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      swipeStart = null;
      try {
        viewport.releasePointerCapture?.(e.pointerId);
      } catch {
        /* Ignore release mismatches after native touch cancellation. */
      }

      if (absX < 44 || absX < absY * 1.25) return;

      e.preventDefault();
      suppressStageClick = true;
      updateStage(dx < 0 ? activeIndex + 1 : activeIndex - 1);
      restartAutoplay();
      window.setTimeout(() => {
        suppressStageClick = false;
      }, 260);
    });

    viewport.addEventListener("pointercancel", () => {
      swipeStart = null;
    });

    viewport.addEventListener("click", openCurrentInLightbox);
    viewport.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        updateStage(activeIndex - 1);
        restartAutoplay();
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        updateStage(activeIndex + 1);
        restartAutoplay();
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
      viewToggle.setAttribute(
        "aria-label",
        isGrid ? "Volver al visor" : "Ver mosaico"
      );
      if (isGrid) {
        stopAutoplay();
      } else if (projectInView) {
        startAutoplay();
      }
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
          restartAutoplay();
        });
      });
    }

    updateStage(0, false);

    if (!reduceMotion) {
      const projectAutoplayObserver = new IntersectionObserver(
        ([entry]) => {
          projectInView = entry.isIntersecting;
          if (projectInView) {
            startAutoplay();
          } else {
            stopAutoplay();
          }
        },
        { rootMargin: "-18% 0px -18% 0px", threshold: 0.18 }
      );
      projectAutoplayObserver.observe(project);
    }
  });

  document.querySelectorAll("[data-compare]").forEach((card, index) => {
    const range = card.querySelector(".compare-range");
    if (!range) return;

    const minSplit = 0;
    const maxSplit = 100;
    const duration = 14000;
    let isInView = false;
    let rafId = null;
    let pauseUntil = 0;

    const syncSplit = (value) => {
      const split = Math.min(maxSplit, Math.max(minSplit, Number(value)));
      card.style.setProperty("--split", `${split}%`);
      range.value = String(Math.round(split));
    };

    const stopCompareLoop = () => {
      if (!rafId) return;
      window.cancelAnimationFrame(rafId);
      rafId = null;
      card.classList.remove("is-auto-playing");
    };

    const tickCompareLoop = (now) => {
      if (!isInView || reduceMotion) {
        stopCompareLoop();
        return;
      }

      if (!document.hidden && now >= pauseUntil) {
        const progress = ((now + index * 1300) % duration) / duration;
        const eased = 0.5 - Math.cos(progress * Math.PI * 2) / 2;
        syncSplit(minSplit + (maxSplit - minSplit) * eased);
      }

      rafId = window.requestAnimationFrame(tickCompareLoop);
    };

    const startCompareLoop = () => {
      if (reduceMotion || rafId) return;
      card.classList.add("is-auto-playing");
      rafId = window.requestAnimationFrame(tickCompareLoop);
    };

    range.addEventListener("input", () => {
      pauseUntil = performance.now() + 6000;
      syncSplit(range.value);
    });

    range.addEventListener("pointerdown", () => {
      pauseUntil = performance.now() + 6000;
    });

    syncSplit(range.value);

    const compareObserver = new IntersectionObserver(
      ([entry]) => {
        isInView = entry.isIntersecting;
        if (isInView) {
          startCompareLoop();
        } else {
          stopCompareLoop();
        }
      },
      { rootMargin: "-12% 0px -12% 0px", threshold: 0.22 }
    );

    compareObserver.observe(card);
  });

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
