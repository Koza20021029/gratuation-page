/**
 * GradualBlur Custom Element (Web Component)
 * 
 * Recreates the premium Apple-style gradual/linear blur backdrop-filter effect natively
 * in any HTML or React codebase. Fully matches the provided React component specification,
 * including presets, hover-intensified blur, smooth transitions, and responsive dimensions.
 */

class GradualBlur extends HTMLElement {
  constructor() {
    super();
    // Default configuration matching the React component exactly
    this.DEFAULT_CONFIG = {
      position: 'bottom',
      strength: 1.0,
      height: '3.5rem',
      width: '',
      divCount: 5,
      exponential: false,
      zIndex: 1000,
      animated: false,
      duration: '0.3s',
      easing: 'ease-out',
      opacity: 1,
      curve: 'linear',
      responsive: false,
      target: 'parent',
      hoverIntensity: 0 // If > 0, triggers hover interaction
    };

    this.PRESETS = {
      top: { position: 'top', height: '3.5rem', strength: 1.0 },
      bottom: { position: 'bottom', height: '3.5rem', strength: 1.0 },
      left: { position: 'left', height: '3.5rem', strength: 1.0 },
      right: { position: 'right', height: '3.5rem', strength: 1.0 },
      subtle: { height: '2.5rem', strength: 0.6, opacity: 0.8, divCount: 3 },
      intense: { height: '6rem', strength: 2.0, divCount: 8, exponential: true },
      smooth: { height: '4.5rem', curve: 'bezier', divCount: 10, strength: 1.0 },
      sharp: { height: '3rem', curve: 'linear', divCount: 4, strength: 0.8 },
      header: { position: 'top', height: '3.5rem', curve: 'ease-out', strength: 1.0 },
      footer: { position: 'bottom', height: '3.5rem', curve: 'ease-out', strength: 1.0 },
      sidebar: { position: 'left', height: '3.5rem', strength: 1.2 },
      'page-header': { position: 'top', height: '3.5rem', target: 'page', strength: 1.0 },
      'page-footer': { position: 'bottom', height: '3.5rem', target: 'page', strength: 1.0 }
    };

    this.CURVE_FUNCTIONS = {
      linear: p => p,
      bezier: p => p * p * (3 - 2 * p),
      'ease-in': p => p * p,
      'ease-out': p => 1 - Math.pow(1 - p, 2),
      'ease-in-out': p => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2)
    };

    this.isHovered = false;
    this.currentHeight = '';
    this.currentWidth = '';
    this.resizeListener = null;

    // Bind event handlers
    this.onMouseEnter = this.onMouseEnter.bind(this);
    this.onMouseLeave = this.onMouseLeave.bind(this);
    this.onResize = this.onResize.bind(this);
  }

  connectedCallback() {
    this.setupListeners();
    this.render();
  }

  disconnectedCallback() {
    this.removeListeners();
  }

  static get observedAttributes() {
    return [
      'preset', 'position', 'strength', 'height', 'width', 'div-count', 
      'exponential', 'z-index', 'animated', 'duration', 'easing', 
      'opacity', 'curve', 'target', 'hover-intensity', 'responsive',
      'mobile-height', 'tablet-height', 'desktop-height',
      'mobile-width', 'tablet-width', 'desktop-width'
    ];
  }

  attributeChangedCallback() {
    this.render();
  }

  setupListeners() {
    this.addEventListener('mouseenter', this.onMouseEnter);
    this.addEventListener('mouseleave', this.onMouseLeave);
  }

  removeListeners() {
    this.removeEventListener('mouseenter', this.onMouseEnter);
    this.removeEventListener('mouseleave', this.onMouseLeave);
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
      this.resizeListener = null;
    }
  }

  onMouseEnter() {
    const hoverIntensityAttr = this.getAttribute('hover-intensity');
    const hoverIntensity = hoverIntensityAttr ? parseFloat(hoverIntensityAttr) : 0;
    if (hoverIntensity > 0) {
      this.isHovered = true;
      this.updateBlurStrengths();
    }
  }

  onMouseLeave() {
    const hoverIntensityAttr = this.getAttribute('hover-intensity');
    const hoverIntensity = hoverIntensityAttr ? parseFloat(hoverIntensityAttr) : 0;
    if (hoverIntensity > 0) {
      this.isHovered = false;
      this.updateBlurStrengths();
    }
  }

  debounce(fn, wait) {
    let t;
    return (...a) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...a), wait);
    };
  }

  onResize() {
    const responsive = this.getAttribute('responsive') === 'true';
    if (!responsive) return;

    const w = window.innerWidth;
    let h = this.getAttribute('height') || this.DEFAULT_CONFIG.height;
    let width = this.getAttribute('width') || this.DEFAULT_CONFIG.width;

    const preset = this.getAttribute('preset') || '';
    if (preset && this.PRESETS[preset]) {
      if (this.PRESETS[preset].height) h = this.PRESETS[preset].height;
      if (this.PRESETS[preset].width) width = this.PRESETS[preset].width;
    }

    // Responsive height breakpoints
    if (w <= 480 && this.hasAttribute('mobile-height')) {
      h = this.getAttribute('mobile-height');
    } else if (w <= 768 && this.hasAttribute('tablet-height')) {
      h = this.getAttribute('tablet-height');
    } else if (w <= 1024 && this.hasAttribute('desktop-height')) {
      h = this.getAttribute('desktop-height');
    }

    // Responsive width breakpoints
    if (w <= 480 && this.hasAttribute('mobile-width')) {
      width = this.getAttribute('mobile-width');
    } else if (w <= 768 && this.hasAttribute('tablet-width')) {
      width = this.getAttribute('tablet-width');
    } else if (w <= 1024 && this.hasAttribute('desktop-width')) {
      width = this.getAttribute('desktop-width');
    }

    this.currentHeight = h;
    this.currentWidth = width;

    this.applyContainerStyles();
  }

  updateBlurStrengths() {
    const preset = this.getAttribute('preset') || '';
    const presetConfig = preset && this.PRESETS[preset] ? this.PRESETS[preset] : {};
    
    const strengthAttr = this.hasAttribute('strength') ? parseFloat(this.getAttribute('strength')) : null;
    const strength = strengthAttr !== null ? strengthAttr : (presetConfig.strength !== undefined ? presetConfig.strength : this.DEFAULT_CONFIG.strength);
    
    const hoverIntensityAttr = this.hasAttribute('hover-intensity') ? parseFloat(this.getAttribute('hover-intensity')) : null;
    const hoverIntensity = hoverIntensityAttr !== null ? hoverIntensityAttr : this.DEFAULT_CONFIG.hoverIntensity;
    
    const exponentialAttr = this.hasAttribute('exponential') ? this.getAttribute('exponential') === 'true' : null;
    const exponential = exponentialAttr !== null ? exponentialAttr : (presetConfig.exponential !== undefined ? presetConfig.exponential : this.DEFAULT_CONFIG.exponential);
    
    const divCountAttr = this.hasAttribute('div-count') ? parseInt(this.getAttribute('div-count')) : null;
    const divCount = divCountAttr !== null ? divCountAttr : (presetConfig.divCount !== undefined ? presetConfig.divCount : this.DEFAULT_CONFIG.divCount);
    
    const curveAttr = this.getAttribute('curve') || '';
    const curve = curveAttr || (presetConfig.curve !== undefined ? presetConfig.curve : this.DEFAULT_CONFIG.curve);

    const currentStrength = this.isHovered && hoverIntensity > 0 ? strength * hoverIntensity : strength;
    const curveFunc = this.CURVE_FUNCTIONS[curve] || this.CURVE_FUNCTIONS.linear;

    const divElements = this.querySelectorAll('.gradual-blur-inner > div');
    divElements.forEach((div, idx) => {
      let progress = (idx + 1) / divCount;
      progress = curveFunc(progress);

      let blurValue;
      if (exponential) {
        blurValue = Math.pow(2, progress * 4) * 0.0625 * currentStrength;
      } else {
        blurValue = 0.0625 * (progress * divCount + 1) * currentStrength;
      }

      div.style.backdropFilter = `blur(${blurValue.toFixed(3)}rem)`;
      div.style.webkitBackdropFilter = `blur(${blurValue.toFixed(3)}rem)`;
    });
  }

  applyContainerStyles() {
    const preset = this.getAttribute('preset') || '';
    const presetConfig = preset && this.PRESETS[preset] ? this.PRESETS[preset] : {};

    const positionAttr = this.getAttribute('position') || '';
    const position = positionAttr || (presetConfig.position !== undefined ? presetConfig.position : this.DEFAULT_CONFIG.position);

    const targetAttr = this.getAttribute('target') || '';
    const target = targetAttr || (presetConfig.target !== undefined ? presetConfig.target : this.DEFAULT_CONFIG.target);

    const zIndexAttr = this.hasAttribute('z-index') ? parseInt(this.getAttribute('z-index')) : null;
    let zIndex = zIndexAttr !== null ? zIndexAttr : (presetConfig.zIndex !== undefined ? presetConfig.zIndex : this.DEFAULT_CONFIG.zIndex);

    const isPageTarget = target === 'page';

    // Keep dynamic z-index layering below global headers (z-index 200) but above content (z-index 10)
    // If z-index is set in layout explicitly, preserve it.
    let inlineZIndex = this.style.zIndex;
    if (inlineZIndex && inlineZIndex !== '1000' && inlineZIndex !== '90' && inlineZIndex !== '30') {
      zIndex = inlineZIndex;
    } else if (isPageTarget && zIndex === 1000) {
      // By default, page-level overlays should be zIndex 30 so they remain below structural elements (z-index 40+)
      zIndex = 30; // Default override to prevent cover-up of top menus in this theme
    }

    const hoverIntensityAttr = this.hasAttribute('hover-intensity') ? parseFloat(this.getAttribute('hover-intensity')) : null;
    const hoverIntensity = hoverIntensityAttr !== null ? hoverIntensityAttr : this.DEFAULT_CONFIG.hoverIntensity;

    const animatedAttr = this.getAttribute('animated') || '';
    const animated = animatedAttr || (presetConfig.animated !== undefined ? presetConfig.animated : this.DEFAULT_CONFIG.animated);

    const durationAttr = this.getAttribute('duration') || '';
    const duration = durationAttr || (presetConfig.duration !== undefined ? presetConfig.duration : this.DEFAULT_CONFIG.duration);

    const easingAttr = this.getAttribute('easing') || '';
    const easing = easingAttr || (presetConfig.easing !== undefined ? presetConfig.easing : this.DEFAULT_CONFIG.easing);

    this.className = `gradual-blur ${target === 'page' ? 'gradual-blur-page' : 'gradual-blur-parent'}`;

    const isVertical = ['top', 'bottom'].includes(position);
    const isHorizontal = ['left', 'right'].includes(position);

    Object.assign(this.style, {
      position: isPageTarget ? 'fixed' : 'absolute',
      pointerEvents: hoverIntensity > 0 ? 'auto' : 'none',
      opacity: animated === 'scroll' ? '0' : '1',
      zIndex: String(zIndex),
      transition: animated ? `opacity ${duration} ${easing}` : '',
      display: 'block',
    });

    const finalHeight = this.currentHeight || presetConfig.height || this.DEFAULT_CONFIG.height;
    const finalWidth = this.currentWidth || presetConfig.width || this.DEFAULT_CONFIG.width;

    if (isVertical) {
      this.style.height = finalHeight;
      this.style.width = finalWidth || '100%';
      this.style[position] = '0';
      this.style.left = '0';
      this.style.right = '0';
      // Reset other axis
      this.style.top = position === 'top' ? '0' : '';
      this.style.bottom = position === 'bottom' ? '0' : '';
    } else if (isHorizontal) {
      this.style.width = finalWidth || finalHeight;
      this.style.height = '100%';
      this.style[position] = '0';
      this.style.top = '0';
      this.style.bottom = '0';
      // Reset other axis
      this.style.left = position === 'left' ? '0' : '';
      this.style.right = position === 'right' ? '0' : '';
    }
  }

  render() {
    const preset = this.getAttribute('preset') || '';
    const presetConfig = preset && this.PRESETS[preset] ? this.PRESETS[preset] : {};

    const presetHeight = presetConfig.height || this.DEFAULT_CONFIG.height;
    const presetWidth = presetConfig.width || this.DEFAULT_CONFIG.width;

    const responsive = this.getAttribute('responsive') === 'true';

    // Set up responsive resizing listeners if enabled
    if (responsive) {
      if (!this.resizeListener) {
        this.resizeListener = this.debounce(this.onResize, 100);
        window.addEventListener('resize', this.resizeListener);
      }
      this.onResize();
    } else {
      if (this.resizeListener) {
        window.removeEventListener('resize', this.resizeListener);
        this.resizeListener = null;
      }
      this.currentHeight = this.getAttribute('height') || presetHeight;
      this.currentWidth = this.getAttribute('width') || presetWidth;
    }

    this.applyContainerStyles();

    // Reconstruct inner structures
    this.innerHTML = '';
    const innerWrapper = document.createElement('div');
    innerWrapper.className = 'gradual-blur-inner';
    innerWrapper.style.cssText = 'position:relative; width:100%; height:100%; pointer-events:none;';
    this.appendChild(innerWrapper);

    const positionAttr = this.getAttribute('position') || '';
    const position = positionAttr || (presetConfig.position !== undefined ? presetConfig.position : this.DEFAULT_CONFIG.position);

    const strengthAttr = this.hasAttribute('strength') ? parseFloat(this.getAttribute('strength')) : null;
    const strength = strengthAttr !== null ? strengthAttr : (presetConfig.strength !== undefined ? presetConfig.strength : this.DEFAULT_CONFIG.strength);

    const hoverIntensityAttr = this.hasAttribute('hover-intensity') ? parseFloat(this.getAttribute('hover-intensity')) : null;
    const hoverIntensity = hoverIntensityAttr !== null ? hoverIntensityAttr : this.DEFAULT_CONFIG.hoverIntensity;

    const divCountAttr = this.hasAttribute('div-count') ? parseInt(this.getAttribute('div-count')) : null;
    const divCount = divCountAttr !== null ? divCountAttr : (presetConfig.divCount !== undefined ? presetConfig.divCount : this.DEFAULT_CONFIG.divCount);

    const exponentialAttr = this.hasAttribute('exponential') ? this.getAttribute('exponential') === 'true' : null;
    const exponential = exponentialAttr !== null ? exponentialAttr : (presetConfig.exponential !== undefined ? presetConfig.exponential : this.DEFAULT_CONFIG.exponential);

    const opacityAttr = this.hasAttribute('opacity') ? parseFloat(this.getAttribute('opacity')) : null;
    const opacity = opacityAttr !== null ? opacityAttr : (presetConfig.opacity !== undefined ? presetConfig.opacity : this.DEFAULT_CONFIG.opacity);

    const curveAttr = this.getAttribute('curve') || '';
    const curve = curveAttr || (presetConfig.curve !== undefined ? presetConfig.curve : this.DEFAULT_CONFIG.curve);

    const animatedAttr = this.getAttribute('animated') || '';
    const animated = animatedAttr || (presetConfig.animated !== undefined ? presetConfig.animated : this.DEFAULT_CONFIG.animated);

    const durationAttr = this.getAttribute('duration') || '';
    const duration = durationAttr || (presetConfig.duration !== undefined ? presetConfig.duration : this.DEFAULT_CONFIG.duration);

    const easingAttr = this.getAttribute('easing') || '';
    const easing = easingAttr || (presetConfig.easing !== undefined ? presetConfig.easing : this.DEFAULT_CONFIG.easing);

    const increment = 100 / divCount;
    const currentStrength = this.isHovered && hoverIntensity > 0 ? strength * hoverIntensity : strength;
    const curveFunc = this.CURVE_FUNCTIONS[curve] || this.CURVE_FUNCTIONS.linear;

    for (let i = 1; i <= divCount; i++) {
      let progress = i / divCount;
      progress = curveFunc(progress);

      let blurValue;
      if (exponential) {
        blurValue = Math.pow(2, progress * 4) * 0.0625 * currentStrength;
      } else {
        blurValue = 0.0625 * (progress * divCount + 1) * currentStrength;
      }

      const p1 = Math.round((increment * i - increment) * 10) / 10;
      const p2 = Math.round(increment * i * 10) / 10;
      const p3 = Math.round((increment * i + increment) * 10) / 10;
      const p4 = Math.round((increment * i + increment * 2) * 10) / 10;

      let gradient = `transparent ${p1}%, black ${p2}%`;
      if (p3 <= 100) gradient += `, black ${p3}%`;
      if (p4 <= 100) gradient += `, transparent ${p4}%`;

      const getGradientDirection = pos =>
        ({
          top: 'to top',
          bottom: 'to bottom',
          left: 'to left',
          right: 'to right'
        })[pos] || 'to bottom';

      const direction = getGradientDirection(position);
      const mask = `linear-gradient(${direction}, ${gradient})`;

      const div = document.createElement('div');
      
      // Backdrop-filter transition support matching React's transition style
      const transitionStyle = animated && animated !== 'scroll'
        ? `transition: backdrop-filter ${duration} ${easing}, -webkit-backdrop-filter ${duration} ${easing};`
        : '';

      div.style.cssText = `
        position: absolute;
        inset: 0;
        mask-image: ${mask};
        -webkit-mask-image: ${mask};
        backdrop-filter: blur(${blurValue.toFixed(3)}rem);
        -webkit-backdrop-filter: blur(${blurValue.toFixed(3)}rem);
        opacity: ${opacity};
        ${transitionStyle}
      `;
      innerWrapper.appendChild(div);
    }

    // Scroll triggering support matching React's intersection observer
    if (animated === 'scroll') {
      const observer = new IntersectionObserver(([entry]) => {
        this.style.opacity = entry.isIntersecting ? '1' : '0';
      }, { threshold: 0.1 });
      observer.observe(this.parentElement || this);
    }
  }
}

// Safely register custom element
if (typeof window !== 'undefined' && !window.customElements.get('gradual-blur')) {
  window.customElements.define('gradual-blur', GradualBlur);

  // Inject shared styling rules
  const styleId = 'gradual-blur-styles';
  if (!document.getElementById(styleId)) {
    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = `
      .gradual-blur { 
        pointer-events: none; 
        transition: opacity 0.3s ease-out; 
        isolation: isolate; 
      }
      .gradual-blur-parent { 
        overflow: hidden; 
      }
      .gradual-blur-inner { 
        position: relative;
        width: 100%;
        height: 100%;
        pointer-events: none; 
      }
      .gradual-blur-inner > div {
        -webkit-backdrop-filter: inherit;
        backdrop-filter: inherit;
      }
      .gradual-blur-fixed {
        position: fixed !important;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        z-index: 1000;
      }
      @supports not (backdrop-filter: blur(1px)) {
        .gradual-blur-inner > div {
          background: rgba(0, 0, 0, 0.3) !important;
          opacity: 0.5 !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }
      }
    `;
    document.head.appendChild(styleElement);
  }
}
