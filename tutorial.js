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
    text: '[1/9] Here’s your drawing area. You can drag shapes around directly on the canvas to reposition them. Clicking off a shape unselects it.'
  },
  {
    element: '#cloneKeyframe',
    text: '[2/9] Click <b>Clone Keyframe</b> (or <kbd>k</kbd>) to capture the current arrangement of objects in the scene as a new keyframe in your animation.',
    fn: () => {
    }
  },
  {
    element: '#timeline',
    text: '[3/9] Your animation storyboard is based on creating keyframes, and transitioning between them. You can control their duration, order, and animation style.'
  },
  {
    element: '#shapeList',
    text: '[4/9] Each keyframe holds objects for that scene. This panel lists all your objects. You can select, reorder, resize, recolor, rotate, or delete them here. <kbd>Ctrl-Click</kbd> to select multiple objects.'
  },
  {
    element: '#shapeType',
    text: '[5/9] Use this dropdown to select the kind of shape you want to add (rectangle, circle, triangle, square, or text), then press Add.'
  },
  {
    element: '#playAnimation',
    text: '[6/9] ▶ Play (or <kbd>Space</kbd>) runs your animation once from the currently selected keyframe.'
  },
  {
    element: '#loopAnimation',
    text: '[7/9] ↻ Loop will continuously replay the animation in a loop.'
  },
  {
    element: '#bounceAnimation',
    text: '[8/9] ↔ Bounce plays forward then in reverse for a back-and-forth effect.'
  },
  {
    element: '#exportBtn',
    text: '[9/9] Export your animation to keep it safe, or share it. That\'s it! Have fun!'
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
