/* Robiul Islam portfolio — progressive enhancements, no external dependencies. */
(() => {
  'use strict';

  const initialise = () => {
    const root = document.documentElement;
    const body = document.body;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const listenToMedia = (query, callback) => {
      if (query.addEventListener) query.addEventListener('change', callback);
      else if (query.addListener) query.addListener(callback);
    };

    // Theme preferences remain local to this browser; storage is optional.
    const themeButton = document.getElementById('theme-toggle');
    let explicitTheme = null;
    try {
      const savedTheme = localStorage.getItem('robiul-theme');
      if (savedTheme === 'dark' || savedTheme === 'light') explicitTheme = savedTheme;
    } catch (_) { /* Storage can be unavailable in private or file-based previews. */ }

    const applyTheme = (theme, persist = false) => {
      root.dataset.theme = theme;
      root.style.colorScheme = theme;
      const nextTheme = theme === 'dark' ? 'light' : 'dark';
      if (themeButton) {
        themeButton.setAttribute('aria-label', `Switch to ${nextTheme} mode`);
        themeButton.setAttribute('aria-pressed', String(theme === 'dark'));
        themeButton.title = `Switch to ${nextTheme} mode`;
        const label = themeButton.querySelector('.theme-label');
        if (label) label.textContent = nextTheme === 'light' ? 'Light mode' : 'Dark mode';
      }
      const metaColour = document.querySelector('meta[name="theme-color"]');
      if (metaColour) metaColour.content = theme === 'dark' ? '#080f1c' : '#f8fafc';
      if (persist) {
        explicitTheme = theme;
        try { localStorage.setItem('robiul-theme', theme); } catch (_) {}
      }
    };
    applyTheme(explicitTheme || (systemTheme.matches ? 'dark' : 'light'));
    themeButton?.addEventListener('click', () => {
      applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true);
    });
    listenToMedia(systemTheme, event => {
      if (!explicitTheme) applyTheme(event.matches ? 'dark' : 'light');
    });
    window.addEventListener('storage', event => {
      if (event.key !== 'robiul-theme') return;
      explicitTheme = event.newValue === 'dark' || event.newValue === 'light' ? event.newValue : null;
      applyTheme(explicitTheme || (systemTheme.matches ? 'dark' : 'light'));
    });

    // Mobile navigation works with pointer, keyboard and ordinary anchor links.
    const menuButton = document.getElementById('menu-toggle');
    const navigation = document.getElementById('site-nav');
    const setMenu = open => {
      body.classList.toggle('menu-open', open);
      menuButton?.setAttribute('aria-expanded', String(open));
      menuButton?.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    };
    menuButton?.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') !== 'true';
      setMenu(open);
      // The dropdown precedes its toggle in the DOM, so move into it on opening.
      if (open) navigation?.querySelector('a[href]')?.focus({ preventScroll: true });
    });
    navigation?.addEventListener('click', event => {
      if (event.target.closest('a')) setMenu(false);
    });
    document.addEventListener('click', event => {
      if (!body.classList.contains('menu-open')) return;
      if (!navigation?.contains(event.target) && !menuButton?.contains(event.target)) setMenu(false);
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && body.classList.contains('menu-open')) {
        event.preventDefault();
        setMenu(false);
        menuButton?.focus();
      }
    });
    document.addEventListener('focusin', event => {
      if (body.classList.contains('menu-open')
        && !navigation?.contains(event.target) && !menuButton?.contains(event.target)) setMenu(false);
    });
    window.addEventListener('resize', () => {
      if (menuButton && menuButton.getClientRects().length === 0) setMenu(false);
    }, { passive: true });

    // Reveal content once. Content stays visible when JS or observers are unavailable.
    const revealElements = [...document.querySelectorAll('.reveal')];
    let revealObserver = null;
    const makeContentVisible = () => {
      revealObserver?.disconnect();
      root.classList.remove('motion-ready');
      revealElements.forEach(element => element.classList.add('is-visible'));
    };
    if ('IntersectionObserver' in window && !reducedMotion.matches) {
      revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
      // Avoid hiding already visible content when a slow connection delays this script.
      revealElements.forEach(element => {
        const bounds = element.getBoundingClientRect();
        if (bounds.top < window.innerHeight && bounds.bottom > 0) element.classList.add('is-visible');
        else revealObserver.observe(element);
      });
      root.classList.add('motion-ready');
    }
    // Keyboard navigation may reach a card before the observer's next callback.
    document.addEventListener('focusin', event => {
      let element = event.target.closest('.reveal');
      while (element) {
        element.classList.add('is-visible');
        revealObserver?.unobserve(element);
        element = element.parentElement?.closest('.reveal');
      }
    });

    // Filtering changes the existing project cards, preserving content without JS.
    const filterGroup = document.querySelector('.filter-group');
    const projectCards = [...document.querySelectorAll('.project-card[data-category]')];
    const filterButtons = [...document.querySelectorAll('.filter-group [data-filter]')];
    let projectStatus = document.getElementById('project-status');
    if (filterGroup && !projectStatus) {
      projectStatus = document.createElement('p');
      projectStatus.id = 'project-status';
      projectStatus.className = 'sr-only';
      projectStatus.setAttribute('role', 'status');
      projectStatus.setAttribute('aria-live', 'polite');
      filterGroup.after(projectStatus);
    }
    const applyFilter = value => {
      let count = 0;
      projectCards.forEach(card => {
        const matches = value === 'all' || card.dataset.category.split(/\s+/).includes(value);
        card.hidden = !matches;
        if (matches) {
          count += 1;
          card.classList.add('is-visible');
        }
      });
      filterButtons.forEach(button => {
        const selected = button.dataset.filter === value;
        button.setAttribute('aria-pressed', String(selected));
        button.classList.toggle('is-active', selected);
      });
      if (projectStatus) projectStatus.textContent = `${count} ${count === 1 ? 'project' : 'projects'} shown.`;
    };
    filterGroup?.addEventListener('click', event => {
      const button = event.target.closest('[data-filter]');
      if (!button || !filterGroup.contains(button)) return;
      applyFilter(button.dataset.filter);
      requestScrollUpdate();
    });
    if (filterButtons.length) applyFilter('all');

    // Real case studies use a native modal, with a simple legacy fallback.
    const projectDialog = document.getElementById('project-dialog');
    const dialogContent = document.getElementById('dialog-content');
    const dialogTitle = document.getElementById('dialog-title');
    const closeDialogButton = document.getElementById('close-dialog');
    let dialogOpener = null;
    let backdropPointerDown = false;
    let legacyDialog = false;

    const restoreAfterDialog = () => {
      body.classList.remove('dialog-open');
      const returnTo = dialogOpener;
      dialogOpener = null;
      if (returnTo?.isConnected && !returnTo.closest('[hidden]')) returnTo.focus({ preventScroll: true });
    };
    const closeProject = () => {
      if (!projectDialog?.hasAttribute('open')) return;
      if (!legacyDialog && typeof projectDialog.close === 'function') projectDialog.close();
      else {
        projectDialog.removeAttribute('open');
        restoreAfterDialog();
      }
    };
    const openProject = trigger => {
      if (!projectDialog || !dialogContent || !dialogTitle) return;
      const projectId = trigger.dataset.project;
      const template = document.getElementById(`case-${projectId}`);
      if (!template?.content) return;
      dialogOpener = trigger;
      dialogTitle.textContent = trigger.closest('.project-card')?.querySelector('.project-title')?.textContent.trim()
        || trigger.dataset.title || 'Project details';
      dialogContent.replaceChildren(template.content.cloneNode(true));
      projectDialog.dataset.project = projectId;
      setMenu(false);
      body.classList.add('dialog-open');
      legacyDialog = typeof projectDialog.showModal !== 'function';
      if (legacyDialog) {
        projectDialog.setAttribute('open', '');
        projectDialog.setAttribute('aria-modal', 'true');
      } else if (!projectDialog.open) projectDialog.showModal();
      dialogContent.scrollTop = 0;
      projectDialog.scrollTop = 0;
      closeDialogButton?.focus({ preventScroll: true });
    };
    document.addEventListener('click', event => {
      const trigger = event.target.closest('.project-trigger[data-project]');
      if (!trigger) return;
      event.preventDefault();
      openProject(trigger);
    });
    closeDialogButton?.addEventListener('click', closeProject);
    projectDialog?.addEventListener('close', restoreAfterDialog);
    projectDialog?.addEventListener('cancel', event => {
      event.preventDefault();
      closeProject();
    });
    const isOutsideDialog = event => {
      if (event.target !== projectDialog) return false;
      const bounds = projectDialog.getBoundingClientRect();
      return event.clientX < bounds.left || event.clientX > bounds.right
        || event.clientY < bounds.top || event.clientY > bounds.bottom;
    };
    projectDialog?.addEventListener('pointerdown', event => { backdropPointerDown = isOutsideDialog(event); });
    projectDialog?.addEventListener('click', event => {
      if (backdropPointerDown && isOutsideDialog(event)) closeProject();
      backdropPointerDown = false;
    });
    projectDialog?.addEventListener('keydown', event => {
      if (!legacyDialog) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeProject();
      } else if (event.key === 'Tab') {
        const focusable = [...projectDialog.querySelectorAll('a[href],button:not([disabled]),[tabindex="0"]')]
          .filter(element => element.getClientRects().length);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    });

    // Scroll treatment runs at most once per animation frame.
    const header = document.getElementById('site-header');
    const progress = document.getElementById('scroll-progress');
    const backTop = document.getElementById('back-top');
    if (backTop) backTop.hidden = false;
    let scrollFrame = 0;
    const updateScroll = () => {
      scrollFrame = 0;
      const current = window.scrollY || root.scrollTop;
      const distance = Math.max(root.scrollHeight - window.innerHeight, 1);
      if (progress) progress.style.transform = `scaleX(${Math.min(1, Math.max(0, current / distance))})`;
      header?.classList.toggle('is-scrolled', current > 24);
      if (backTop) {
        const visible = current > 600;
        backTop.classList.toggle('is-visible', visible);
        backTop.setAttribute('aria-hidden', String(!visible));
        backTop.tabIndex = visible ? 0 : -1;
      }
    };
    const requestScrollUpdate = () => {
      if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll);
    };
    window.addEventListener('scroll', requestScrollUpdate, { passive: true });
    window.addEventListener('resize', requestScrollUpdate, { passive: true });
    updateScroll();
    backTop?.addEventListener('click', event => {
      if (backTop.tagName === 'A') return; // Normal anchor navigation remains native.
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    });

    if ('IntersectionObserver' in window && navigation) {
      const navLinks = [...navigation.querySelectorAll('a[href^="#"]')];
      const sectionObserver = new IntersectionObserver(entries => {
        const active = entries.filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!active) return;
        navLinks.forEach(link => {
          const isCurrent = link.getAttribute('href') === `#${active.target.id}`;
          if (isCurrent) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      }, { rootMargin: '-15% 0px -60% 0px', threshold: 0 });
      document.querySelectorAll('main section[id]').forEach(section => sectionObserver.observe(section));
    }

    // One gentle role cycle: paused offscreen, in background tabs and for reduced motion.
    const role = document.querySelector('[data-rotating-role]');
    const roleLabels = ['Full-Stack Developer', 'Android & App Developer', 'Robotics & IoT Builder', 'Technology Educator'];
    let roleStep = 0;
    let roleTimer = 0;
    let roleSwapTimer = 0;
    let heroVisible = true;
    const stopRole = () => {
      clearTimeout(roleTimer);
      clearTimeout(roleSwapTimer);
      roleTimer = 0;
      roleSwapTimer = 0;
      role?.classList.remove('role-changing');
    };
    const scheduleRole = () => {
      if (!role || roleStep >= roleLabels.length || reducedMotion.matches || document.hidden || !heroVisible || roleTimer) return;
      roleTimer = window.setTimeout(() => {
        roleTimer = 0;
        if (reducedMotion.matches || document.hidden || !heroVisible) return;
        role.classList.add('role-changing');
        roleSwapTimer = window.setTimeout(() => {
          roleSwapTimer = 0;
          roleStep += 1;
          role.textContent = roleLabels[roleStep % roleLabels.length];
          role.classList.remove('role-changing');
          scheduleRole();
        }, 180);
      }, 4800);
    };
    if (role && 'IntersectionObserver' in window) {
      const heroObserver = new IntersectionObserver(entries => {
        heroVisible = entries.some(entry => entry.isIntersecting);
        if (heroVisible) scheduleRole();
        else stopRole();
      });
      heroObserver.observe(role);
    } else scheduleRole();

    const tiltElements = [...document.querySelectorAll('[data-tilt]')];
    const clearTilts = () => tiltElements.forEach(element => {
      element.style.setProperty('--tilt-x', '0deg');
      element.style.setProperty('--tilt-y', '0deg');
    });
    tiltElements.forEach(element => {
      let frame = 0;
      let lastPoint = null;
      const reset = () => {
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
        lastPoint = null;
        element.style.setProperty('--tilt-x', '0deg');
        element.style.setProperty('--tilt-y', '0deg');
      };
      element.addEventListener('pointermove', event => {
        if (!finePointer.matches || reducedMotion.matches || document.hidden) return;
        lastPoint = { x: event.clientX, y: event.clientY };
        if (frame) return;
        frame = requestAnimationFrame(() => {
          frame = 0;
          if (!lastPoint || reducedMotion.matches || document.hidden || !finePointer.matches) return;
          const bounds = element.getBoundingClientRect();
          const x = Math.max(-1, Math.min(1, (lastPoint.x - bounds.left) / bounds.width * 2 - 1));
          const y = Math.max(-1, Math.min(1, (lastPoint.y - bounds.top) / bounds.height * 2 - 1));
          element.style.setProperty('--tilt-x', `${(-y * 3).toFixed(2)}deg`);
          element.style.setProperty('--tilt-y', `${(x * 3).toFixed(2)}deg`);
        });
      }, { passive: true });
      element.addEventListener('pointerleave', reset);
      element.addEventListener('pointercancel', reset);
      listenToMedia(finePointer, reset);
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { stopRole(); clearTilts(); }
      else scheduleRole();
    });
    listenToMedia(reducedMotion, event => {
      if (event.matches) {
        makeContentVisible();
        stopRole();
        clearTilts();
        if (role) role.textContent = roleLabels[0];
      } else scheduleRole();
    });

    // Copy is an explicit click action; email links work without this enhancement.
    const copyButton = document.getElementById('copy-email');
    const copyStatus = document.getElementById('copy-status');
    let copying = false;
    copyButton?.addEventListener('click', async () => {
      if (copying) return;
      const address = copyButton.dataset.copy;
      if (!address) return;
      copying = true;
      copyButton.setAttribute('aria-busy', 'true');
      if (copyStatus) copyStatus.textContent = 'Copying email address…';
      let copied = false;
      const field = document.createElement('textarea');
      field.value = address;
      field.setAttribute('readonly', '');
      field.tabIndex = -1;
      field.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;opacity:0;font-size:16px;pointer-events:none;';
      body.append(field);
      try {
        // Keep this synchronous inside the user's click, including in embedded previews.
        field.focus({ preventScroll: true });
        field.select();
        field.setSelectionRange(0, address.length);
        copied = document.execCommand('copy');
      } catch (_) { /* A blocked selection-based copy can use the bounded fallback below. */ }
      finally {
        field.remove();
        copyButton.focus({ preventScroll: true });
      }
      if (!copied) {
        let expired = false;
        let timeout = 0;
        const permittedClipboardCopy = async () => {
          try {
            if (!window.isSecureContext || !navigator.clipboard?.writeText || !navigator.permissions?.query) return false;
            // Querying does not prompt. Only use the API when permission already exists.
            const permission = await navigator.permissions.query({ name: 'clipboard-write' });
            if (expired || permission.state !== 'granted') return false;
            await navigator.clipboard.writeText(address);
            return !expired;
          } catch (_) { return false; }
        };
        copied = await Promise.race([
          permittedClipboardCopy(),
          new Promise(resolve => {
            timeout = window.setTimeout(() => { expired = true; resolve(false); }, 1200);
          })
        ]);
        expired = true;
        clearTimeout(timeout);
      }
      if (copyStatus) copyStatus.textContent = copied ? 'Email address copied.' : `Please copy this email address: ${address}`;
      copyButton.removeAttribute('aria-busy');
      copying = false;
    });

    document.querySelectorAll('[data-current-year]').forEach(element => {
      element.textContent = String(new Date().getFullYear());
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialise, { once: true });
  else initialise();
})();
