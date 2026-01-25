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
    text: `[1/7] Here’s your <b>canvas area</b>. It holds the visual objects (shapes, images, text, drawings etc) for your current keyframe. <p>You can move objects around with the mouse or use WASD keys.
    <ul>
    <li><kbd>Q</kbd> & <kbd>E</kbd> rotates objects.</li>
    <li><kbd>H</kbd> toggles object highlighting.</li>
    <li><kbd>CTRL+C/V</kbd> to copy/paste objects.</li>
    <li>You can paste images from your clipboard directly into the canvas.</li>
    </ul>`,
    placement: 'left-bottom'
  },
  {
    element: '#timeline',
    text: `[2/7] Your animation is based on designing <b>Keyframes</b>, and blending between them. You can control the number of frames used to blend between keyframes, and choose a blend style.
    <ul>
    <li><kbd>TAB</kbd> to cycle Keyframes.</li>
    <li><kbd>Drag/Drop</kbd> to reorder Keyframes.</li>
    </ul>`,
    placement: 'left',
    fn: () => {},
  },
  {
    element: '#shapeList',
    text: `[3/7] This panel lists all the <b>visual objects</b> that exist for the currently selected Keyframe. You can change their size, rotation, draw order, and colour. 
    <ul>
    <li><kbd>TAB</kbd> to cycle objects.</li>
    <li><kbd>Drag/Drop</kbd> to change the draw order of objects (those at the top are closest to the foreground.</li>
    <li><kbd>CTRL+C/V</kbd> to copy/paste objects.</li>
    <li><kbd>Ctrl+Click</kbd> to select multiple objects.</li>
    </ul>`,
    placement: 'right-top'
  },
    {
    element: '#audioObjectList',
    text: `[4/7] This panel lists all the <b>audio objects</b> that exist for the currently selected Keyframe. Controls work identically to visual objects, except they don't appear on the canvas.
    <ul>
    <li>Audio objects play at the start of their Keyframe by default.</li>
    </ul>`,
    placement: 'right-top',
    fn: () => {document.getElementById("audioObjectList").scrollIntoView();},
  },
  {
    element: '#objectList',
    text: '[5/7] Add <b>new objects</b> to a Keyframe here. You can search for new images and audio directly.',
    placement: 'right-top',
    fn: () => {document.getElementById("canvasList").scrollIntoView();},
  },
  {
    element: '#cloneKeyframe',
    text: `[6/7] Click <b>Clone Selected Keyframe</b> (or press <kbd>k</kbd>) to capture the current arrangement of objects in the scene as a new keyframe in your animation.
    <ul>
    <li>When you clone a keyframe, objects in the clone are linked to those in the original. This allows you to move objects across the screen from its position in one keyframe, to another.</li>
    <li>Linked objects can also change size, rotation, draw order, and colour between keyframes.</li>
    <ul>`,
    placement: 'left'
  },
  {
    element: '#newPlayBtn',
    text: `[7/7] <b>▶ Button (or <kbd>Spacebar</kbd>)</b> runs your animation once from the currently selected keyframe.
    <p>
    You need at least two Keyframes for an animation - so I've loaded a demo scene for you to try out.
    <p>
    <b>Enjoy Animatey!</b>`,
    placement: 'right',
    fn: () => {loadDemo();},
  }
];

window.startTutorial = function(force = false) {
  const STORAGE_KEY = 'tutorialSeen';
  const steps       = window.tutorialSteps || [];

  // If already seen and we aren't forcing a restart, stop.
  if (!steps.length || (localStorage.getItem(STORAGE_KEY) && !force)) {
    return;
  }

  // Clear "seen" status if forcing a restart
  if (force) {
    localStorage.removeItem(STORAGE_KEY);
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

    // ── new: run optional fn for step ─────────────────────────────
    if (typeof fn === 'function') {
      try { fn(el, i, steps); } catch(e) { console.error(e); }
    }

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

    // bind Next/Done button
    tooltip.querySelector('.tutorial-next').onclick = () => showStep(i + 1);
    // bind Skip button if present
    if (isFirst) {
      tooltip.querySelector('.tutorial-skip').onclick = skipTutorial;
    }
  }
  showStep(0);

};
// ── 3) kick it off after DOM ready ─────────────────────────────
document.addEventListener('DOMContentLoaded', () => window.startTutorial(false));
