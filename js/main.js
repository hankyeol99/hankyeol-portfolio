/**
 * Hankyeol Kim - Portfolio
 *  - Mobile navbar toggle
 *  - Reveal-on-scroll (IntersectionObserver)
 *  - Demo toggle (tabs) on project-detail design system
 */

(function () {
  "use strict";

  /* ---------- Navbar toggle ---------- */
  const navbar = document.querySelector("[data-navbar]");
  if (navbar) {
    const toggle = navbar.querySelector("[data-navbar-toggle]");
    const menu = navbar.querySelector("[data-navbar-menu]");

    const setOpen = (open) => {
      navbar.classList.toggle("is-open", open);
      if (toggle) toggle.setAttribute("aria-expanded", String(open));
      if (menu) menu.setAttribute("aria-hidden", String(!open));
    };

    if (toggle) {
      toggle.setAttribute("aria-expanded", "false");
      toggle.addEventListener("click", () => {
        setOpen(!navbar.classList.contains("is-open"));
      });
    }

    // Close menu when a link inside is clicked (mobile)
    if (menu) {
      menu.addEventListener("click", (e) => {
        const target = e.target.closest("a");
        if (target) setOpen(false);
      });
    }

    // Close menu when crossing back to desktop
    const desktop = window.matchMedia("(min-width: 992px)");
    const onChange = (mql) => {
      if (mql.matches) setOpen(false);
    };
    if (desktop.addEventListener) {
      desktop.addEventListener("change", onChange);
    } else if (desktop.addListener) {
      desktop.addListener(onChange);
    }
  }

  /* ---------- Reveal-on-scroll ---------- */
  const reveals = document.querySelectorAll(".reveal");
  if (reveals.length) {
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "0px 0px -10% 0px", threshold: 0.05 }
      );
      reveals.forEach((el) => observer.observe(el));
    } else {
      // Fallback: just show all
      reveals.forEach((el) => el.classList.add("is-visible"));
    }
  }

  /* ---------- Demo toggle (tabs) on design-system page ---------- */
  document.querySelectorAll("[data-toggle]").forEach((group) => {
    const options = group.querySelectorAll("[data-toggle-option]");
    options.forEach((opt) => {
      opt.addEventListener("click", () => {
        options.forEach((o) => o.classList.remove("is-active"));
        opt.classList.add("is-active");
      });
    });
  });

  /* ---------- Image-split: size columns by each image's aspect ratio ---------- */
  document.querySelectorAll(".image-split .image-block__image").forEach((img) => {
    const apply = () => {
      if (!img.naturalWidth || !img.naturalHeight) return;
      const ar = img.naturalWidth / img.naturalHeight;
      const block = img.closest(".image-block");
      if (block) block.style.setProperty("--ar", ar);
    };
    if (img.complete && img.naturalWidth) apply();
    else img.addEventListener("load", apply);
  });

  /* ---------- Generic carousel: drag-to-scroll + arrow buttons ---------- */
  document.querySelectorAll("[data-carousel]").forEach((section) => {
    const track = section.querySelector("[data-carousel-track]");
    const prev = section.querySelector("[data-carousel-prev]");
    const next = section.querySelector("[data-carousel-next]");
    if (!track) return;

    /* Drag-to-scroll (mouse) */
    let isDown = false;
    let startX = 0;
    let startScrollLeft = 0;
    let moved = 0;

    const onDown = (e) => {
      isDown = true;
      moved = 0;
      track.classList.add("is-dragging");
      startX = e.pageX;
      startScrollLeft = track.scrollLeft;
    };

    const onMove = (e) => {
      if (!isDown) return;
      const walk = e.pageX - startX;
      moved = Math.abs(walk);
      track.scrollLeft = startScrollLeft - walk;
    };

    const onUp = () => {
      if (!isDown) return;
      isDown = false;
      track.classList.remove("is-dragging");
    };

    track.addEventListener("mousedown", onDown);
    track.addEventListener("mousemove", onMove);
    track.addEventListener("mouseleave", onUp);
    track.addEventListener("mouseup", onUp);

    // Suppress click on cards if a drag actually happened
    track.addEventListener("click", (e) => {
      if (moved > 6) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);

    /* Arrow buttons -> scroll by one card width */
    const scrollByCard = (dir) => {
      const card = track.firstElementChild;
      if (!card) return;
      const styles = getComputedStyle(track);
      const gap = parseFloat(styles.columnGap || styles.gap) || 0;
      const step = card.getBoundingClientRect().width + gap;
      track.scrollBy({ left: dir * step, behavior: "smooth" });
    };

    if (prev) prev.addEventListener("click", () => scrollByCard(-1));
    if (next) next.addEventListener("click", () => scrollByCard(1));

    /* Update disabled state of arrow buttons */
    const updateButtons = () => {
      if (!prev || !next) return;
      const max = track.scrollWidth - track.clientWidth;
      prev.disabled = track.scrollLeft <= 1;
      next.disabled = track.scrollLeft >= max - 1;
    };

    track.addEventListener("scroll", updateButtons, { passive: true });
    window.addEventListener("resize", updateButtons);
    updateButtons();
  });

  /* ---------- Project tag filter (home page) ---------- */
  const filtersHost = document.querySelector("[data-project-filters]");
  if (filtersHost) {
    const grid = document.querySelector(".project-grid");
    const cards = grid ? Array.from(grid.querySelectorAll(".project-card")) : [];

    if (cards.length) {
      // Collect tags per card and the unique-tag set
      const tagSet = new Map(); // tag -> count
      cards.forEach((card) => {
        const tags = Array.from(card.querySelectorAll(".project-tag"))
          .map((el) => el.textContent.trim())
          .filter(Boolean);
        card.dataset.tags = tags.join("|");
        tags.forEach((t) => tagSet.set(t, (tagSet.get(t) || 0) + 1));
      });

      const ALL = "All";
      const orderedTags = [ALL, ...Array.from(tagSet.keys())];

      orderedTags.forEach((tag, idx) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "project-filter" + (idx === 0 ? " is-active" : "");
        btn.dataset.filter = tag;
        btn.setAttribute("role", "tab");
        btn.setAttribute("aria-selected", idx === 0 ? "true" : "false");
        const count = tag === ALL ? cards.length : tagSet.get(tag);
        btn.innerHTML = `${tag}<span class="project-filter__count">${count}</span>`;
        filtersHost.appendChild(btn);
      });

      const cols = grid ? Array.from(grid.querySelectorAll(".project-grid__col")) : [];

      const updateEmptyColumns = () => {
        cols.forEach((col) => {
          const hasVisible = col.querySelector(".project-card:not(.is-hidden)");
          col.classList.toggle("is-empty", !hasVisible);
        });
      };

      filtersHost.addEventListener("click", (e) => {
        const btn = e.target.closest(".project-filter");
        if (!btn) return;
        const filter = btn.dataset.filter;

        filtersHost.querySelectorAll(".project-filter").forEach((b) => {
          const active = b === btn;
          b.classList.toggle("is-active", active);
          b.setAttribute("aria-selected", String(active));
        });

        cards.forEach((card) => {
          const tags = (card.dataset.tags || "").split("|");
          const visible = filter === ALL || tags.includes(filter);
          card.classList.toggle("is-hidden", !visible);
        });

        updateEmptyColumns();
      });
    }
  }

  /* ---------- Footer copy-to-clipboard buttons ---------- */
  const copyTextToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand("copy"); } catch {}
      document.body.removeChild(ta);
      return ok;
    }
  };

  document.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-copy]");
    if (!btn) return;
    e.preventDefault();
    const text = btn.dataset.copy;
    if (!text) return;
    const original = btn.dataset.copyDefault || btn.textContent;
    const ok = await copyTextToClipboard(text);
    btn.textContent = ok ? "복사됨" : "복사 실패";
    btn.classList.add("is-copied");
    clearTimeout(btn._copyTimer);
    btn._copyTimer = setTimeout(() => {
      btn.textContent = original;
      btn.classList.remove("is-copied");
    }, 1400);
  });

  /* ---------- Contact modal ---------- */
  const CONTACT_EMAIL = "sk41495133@gmail.com";
  const CONTACT_LINKEDIN = "https://www.linkedin.com/in/hankyeolkim";

  let contactModal = null;
  let lastFocusedTrigger = null;

  const buildContactModal = () => {
    const root = document.createElement("div");
    root.className = "contact-modal";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-labelledby", "contact-modal-title");
    root.setAttribute("aria-hidden", "true");
    root.innerHTML = `
      <div class="contact-modal__backdrop" data-contact-close></div>
      <div class="contact-modal__panel">
        <button type="button" class="contact-modal__close" data-contact-close aria-label="닫기">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
        </button>
        <h2 class="contact-modal__title" id="contact-modal-title">Contact</h2>
        <p class="contact-modal__lede">메일 또는 LinkedIn으로 편하게 연락 주세요.</p>
        <div class="contact-modal__email">
          <span class="contact-modal__email-text" data-contact-email>${CONTACT_EMAIL}</span>
          <button type="button" class="contact-modal__copy" data-contact-copy>복사</button>
        </div>
        <div class="contact-modal__actions">
          <a href="${CONTACT_LINKEDIN}" target="_blank" rel="noopener noreferrer" class="contact-modal__btn contact-modal__btn--ghost">
            <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.37V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.55C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.72C24 .77 23.2 0 22.22 0z"/>
            </svg>
            LinkedIn
          </a>
          <a href="mailto:${CONTACT_EMAIL}" class="contact-modal__btn contact-modal__btn--primary">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M4 6h16c.55 0 1 .45 1 1v10c0 .55-.45 1-1 1H4c-.55 0-1-.45-1-1V7c0-.55.45-1 1-1z" stroke="currentColor" stroke-width="1.6"/>
              <path d="M3.5 7L12 13L20.5 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            이메일 보내기
          </a>
        </div>
      </div>
    `;
    document.body.appendChild(root);

    root.addEventListener("click", (e) => {
      if (e.target.closest("[data-contact-close]")) closeContactModal();
    });

    const copyBtn = root.querySelector("[data-contact-copy]");
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(CONTACT_EMAIL);
      } catch {
        // Fallback for older browsers / non-secure contexts
        const range = document.createRange();
        range.selectNodeContents(root.querySelector("[data-contact-email]"));
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        try { document.execCommand("copy"); } catch {}
        sel.removeAllRanges();
      }
      const original = copyBtn.textContent;
      copyBtn.textContent = "복사됨";
      copyBtn.classList.add("is-copied");
      setTimeout(() => {
        copyBtn.textContent = original;
        copyBtn.classList.remove("is-copied");
      }, 1500);
    });

    return root;
  };

  const openContactModal = (trigger) => {
    if (!contactModal) contactModal = buildContactModal();
    lastFocusedTrigger = trigger || null;
    contactModal.classList.add("is-open");
    contactModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    const closeBtn = contactModal.querySelector(".contact-modal__close");
    if (closeBtn) closeBtn.focus();
  };

  const closeContactModal = () => {
    if (!contactModal) return;
    contactModal.classList.remove("is-open");
    contactModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocusedTrigger && typeof lastFocusedTrigger.focus === "function") {
      lastFocusedTrigger.focus();
    }
  };

  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-contact-trigger]");
    if (!trigger) return;
    e.preventDefault();
    openContactModal(trigger);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && contactModal && contactModal.classList.contains("is-open")) {
      closeContactModal();
    }
  });
})();
