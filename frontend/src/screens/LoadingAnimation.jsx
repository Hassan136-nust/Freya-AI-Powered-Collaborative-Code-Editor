import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoadingAnimation.css';

const LoadingAnimation = () => {
  const containerRef = useRef(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  const [frameState, setFrameState] = useState({ frame: 0, nextFrame: 0, opacity: 0, showButton: false });
  const [showIntro, setShowIntro] = useState(true);
  const [displayedText, setDisplayedText] = useState('');
  const navigate = useNavigate();

  const totalFrames = 82;
  const frameProgressRef = useRef(0);
  const animationFrameRef = useRef(null);
  const targetProgressRef = useRef(0);
  const lastFrameRef = useRef(0);
  const lastOpacityRef = useRef(0);
  const imageCache = useRef(new Map());

  const fullText = 'WELCOME to FREYA';

  // Prevent body scroll and cleanup on unmount
  useEffect(() => {
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';

    return () => {
      // Restore body scroll on unmount
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, []);

  // Typing animation - faster and no delay
  useEffect(() => {
    if (!showIntro) return;

    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setDisplayedText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        // Immediately hide intro after typing completes
        setTimeout(() => setShowIntro(false), 100);
      }
    }, 50); // Faster typing speed

    return () => clearInterval(typingInterval);
  }, [showIntro]);

  // Preload all images with error handling and caching
  useEffect(() => {
    let loaded = 0;
    let failed = 0;
    const loadPromises = [];

    for (let i = 0; i < totalFrames; i++) {
      const promise = new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          loaded++;
          imageCache.current.set(i, img);
          setLoadedCount(loaded);
          if (loaded + failed === totalFrames) {
            setImagesLoaded(true);
          }
          resolve();
        };
        img.onerror = () => {
          failed++;
          console.warn(`Failed to load frame ${i}`);
          if (loaded + failed === totalFrames) {
            setImagesLoaded(true);
          }
          resolve();
        };
        img.src = `/animations/animate_in_cinamtic_style_202605021652_${String(i).padStart(3, '0')}.png`;
      });
      loadPromises.push(promise);
    }

    return () => {
      // Cleanup image cache on unmount
      imageCache.current.clear();
    };
  }, []);

  // Smooth animation loop - optimized for stability
  useEffect(() => {
    if (!imagesLoaded || showIntro) return;

    let isActive = true;
    let lastUpdateTime = 0;
    const updateInterval = 1000 / 60; // 60 FPS cap

    const animate = (currentTime) => {
      if (!isActive) return;

      // Throttle updates to 60 FPS
      if (currentTime - lastUpdateTime < updateInterval) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }
      lastUpdateTime = currentTime;

      // Calculate velocity for smooth momentum with better easing
      const diff = targetProgressRef.current - frameProgressRef.current;
      frameProgressRef.current += diff * 0.15; // Slightly faster response

      // Clamp to valid range
      frameProgressRef.current = Math.max(0, Math.min(totalFrames - 1, frameProgressRef.current));

      // Get frame and blend
      const floorFrame = Math.floor(frameProgressRef.current);
      const blendAmount = frameProgressRef.current - floorFrame;

      const frame1 = Math.max(0, Math.min(totalFrames - 1, floorFrame));
      const frame2 = Math.max(0, Math.min(totalFrames - 1, floorFrame + 1));
      const showBtn = frameProgressRef.current >= totalFrames - 1.5;

      // Update only when needed
      if (frame1 !== lastFrameRef.current || Math.abs(blendAmount - lastOpacityRef.current) > 0.05 || showBtn !== frameState.showButton) {
        lastFrameRef.current = frame1;
        lastOpacityRef.current = blendAmount;
        setFrameState({ frame: frame1, nextFrame: frame2, opacity: blendAmount, showButton: showBtn });
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      isActive = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [imagesLoaded, showIntro, frameState.showButton]);

  // Handle scroll and touch - improved stability
  useEffect(() => {
    if (!imagesLoaded || showIntro) return;

    let touchStartY = 0;
    let isScrolling = false;
    let scrollTimeout = null;

    const handleWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Debounce rapid scroll events
      if (!isScrolling) {
        isScrolling = true;
      }
      
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isScrolling = false;
      }, 50);

      // Smoother scroll with better delta handling
      const delta = e.deltaY * 0.01;
      targetProgressRef.current += delta;
      targetProgressRef.current = Math.max(0, Math.min(totalFrames - 1, targetProgressRef.current));
    };

    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const touchEndY = e.touches[0].clientY;
      const swipeDistance = touchStartY - touchEndY;
      targetProgressRef.current += swipeDistance * 0.02;
      targetProgressRef.current = Math.max(0, Math.min(totalFrames - 1, targetProgressRef.current));
      touchStartY = touchEndY;
    };

    const container = containerRef.current;
    if (container) {
      // Use capture phase to ensure we catch events first
      container.addEventListener('wheel', handleWheel, { passive: false, capture: true });
      container.addEventListener('touchstart', handleTouchStart, { passive: true });
      container.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });
      
      return () => {
        clearTimeout(scrollTimeout);
        container.removeEventListener('wheel', handleWheel, { capture: true });
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove, { capture: true });
      };
    }
  }, [imagesLoaded, showIntro]);

  return (
    <div className="animation-container" ref={containerRef}>
      {/* Loading Indicator */}
      {!imagesLoaded && (
        <div className="loading-indicator">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading Experience...</p>
          <div className="loading-progress">
            <div 
              className="loading-progress-bar" 
              style={{ width: `${(loadedCount / totalFrames) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Intro with Typing Animation */}
      {showIntro && imagesLoaded && (
        <div className="intro-overlay">
          {/* Falling particles */}
          <div className="intro-particles">
            {Array.from({ length: 15 }, (_, i) => (
              <div
                key={`intro-particle-${i}`}
                className="intro-particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 0.5}s`,
                }}
              />
            ))}
          </div>

          {/* Typing Text */}
          <div className="typing-container">
            <p className="typing-text">{displayedText}</p>
            <span className="typing-cursor"></span>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className={`content-wrapper ${imagesLoaded && !showIntro ? 'loaded' : ''}`}>
        {/* Background */}
        <div className="bg-container">
          <div className="bg-gradient"></div>
          <div className="bg-grid"></div>
        </div>

        {/* Floating particles */}
        <div className="particles-container">
          {Array.from({ length: 20 }, (_, i) => (
            <div
              key={`particle-${i}`}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
              }}
            />
          ))}
        </div>

        {/* Light streaks */}
        <div className="light-streaks">
          <div className="streak streak-1"></div>
          <div className="streak streak-2"></div>
          <div className="streak streak-3"></div>
        </div>

        {/* Image display with smooth blending */}
        <div className="image-container">
          {/* Current frame */}
          <div className="image-display current">
            <img
              src={`/animations/animate_in_cinamtic_style_202605021652_${String(frameState.frame).padStart(3, '0')}.png`}
              alt={`Frame ${frameState.frame}`}
              draggable="false"
              className="frame-image"
            />
            <div className="image-glow"></div>
          </div>

          {/* Next frame - blended on top */}
          {frameState.opacity > 0 && (
            <div className="image-display next" style={{ opacity: frameState.opacity }}>
              <img
                src={`/animations/animate_in_cinamtic_style_202605021652_${String(frameState.nextFrame).padStart(3, '0')}.png`}
                alt={`Frame ${frameState.nextFrame}`}
                draggable="false"
                className="frame-image"
              />
              <div className="image-glow"></div>
            </div>
          )}

          {/* Code overlay */}
          <div className="code-overlay">
            <div className="code-box">
              <span className="code-text">
                {frameState.frame < 20 && '// Welcome to FREYA'}
                {frameState.frame >= 20 && frameState.frame < 40 && '<AI /> Powered'}
                {frameState.frame >= 40 && frameState.frame < 60 && 'const collaborate = true'}
                {frameState.frame >= 60 && frameState.frame < 80 && '// Real-time editing'}
                {frameState.frame >= 80 && '// Start building'}
              </span>
            </div>
          </div>
        </div>

        {/* Button overlay */}
        <div className={`button-overlay ${frameState.showButton ? 'show' : ''}`}>
          <div className="button-wrapper">
          
            <button 
              className="cta-button"
              onClick={() => navigate('/home')}
            >
              Start Coding
              <span className="button-glow"></span>
            </button>
          </div>
        </div>

        {/* Scroll hint */}
        <div className={`scroll-hint ${imagesLoaded && !frameState.showButton && !showIntro ? 'show' : ''}`}>
          <div className="hint-arrow"></div>
          <p>Scroll to explore</p>
        </div>

        {/* Frame counter */}
        <div className={`frame-counter ${imagesLoaded && !showIntro ? 'show' : ''}`}>
          <span>{frameState.frame}</span> / <span>{totalFrames - 1}</span>
        </div>
      </div>

      {/* Vignette */}
      <div className="vignette"></div>
    </div>
  );
};

export default LoadingAnimation;
