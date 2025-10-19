/*!
 * tutorial.js — An ultra-minimal in-page tutorial framework by @hiburn8 https://www.linkedin.com/in/hiburn8/
 *
 * Usage:
 * 1) Before including this script, define your steps:
 *    <script>
 *      window.tutorialSteps = [
 *        { element: '#title',    text: 'This is the main title.'      },
 *        { element: '.intro',    text: 'Here’s a quick intro.'         },
 *        { element: '#startBtn', text: 'Click here to get started!'   }
 *      ];
 *    </script>
 *
 * 2) Then include:
 *    <script src="tutorial.js"></script>
 *
 * It will run automatically on first visit (based on localStorage flag).
 */

window.tutorialSteps = [
  {
    element: '#canvas',
    text: '[1/7] Here’s your canvas area. It holds the objects (shapes, images, text, drawings etc) for your current keyframe. <p>When you select an object, you can move it around with the mouse or use <kbd>WASD</kbd>.<p><kbd>Q</kbd> & <kbd>E</kbd> rotates objects.<p><kbd>H</kbd> toggles highlighting.',
    placement: 'left-bottom'
  },
  {
    element: '#timeline',
    text: '[2/7] Your animation is based on designing keyframes, and blending between them. You can control the number of frames used to blend between keyframes, and choose a blend style.',
    placement: 'left',
    fn: () => {},
  },
  {
    element: '#cloneKeyframe',
    text: '[3/7] Click <b>Clone Keyframe</b> (or <kbd>k</kbd>) to capture the current arrangement of objects in the scene as a new keyframe in your animation.',
    placement: 'left'
  },
  {
    element: '#shapeList',
    text: '[4/7] Each keyframe holds objects for that scene. This panel lists all your objects. You can reorder, resize, recolor, rotate, or delete them here. <kbd>Ctrl-Click</kbd> to select multiple objects.',
    placement: 'right-top'
  },
    {
    element: '#objectList',
    text: '[5/7] Add new objects to the scene here.',
    placement: 'right-top'
  },
  {
    element: '#newPlayBtn',
    text: '[6/7] ▶ Play (or <kbd>Spacebar</kbd>) runs your animation once from the currently selected keyframe.',
    placement: 'bottom-right'
  },
  {
    element: '#demoBtn',
    text: '[7/7] Try loading this demo animation and experimenting. Have fun!',
    placement: 'left'
  }
];

(function(){
  const STORAGE_KEY = 'tutorialSeen';
  const steps       = window.tutorialSteps || [];

  if (!steps.length || localStorage.getItem(STORAGE_KEY)) {
    return; // nothing to do
  }

  // ── 1) inject minimal CSS ───────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    .tutorial-highlight {
      position: relative !important;
      z-index: 10000 !important;
      box-shadow: 0 0 0 4px rgb(125 0 255) !important
    }
    .tutorial-tooltip {
      position: absolute;
      background: white;
      color: black;
      padding: 8px;
      border-radius: 4px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      z-index: 10001;
      max-width: 200px;
      font-family: sans-serif;
      font-size: 14px;
    }
    .tutorial-tooltip button {
      margin-top: 8px;
      padding: 4px 8px;
      font-size: 13px;
      cursor: pointer;
    }
  `;
  document.head.appendChild(style);

  // ── 2) core logic ───────────────────────────────────────────────
  let idx = 0;
  let currentEl, tooltip;

  // new: allow user to skip entire tutorial
  function skipTutorial() {
    if (currentEl) {
      currentEl.classList.remove('tutorial-highlight');
      currentEl = null;
    }
    if (tooltip) {
      tooltip.remove();
      tooltip = null;
    }
    localStorage.setItem(STORAGE_KEY, 'true');
  }

  // ── NEW: placement helper (non-breaking) ────────────────────────
  function positionTooltip(el, tooltip, placementStr) {
    const margin = 8;
    const rect   = el.getBoundingClientRect();
    const ttRect = tooltip.getBoundingClientRect();
    const sx = window.scrollX, sy = window.scrollY;
    // parse "primary-secondary" (e.g., "bottom-right"); defaults
    let primary = 'bottom', secondary = 'left';
    if (typeof placementStr === 'string' && placementStr.trim()) {
      const parts = placementStr.toLowerCase().split(/[\s\-_:]+/);
      if (parts[0]) primary   = parts[0];
      if (parts[1]) secondary = parts[1];
    }

    // compute base top/left
    let top, left;

    if (primary === 'top') {
      top = sy + rect.top - ttRect.height - margin;
      // horizontal alignment when above
      if (secondary === 'right') {
        left = sx + rect.right - ttRect.width;
      } else if (secondary === 'center' || secondary === 'middle') {
        left = sx + rect.left + (rect.width - ttRect.width) / 2;
      } else {
        left = sx + rect.left; // left
      }
    } else if (primary === 'bottom') {
      top = sy + rect.bottom + margin;
      if (secondary === 'right') {
        left = sx + rect.right - ttRect.width;
      } else if (secondary === 'center' || secondary === 'middle') {
        left = sx + rect.left + (rect.width - ttRect.width) / 2;
      } else {
        left = sx + rect.left; // left
      }
    } else if (primary === 'left') {
      left = sx + rect.left - ttRect.width - margin;
      // vertical alignment when left
      if (secondary === 'bottom') {
        top = sy + rect.bottom - ttRect.height;
      } else if (secondary === 'center' || secondary === 'middle') {
        top = sy + rect.top + (rect.height - ttRect.height) / 2;
      } else {
        top = sy + rect.top; // top
      }
    } else if (primary === 'right') {
      left = sx + rect.right + margin;
      if (secondary === 'bottom') {
        top = sy + rect.bottom - ttRect.height;
      } else if (secondary === 'center' || secondary === 'middle') {
        top = sy + rect.top + (rect.height - ttRect.height) / 2;
      } else {
        top = sy + rect.top; // top
      }
    } else {
      // fallback to original default: bottom-left
      top  = sy + rect.bottom + margin;
      left = sx + rect.left;
    }

    // clamp into viewport (so it never disappears off-screen)
    const minLeft = sx + 8;
    const maxLeft = sx + window.innerWidth - ttRect.width - 8;
    const minTop  = sy + 8;
    const maxTop  = sy + window.innerHeight - ttRect.height - 8;
    left = Math.max(minLeft, Math.min(left, maxLeft));
    top  = Math.max(minTop,  Math.min(top,  maxTop));

    tooltip.style.top  = `${top}px`;
    tooltip.style.left = `${left}px`;
  }

  function showStep(i) {
    // clean up previous
    if (currentEl) {
      currentEl.classList.remove('tutorial-highlight');
      currentEl = null;
    }
    if (tooltip) {
      tooltip.remove();
      tooltip = null;
    }

    // finished?
    if (i >= steps.length) {
      localStorage.setItem(STORAGE_KEY, 'true');
      return;
    }
    idx = i;
    const { element, text, fn } = steps[i];
    const el = document.querySelector(element);
    if (!el) {
      // skip missing selectors
      return showStep(i + 1);
    }
    currentEl = el;
    el.classList.add('tutorial-highlight');

    // create tooltip
    const isFirst = i === 0;  // only on the very first step
    tooltip = document.createElement('div');
    tooltip.className = 'tutorial-tooltip';
    tooltip.innerHTML = `
      <div>${text}</div>
      <div style="margin-top:8px;">
        <button class="tutorial-next">${i === steps.length - 1 ? 'Done' : 'Next'}</button>
        ${isFirst ? '<button class="tutorial-skip">Skip Tutorial</button>' : ''}
      </div>
    `;
    document.body.appendChild(tooltip);

    // position it under the element
    const rect = el.getBoundingClientRect();
    const ttRect = tooltip.getBoundingClientRect();
    let top  = window.scrollY + rect.bottom + 8;
    let left = window.scrollX + rect.left;
    // if off the right edge, shift back
    if (left + ttRect.width > window.innerWidth - 8) {
      left = window.innerWidth - ttRect.width - 8;
    }
    tooltip.style.top  = `${top}px`;
    tooltip.style.left = `${left}px`;

    // ── NEW: if a placement is provided, override default positioning ───────────
    // supports forms like: "bottom-right", "top-left", "left", "right", "top-center"
    // remains fully backward compatible if you omit placement.
    try {
      const placement = steps[i].placement || steps[i].position || steps[i].place;
      if (placement) {
        positionTooltip(el, tooltip, placement);
      }
    } catch (e) {
      // if anything goes wrong, we gracefully keep the default placement
      console.error(e);
    }

    // ── new: run optional fn for step ─────────────────────────────
    if (typeof fn === 'function') {
      try { fn(el, i, steps); } catch(e) { console.error(e); }
    }

    // bind Next/Done button
    tooltip.querySelector('.tutorial-next').onclick = () => showStep(i + 1);
    // bind Skip button if present
    if (isFirst) {
      tooltip.querySelector('.tutorial-skip').onclick = skipTutorial;
    }
  }

  // ── 3) kick it off after DOM ready ─────────────────────────────
  document.addEventListener('DOMContentLoaded', () => showStep(0));
})();
