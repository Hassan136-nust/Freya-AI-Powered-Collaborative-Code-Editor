import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import './LoadingAnimation.css';

const LoadingAnimation = () => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  const [frameState, setFrameState] = useState({ frame: 1, nextFrame: 2, opacity: 0, showButton: false });
  const [showIntro, setShowIntro] = useState(true);
  const [displayedText, setDisplayedText] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [redrawTrigger, setRedrawTrigger] = useState(0);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const navigate = useNavigate();

  const totalFrames = 300;
  const frameStep = 1; // Load every 3rd frame to reduce download count to 80 frames
  const preloadCount = 10; // Preload first 10 frames (mapped to step) for immediate display
  const frameObj = useRef({ val: 1 });
  const imageCache = useRef(new Map());
  const loadingFrames = useRef(new Set());
  const isMountedRef = useRef(true);
  const hasInitializedRef = useRef(false);

  const fullText = 'WELCOME to FREYA';

  // Helper to map virtual frame index (1-240) to the nearest available step-based frame
  const getActualFrameNumber = (frameIndex) => {
    if (frameIndex <= 1) return 1;
    if (frameIndex >= totalFrames) return totalFrames;
    const val = Math.round((frameIndex - 1) / frameStep) * frameStep + 1;
    return Math.min(totalFrames, val);
  };

  // Track window resizing to ensure perfect responsiveness and no black borders
  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll and cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;

    const hasSeenAnimation = sessionStorage.getItem('freya_animation_seen');
    if (hasSeenAnimation === 'true') {
      sessionStorage.removeItem('freya_animation_seen');
    }

    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalWidth = document.body.style.width;
    const originalHeight = document.body.style.height;

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';

    return () => {
      isMountedRef.current = false;
      sessionStorage.setItem('freya_animation_seen', 'true');

      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = originalWidth;
      document.body.style.height = originalHeight;

      gsap.killTweensOf(frameObj.current);
      imageCache.current.clear();
      loadingFrames.current.clear();
    };
  }, []);

  // Typing animation - runs after critical frames are loaded
  useEffect(() => {
    if (!showIntro || !imagesLoaded) return;
    if (isTypingComplete) return;

    let currentIndex = 0;
    let typingInterval = null;

    const startTimeout = setTimeout(() => {
      if (!isMountedRef.current) return;

      typingInterval = setInterval(() => {
        if (!isMountedRef.current) {
          clearInterval(typingInterval);
          return;
        }

        if (currentIndex <= fullText.length) {
          setDisplayedText(fullText.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(typingInterval);
          setIsTypingComplete(true);

          setTimeout(() => {
            if (isMountedRef.current) {
              setShowIntro(false);
            }
          }, 100);
        }
      }, 50);
    }, 100);

    const fallbackTimeout = setTimeout(() => {
      if (isMountedRef.current && showIntro && !isTypingComplete) {
        setDisplayedText(fullText);
        setIsTypingComplete(true);
        setTimeout(() => {
          if (isMountedRef.current) {
            setShowIntro(false);
          }
        }, 100);
      }
    }, 5000);

    return () => {
      clearTimeout(startTimeout);
      clearTimeout(fallbackTimeout);
      if (typingInterval) {
        clearInterval(typingInterval);
      }
    };
  }, [showIntro, imagesLoaded, isTypingComplete, fullText]);

  // Progressive image loading (Lazy loading step-mapped frames in the background)
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const targetFrames = [];
    for (let i = 1; i <= totalFrames; i += frameStep) {
      targetFrames.push(i);
    }
    if (targetFrames[targetFrames.length - 1] !== totalFrames) {
      targetFrames.push(totalFrames);
    }

    let preloaded = 0;
    const initialPreloadList = targetFrames.slice(0, preloadCount);

    initialPreloadList.forEach((frameNum) => {
      const img = new Image();
      img.onload = () => {
        if (!isMountedRef.current) return;
        imageCache.current.set(frameNum, img);
        preloaded++;
        setLoadedCount(preloaded);
        if (preloaded === initialPreloadList.length) {
          setImagesLoaded(true);
          loadRemainingFrames();
        }
      };
      img.onerror = () => {
        if (!isMountedRef.current) return;
        preloaded++;
        setLoadedCount(preloaded);
        if (preloaded === initialPreloadList.length) {
          setImagesLoaded(true);
          loadRemainingFrames();
        }
      };
      img.src = `/ani/ezgif-frame-${String(frameNum).padStart(3, '0')}.jpg`;
    });

    const loadRemainingFrames = async () => {
      const remaining = targetFrames.slice(preloadCount);
      const batchSize = 4;
      for (let i = 0; i < remaining.length; i += batchSize) {
        if (!isMountedRef.current) break;
        const batch = remaining.slice(i, i + batchSize);
        await Promise.all(
          batch.map((frameIndex) => {
            return new Promise((resolve) => {
              if (imageCache.current.has(frameIndex)) {
                resolve();
                return;
              }
              const img = new Image();
              img.onload = () => {
                imageCache.current.set(frameIndex, img);
                resolve();
              };
              img.onerror = () => {
                resolve();
              };
              img.src = `/ani/ezgif-frame-${String(frameIndex).padStart(3, '0')}.jpg`;
            });
          })
        );
        await new Promise((resolve) => setTimeout(resolve, 60));
      }
    };
  }, []);

  // Helper to dynamically get or trigger load of a specific frame
  const getImage = (frameIndex) => {
    if (imageCache.current.has(frameIndex)) {
      return imageCache.current.get(frameIndex);
    }

    if (!loadingFrames.current.has(frameIndex)) {
      loadingFrames.current.add(frameIndex);
      const img = new Image();
      img.onload = () => {
        imageCache.current.set(frameIndex, img);
        loadingFrames.current.delete(frameIndex);
        setRedrawTrigger((prev) => prev + 1); // trigger canvas redraw
      };
      img.onerror = () => {
        loadingFrames.current.delete(frameIndex);
      };
      img.src = `/ani/ezgif-frame-${String(frameIndex).padStart(3, '0')}.jpg`;
    }
    return null;
  };

  // Canvas drawing effect: draws current frame and next frame with opacity blending
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imagesLoaded) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use actual dimensions state to scale correctly
    canvas.width = dimensions.width * window.devicePixelRatio;
    canvas.height = dimensions.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const getClosestLoadedImage = (frame) => {
      if (imageCache.current.has(frame)) return imageCache.current.get(frame);
      for (let i = 1; i <= totalFrames; i++) {
        if (frame - i >= 1 && imageCache.current.has(frame - i)) {
          return imageCache.current.get(frame - i);
        }
        if (frame + i <= totalFrames && imageCache.current.has(frame + i)) {
          return imageCache.current.get(frame + i);
        }
      }
      return null;
    };

    const draw = () => {
      // Clear with warm charcoal background matching the images
      ctx.fillStyle = '#12110e';
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      const actualFrame1 = getActualFrameNumber(frameState.frame);
      const actualFrame2 = getActualFrameNumber(frameState.nextFrame);

      const img1 = getImage(actualFrame1);
      const img2 = frameState.opacity > 0 ? getImage(actualFrame2) : null;

      // perfect responsive cover scaling
      const drawCover = (img, opacity) => {
        ctx.globalAlpha = opacity;
        const iw = img.width;
        const ih = img.height;
        const isMobile = dimensions.width < 768;

        if (isMobile) {
          // On mobile, fit the entire image to the viewport width (scaled down to 85% to fit beautifully without cutoffs)
          const targetWidth = dimensions.width * 0.85;
          const r = targetWidth / iw;
          const destWidth = iw * r;
          const destHeight = ih * r;

          const destX = (dimensions.width - destWidth) / 2;
          const destY = (dimensions.height - destHeight) / 2;

          ctx.drawImage(img, 0, 0, iw, ih, destX, destY, destWidth, destHeight);
        } else {
          // On desktop, use standard cover scaling
          const r = Math.max(dimensions.width / iw, dimensions.height / ih);
          const nw = iw * r;
          const nh = ih * r;

          const cx = (nw - dimensions.width) / r * 0.5;
          const cy = (nh - dimensions.height) / r * 0.5;
          const cw = dimensions.width / r;
          const ch = dimensions.height / r;

          ctx.drawImage(
            img,
            Math.max(0, cx),
            Math.max(0, cy),
            Math.min(iw, cw),
            Math.min(ih, ch),
            0,
            0,
            dimensions.width,
            dimensions.height
          );
        }
      };

      if (img1 && img2 && frameState.opacity > 0) {
        drawCover(img1, 1 - frameState.opacity);
        drawCover(img2, frameState.opacity);
      } else {
        const activeImg = img1 || getClosestLoadedImage(actualFrame1);
        if (activeImg) {
          drawCover(activeImg, 1.0);
        }
      }
    };

    draw();
  }, [frameState, imagesLoaded, redrawTrigger, dimensions]);

  // Scroll and touch animation controller using GSAP for inertia
  useEffect(() => {
    if (!imagesLoaded || showIntro || !isMountedRef.current) return;

    let touchStartY = 0;

    const handleWheel = (e) => {
      if (!isMountedRef.current) return;
      e.preventDefault();
      e.stopPropagation();

      const scrollSensitivity = 0.55;
      const delta = e.deltaY * scrollSensitivity;
      const targetVal = Math.max(1, Math.min(totalFrames, frameObj.current.val + delta));

      gsap.killTweensOf(frameObj.current);
      gsap.to(frameObj.current, {
        val: targetVal,
        duration: 0.35,
        ease: 'power2.out',
        onUpdate: () => {
          if (!isMountedRef.current) return;
          const val = frameObj.current.val;
          const floorFrame = Math.floor(val);
          const blendAmount = val - floorFrame;
          const frame1 = Math.max(1, Math.min(totalFrames, floorFrame));
          const frame2 = Math.max(1, Math.min(totalFrames, floorFrame + 1));
          const showBtn = val >= totalFrames - 1.5;

          setFrameState({
            frame: frame1,
            nextFrame: frame2,
            opacity: blendAmount,
            showButton: showBtn,
          });
        },
      });
    };

    const handleTouchStart = (e) => {
      if (!isMountedRef.current) return;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      if (!isMountedRef.current) return;
      e.preventDefault();
      e.stopPropagation();

      const touchEndY = e.touches[0].clientY;
      const swipeDistance = touchStartY - touchEndY;
      const targetVal = Math.max(1, Math.min(totalFrames, frameObj.current.val + swipeDistance * 0.8));
      touchStartY = touchEndY;

      gsap.killTweensOf(frameObj.current);
      gsap.to(frameObj.current, {
        val: targetVal,
        duration: 0.35,
        ease: 'power2.out',
        onUpdate: () => {
          if (!isMountedRef.current) return;
          const val = frameObj.current.val;
          const floorFrame = Math.floor(val);
          const blendAmount = val - floorFrame;
          const frame1 = Math.max(1, Math.min(totalFrames, floorFrame));
          const frame2 = Math.max(1, Math.min(totalFrames, floorFrame + 1));
          const showBtn = val >= totalFrames - 1.5;

          setFrameState({
            frame: frame1,
            nextFrame: frame2,
            opacity: blendAmount,
            showButton: showBtn,
          });
        },
      });
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false, capture: true });
      container.addEventListener('touchstart', handleTouchStart, { passive: true });
      container.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });

      return () => {
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
              style={{ width: `${(loadedCount / preloadCount) * 100}%` }}
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
          . <div className="streak streak-1"></div>
          <div className="streak streak-2"></div>
          <div className="streak streak-3"></div>
        </div>

        {/* Canvas display with smooth blending */}
        <div className="image-container">
          <canvas
            ref={canvasRef}
            className="frame-image"
            style={{ width: '100%', height: '100%' }}
          />
          <div className="image-glow"></div>

          {/* Code overlay */}
          <div className="code-overlay">
            <div className="code-box">
              <span className="code-text">
                {frameState.frame < 40 && '// Welcome to FREYA'}
                {frameState.frame >= 40 && frameState.frame < 100 && '<AI /> Powered'}
                {frameState.frame >= 100 && frameState.frame < 160 && 'const collaborate = true'}
                {frameState.frame >= 160 && frameState.frame < 220 && '// Real-time editing'}
                {frameState.frame >= 220 && '// Start building'}
              </span>
            </div>
          </div>
        </div>

        {/* Button overlay */}
        <div className={`button-overlay ${frameState.showButton ? 'show' : ''}`}>
          <div className="button-wrapper">
            <button
              className="cta-button mt-76"
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
          <span>{frameState.frame}</span> / <span>{totalFrames}</span>
        </div>
      </div>

      {/* Vignette */}
      <div className="vignette"></div>
    </div>
  );
};

export default LoadingAnimation;
