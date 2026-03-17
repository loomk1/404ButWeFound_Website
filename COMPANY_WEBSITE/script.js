const PRICING = {
  starter: { label: "Starter", base: 1500, includedPages: 1, range: "₹1000 – ₹2000 (Starting)" },
  business: { label: "Business", base: 3500, includedPages: 5, range: "₹3000 – ₹4000" },
  pro: { label: "Pro", base: 5000, includedPages: 10, range: "₹5000 and above" },
};

const ADDONS = {
  aiChatbot: { label: "AI Chatbot Integration", price: 1000, availability: ["starter", "business", "pro"] },
  advForms: { label: "Advanced Contact Forms", price: 300, availability: ["starter", "business", "pro"] },
  oneDayRepair: { label: "One-Day Website Repair", price: 500, availability: ["starter", "business", "pro"] },
  seoUpgrade: { label: "SEO Optimization Upgrade", price: 650, availability: ["business", "pro"] },
  socialIntegration: { label: "Social Media Integration", price: 100, availability: ["business", "pro"] },
  analyticsDash: { label: "Analytics Dashboard", price: 500, availability: ["business", "pro"] },
  blogSystem: { label: "Blog System", price: 600, availability: ["business", "pro"] },
  ecomSetup: { label: "E-commerce Store Setup", price: 700, availability: ["pro"] },
  adminDash: { label: "Custom Admin Dashboard", price: 500, availability: ["pro"] },
  advAI: { label: "Advanced AI Features", price: 1500, availability: ["pro"] },
  monthlyMgmt: { label: "Monthly Website Management", price: 1000, availability: ["pro"] },
};

const EXTRA_PAGE_PRICE = 500;

function formatINR(amount) {
  return `₹${Math.max(0, Math.round(amount)).toLocaleString("en-IN")}`;
}

function qs(sel, root = document) {
  return root.querySelector(sel);
}
function qsa(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

function setupNav() {
  const toggle = qs(".nav-toggle");
  const links = qs("#nav-links");
  if (!toggle || !links) return;

  const setOpen = (open) => {
    links.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };

  toggle.addEventListener("click", () => setOpen(!links.classList.contains("open")));

  qsa("a", links).forEach((a) => {
    a.addEventListener("click", () => setOpen(false));
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });

  document.addEventListener("click", (e) => {
    if (!links.classList.contains("open")) return;
    if (toggle.contains(e.target) || links.contains(e.target)) return;
    setOpen(false);
  });
}

function setupReveal() {
  const els = qsa(".reveal");
  if (!els.length) return;

  if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
    els.forEach((el) => {
      // Remove any CSS transition that might conflict with GSAP
      el.style.transition = "none";
      el.style.opacity = "0";
      
      gsap.fromTo(el, 
        { opacity: 0, y: 32 }, 
        {
          opacity: 1, 
          y: 0, 
          duration: 0.8, 
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none none"
          }
        }
      );
    });
  } else {
    // Fallback if GSAP fails to load
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("show");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.14 }
    );
    els.forEach((el) => io.observe(el));
  }
}

function setupYear() {
  const year = qs("#year");
  if (year) year.textContent = String(new Date().getFullYear());
}

function setupCalculator() {
  const planEl = qs("#plan");
  const pagesEl = qs("#pages");
  const pagesHint = qs("#pages-hint");
  const totalEl = qs("#total");
  const totalSub = qs("#total-sub");
  const clearAddons = qs("#clear-addons");
  const requestBtn = qs("#request-website");
  const checklist = qs("#addons-checklist");
  if (!planEl || !pagesEl || !totalEl || !checklist) return;

  const addonRows = qsa(".check-item", checklist);
  const addonInputs = qsa("input[type='checkbox'][data-addon]", checklist);

  const sanitizePages = () => {
    const raw = Number(pagesEl.value || 0);
    const pages = Number.isFinite(raw) ? Math.max(1, Math.floor(raw)) : 1;
    pagesEl.value = String(pages);
    return pages;
  };

  const getSelectedAddons = () => {
    return addonInputs.filter((i) => i.checked).map((i) => i.getAttribute("data-addon"));
  };

  const applyAvailability = () => {
    const plan = planEl.value;
    addonRows.forEach((row) => {
      const availability = (row.getAttribute("data-availability") || "starter,business,pro")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const input = qs("input[type='checkbox'][data-addon]", row);
      const allowed = availability.includes(plan);

      row.classList.toggle("unavailable", !allowed);
      if (input) {
        input.disabled = !allowed;
        if (!allowed) input.checked = false;
      }
    });
  };

  const updatePagesHint = () => {
    const plan = planEl.value;
    const pages = sanitizePages();
    const pagesVal = qs("#pages-val");
    if (pagesVal) pagesVal.textContent = pages;
    
    const included = PRICING[plan].includedPages;
    const extra = Math.max(0, pages - included);
    pagesHint.textContent =
      extra > 0
        ? `${included} pages included. Extra pages: ${extra} × ${formatINR(EXTRA_PAGE_PRICE)}`
        : `${included} pages included in this plan.`;
  };

  const computeTotal = () => {
    const plan = planEl.value;
    const pages = sanitizePages();
    const planInfo = PRICING[plan];

    const extraPages = Math.max(0, pages - planInfo.includedPages);
    const extraPagesCost = extraPages * EXTRA_PAGE_PRICE;

    const selected = getSelectedAddons();
    const addonsCost = selected.reduce((sum, key) => sum + (ADDONS[key]?.price || 0), 0);

    const total = planInfo.base + extraPagesCost + addonsCost;

    totalEl.textContent = formatINR(total);

    const parts = [];
    parts.push(`${planInfo.label} base: ${formatINR(planInfo.base)} (${planInfo.range})`);
    if (extraPages > 0) parts.push(`Extra pages: ${extraPages} × ${formatINR(EXTRA_PAGE_PRICE)} = ${formatINR(extraPagesCost)}`);
    if (selected.length) parts.push(`Add-ons: ${selected.length} selected = ${formatINR(addonsCost)}`);
    totalSub.textContent = parts.join(" • ");

    return { plan, pages, extraPages, selected, total };
  };

  const fillContactFromEstimate = () => {
    const estimate = computeTotal();
    const nameEl = qs("#name");
    const emailEl = qs("#email");
    const msgEl = qs("#message");
    if (!msgEl) return;

    const selectedLabels = estimate.selected.map((k) => `${ADDONS[k]?.label || k} (${formatINR(ADDONS[k]?.price || 0)})`);
    const addOnLines = selectedLabels.length ? selectedLabels.map((s) => `- ${s}`).join("\n") : "- None";

    const text =
      `Hi 404ButWeFound,\n\n` +
      `I want to request a website estimate:\n\n` +
      `Plan: ${PRICING[estimate.plan].label}\n` +
      `Pages: ${estimate.pages}\n` +
      `Add-ons:\n${addOnLines}\n\n` +
      `Estimated Total: ${formatINR(estimate.total)}\n\n` +
      `Notes (optional):\n- \n\n` +
      `Thanks!`;

    msgEl.value = text;

    const contact = qs("#contact");
    if (contact) contact.scrollIntoView({ behavior: "smooth", block: "start" });

    const target = nameEl?.value ? emailEl : nameEl;
    target?.focus?.();
  };

  planEl.addEventListener("change", () => {
    applyAvailability();
    updatePagesHint();
    computeTotal();
  });
  pagesEl.addEventListener("input", () => {
    updatePagesHint();
    computeTotal();
  });
  addonInputs.forEach((i) => i.addEventListener("change", computeTotal));

  clearAddons?.addEventListener("click", () => {
    addonInputs.forEach((i) => (i.checked = false));
    computeTotal();
  });
  requestBtn?.addEventListener("click", fillContactFromEstimate);

  applyAvailability();
  updatePagesHint();
  computeTotal();
}

function setupContactForm() {
  const form = qs("#contact-form");
  const note = qs("#form-note");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    const name = data.name?.trim();
    const email = data.email?.trim();
    const service = data.service?.trim();
    const budget = data.budget?.trim();
    const message = data.message?.trim();

    if (!name || !email || !service || !budget || !message) {
      if (note) {
        note.textContent = "Please fill in all fields.";
        note.style.color = "#ff5c7a";
      }
      return;
    }

    if (note) {
      note.textContent = "Sending your message...";
      note.style.color = "var(--brand)";
    }

    try {
      const scriptURL = "https://script.google.com/macros/s/AKfycbxUZtCCvAtWexpeMhlsrpG9b0UTXLCjpXemo-sEZEN-glVBk-MnLN1bfbYcs2Ud6nrCeA/exec";
      const response = await fetch(scriptURL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        if (typeof gtag === "function") {
          gtag('event', 'submission', {
            'event_category': 'Form',
            'event_label': 'Contact Form Success'
          });
        }
        if (note) {
          note.textContent = "Thanks! We'll get back to you within 24 hours.";
          note.style.color = "#2cff8a";
        }
        form.reset();
        
        setTimeout(() => {
          if (note) {
            note.textContent = "We usually respond within 24 hours.";
            note.style.color = "var(--muted2)";
          }
        }, 5000);
      } else {
        throw new Error("Form submission failed");
      }
    } catch (error) {
      if (note) {
        note.textContent = "Oops! There was a problem. Please try again.";
        note.style.color = "#ff5c7a";
      }
      console.error("Form error:", error);
    }
  });
}



function setupScrollProgress() {
  const progressBar = qs("#scroll-progress");
  if (!progressBar) return;

  function updateScroll() {
    const scrollPx = document.documentElement.scrollTop;
    const winHeightPx =
      document.documentElement.scrollHeight -
      document.documentElement.clientHeight;
    
    // Avoid division by zero
    if (winHeightPx === 0) return;
    
    const scrolled = (scrollPx / winHeightPx) * 100;
    progressBar.style.width = `${scrolled}%`;
  }

  window.addEventListener("scroll", updateScroll, { passive: true });
  updateScroll(); // init
}



function setupMagneticButtons() {
  if (window.matchMedia("(pointer: coarse)").matches) return;

  const magnetics = qsa("[data-magnetic]");
  magnetics.forEach((btn) => {
    btn.addEventListener("mousemove", (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const pull = 0.3; 
      btn.style.transform = `translate(${x * pull}px, ${y * pull}px)`;
    });

    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "";
    });
  });
}

function setupTilt() {
  if (window.matchMedia("(pointer: coarse)").matches) return;

  const tiltElements = qsa("[data-tilt]");
  tiltElements.forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const maxTilt = 8;
      const tiltX = ((y - centerY) / centerY) * -maxTilt;
      const tiltY = ((x - centerX) / centerX) * maxTilt;
      
      if (typeof gsap !== "undefined") {
        gsap.to(el, {
          rotationX: tiltX,
          rotationY: tiltY,
          scale: 1.02,
          duration: 0.4,
          ease: "power2.out",
          transformPerspective: 1000
        });
      } else {
        el.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`;
      }
    });

    el.addEventListener("mouseleave", () => {
      if (typeof gsap !== "undefined") {
        gsap.to(el, {
          rotationX: 0,
          rotationY: 0,
          scale: 1,
          duration: 0.7,
          ease: "power2.out",
          transformPerspective: 1000
        });
      } else {
        el.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
      }
    });
  });
}

function setupCounters() {
  const counters = qsa(".counter-value");
  if (!counters.length || typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

  counters.forEach(counter => {
    const target = parseInt(counter.getAttribute("data-target"), 10) || 0;
    const obj = { val: 0 };
    
    gsap.to(obj, {
      val: target,
      duration: 2.5,
      ease: "power2.out",
      scrollTrigger: {
        trigger: counter,
        start: "top 85%",
        toggleActions: "play none none none"
      },
      onUpdate: () => {
        counter.textContent = Math.floor(obj.val) + "+";
      }
    });
  });
}

function setupAnalytics() {
  const buttons = qsa(".btn, button");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const btnText = btn.innerText.trim() || btn.getAttribute("aria-label") || "Button";
      if (typeof gtag === "function") {
        gtag('event', 'click', {
          'event_category': 'Engagement',
          'event_label': btnText
        });
      }
    });
  });
}

function setupDarkMode() {
  const toggle = qs("#dark-mode-toggle");
  const html = document.documentElement;
  
  // Check for saved preference
  const savedTheme = localStorage.getItem("theme") || "dark";
  html.setAttribute("data-theme", savedTheme);
  
  toggle?.addEventListener("click", () => {
    const currentTheme = html.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    
    html.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    
    // Add a quick animation effect on toggle
    gsap.fromTo("body", { opacity: 0.8 }, { opacity: 1, duration: 0.5 });
  });
}

function setupParticles() {
  if (typeof tsParticles === "undefined") return;
  
  tsParticles.load({
    id: "tsparticles",
    options: {
      fpsLimit: 60,
      interactivity: {
        events: {
          onHover: { enable: true, mode: "grab" },
        },
        modes: {
          grab: { distance: 140, links: { opacity: 0.5 } },
        },
      },
      particles: {
        color: { value: "#5ea1ff" },
        links: {
          color: "#5ea1ff",
          distance: 150,
          enable: true,
          opacity: 0.2,
          width: 1,
        },
        move: {
          enable: true,
          speed: 1,
          direction: "none",
          random: true,
          straight: false,
          outModes: { default: "out" },
        },
        number: {
          density: { enable: true, area: 800 },
          value: 40,
        },
        opacity: { value: 0.3 },
        shape: { type: "circle" },
        size: { value: { min: 1, max: 3 } },
      },
      detectRetina: true,
    },
  });
}

function setupHeroAnimations() {
  const title = qs("#hero-title");
  const subtitle = qs("#hero-subtitle");
  if (!title || !subtitle) return;

  const propositions = [
    "Websites That Actually Get Found.",
    "Websites That Convert Visitors.",
    "Websites Built For Growth.",
    "Websites That Scale Fast."
  ];
  
  let index = 0;
  
  setInterval(() => {
    index = (index + 1) % propositions.length;
    
    gsap.to(title, {
      opacity: 0,
      y: -10,
      duration: 0.5,
      onComplete: () => {
        title.textContent = propositions[index];
        gsap.to(title, { opacity: 1, y: 0, duration: 0.5 });
      }
    });
  }, 4000);
}

function setupBrandGlitch() {
  const brandMark = qs(".brand-mark");
  if (!brandMark) return;
  
  let clickCount = 0;
  brandMark.addEventListener("click", () => {
    clickCount++;
    if (clickCount === 5) {
      brandMark.classList.add("glitch");
      if (typeof confetti !== "undefined") {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#5ea1ff', '#8c5cff', '#35d5ff']
        });
      }
      setTimeout(() => {
        brandMark.classList.remove("glitch");
        clickCount = 0;
      }, 3000);
    }
  });
}

function setupVisitorCounter() {
  const countEl = qs("#visitor-count");
  if (!countEl) return;
  
  let count = parseInt(countEl.textContent, 10);
  
  setInterval(() => {
    // Randomly change count by +/- 1 or 2 to make it look realistic
    const change = Math.floor(Math.random() * 5) - 2;
    count = Math.max(5, count + change);
    countEl.textContent = count;
  }, 5000);
}

function setupExitIntent() {
  const popup = qs("#exit-intent-popup");
  const closeBtn = qs("#close-popup");
  if (!popup) return;
  
  let shown = false;
  
  document.addEventListener("mouseleave", (e) => {
    if (e.clientY <= 0 && !shown) {
      popup.classList.add("active");
      shown = true;
    }
  });
  
  closeBtn?.addEventListener("click", () => popup.classList.remove("active"));
  qs("#popup-cta")?.addEventListener("click", () => popup.classList.remove("active"));
}

function setupChatAssistant() {
  const toggle = qs("#chat-toggle");
  const window = qs("#chat-window");
  const close = qs("#close-chat");
  const send = qs("#send-chat-msg");
  const input = qs("#chat-input");
  const messages = qs("#chat-messages");
  
  if (!toggle || !window) return;
  
  toggle.addEventListener("click", () => {
    window.classList.toggle("active");
  });
  
  close?.addEventListener("click", () => {
    window.classList.remove("active");
  });
  
  const addMsg = (text, type) => {
    const div = document.createElement("div");
    div.className = `msg ${type}`;
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  };
  
  const handleSend = () => {
    const text = input.value.trim();
    if (!text) return;
    
    addMsg(text, "user");
    input.value = "";
    
    // Simple simulated bot response
    setTimeout(() => {
      const responses = [
        "That's interesting! Tell me more about your project.",
        "We can definitely help with that. Have you checked our pricing?",
        "I'll pass this to our human team. They'll get back to you within 24 hours!",
        "Our websites are optimized for speed and SEO. Is that what you're looking for?"
      ];
      addMsg(responses[Math.floor(Math.random() * responses.length)], "bot");
    }, 1000);
  };
  
  send?.addEventListener("click", handleSend);
  input?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleSend();
  });
}

// Update the DOMContentLoaded listener
document.addEventListener("DOMContentLoaded", () => {
  setupNav();
  setupReveal();
  setupYear();
  setupCalculator();
  setupContactForm();
  setupScrollProgress();
  setupMagneticButtons();
  setupTilt();
  setupCounters();
  setupAnalytics();
  
  // New enhancements
  setupDarkMode();
  setupParticles();
  setupHeroAnimations();
  setupBrandGlitch();
  setupVisitorCounter();
  setupExitIntent();
  setupChatAssistant();
});