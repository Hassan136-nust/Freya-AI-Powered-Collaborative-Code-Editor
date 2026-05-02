import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoadingAnimation.css';

const LoadingAnimation = () => {
  const containerRef = useRef(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  const [frameState, setFrameState] = useState({ frame: 8, nextFrame: 8, opacity: 0, showButton: false });
  const [showIntro, setShowIntro] = useState(true);
  const [introComplete, setIntroComplete] = useState(false);
  const navigate = useNavigate();

  const totalFrames = 8;
  const frameProgressRef = useRef(0);
  const animationFrameRef = useRef(null);
  const targetProgressRef = useRef(0);
  const lastFrameRef = useRef(8);
  const lastOpacityRef = useRef(0);

  // Preload all images
  useEffect(() => {
    let loaded = 0;

    for (let i = 1; i <= totalFrames; i++) {
      const img = new Image();
      img.onload = () => {
        loaded++;
        setLoadedCount(loaded);
        if (loaded === totalFrames) {
          setImagesLoaded(true);
        }
      };
      img.src = `/animations/frame_${String(i).padStart(4, '0')}.png`;
    }
  }, []);

  // Handle intro animation completion
  useEffect(() => {
    if (!showIntro) {
      setIntroComplete(true);
    }
  }, [showIntro]);

  // Smooth animation loop with momentum - optimized
  useEffect(() => {
    if (!imagesLoaded || !introComplete) return;

    const animate = () => {
      // Calculate velocity for ultra-smooth momentum
      const diff = targetProgressRef.current - frameProgressRef.current;
      frameProgressRef.current += diff * 0.08; // Smoother easing

      // Get integer frame and blend amount
      const floorFrame = Math.floor(frameProgressRef.current);
      const blendAmount = frameProgressRef.current - floorFrame;

      // Calculate frame numbers (8 down to 1)
      const frame1 = Math.max(1, 8 - floorFrame);
      const frame2 = Math.max(1, 8 - floorFrame - 1);
      const showBtn = frameProgressRef.current >= 6.95;

      // Only update state if values actually changed (smaller threshold for smoother transitions)
      if (frame1 !== lastFrameRef.current || Math.abs(blendAmount - lastOpacityRef.current) > 0.005 || showBtn !== frameState.showButton) {
        lastFrameRef.current = frame1;
        lastOpacityRef.current = blendAmount;
        setFrameState({ frame: frame1, nextFrame: frame2, opacity: blendAmount, showButton: showBtn });
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [imagesLoaded, introComplete]);

  // Handle scroll with smooth momentum
  useEffect(() => {
    if (!imagesLoaded || !introComplete) return;

    const handleWheel = (e) => {
      e.preventDefault();

      // Higher sensitivity for more responsive cinematic feel
      const sensitivity = 0.0025;
      targetProgressRef.current += e.deltaY * sensitivity;

      // Clamp between 0 and 7
      targetProgressRef.current = Math.max(0, Math.min(7, targetProgressRef.current));
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        container.removeEventListener('wheel', handleWheel);
      };
    }
  }, [imagesLoaded, introComplete]);

  return (
    <div className="animation-container" ref={containerRef}>
      {/* Intro Animation */}
      {showIntro && (
        <div className="intro-overlay">
          {/* Falling circle */}
          <div className="falling-circle"></div>

          {/* Blast lines */}
          <div className="blast-container">
            {Array.from({ length: 12 }, (_, i) => (
              <div
                key={`blast-line-${i}`}
                className="blast-line"
                style={{
                  transform: `rotate(${(i * 30)}deg)`,
                }}
              ></div>
            ))}
          </div>

          {/* Falling particles during intro */}
          <div className="intro-particles">
            {Array.from({ length: 12 }, (_, i) => (
              <div
                key={`intro-particle-${i}`}
                className="intro-particle"
                style={{
                  left: `${(i * 8.33)}%`,
                  animationDelay: `${0.3 + i * 0.05}s`,
                }}
              />
            ))}
          </div>

          {/* Close intro after animation */}
          <div
            className="intro-close-trigger"
            onAnimationEnd={() => setShowIntro(false)}
          ></div>
        </div>
      )}

      {/* Loading Indicator */}
      {!imagesLoaded && (
        <div className="loading-indicator">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading cinematic experience...</p>
          <div className="loading-progress">
            <div 
              className="loading-progress-bar"
              style={{ width: `${(loadedCount / totalFrames) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Background */}
      <div className="bg-container">
        <div className="bg-gradient"></div>
        <div className="bg-grid"></div>
      </div>

      {/* Floating particles */}
      <div className="particles-container">
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={`particle-${i}`}
            className="particle"
            style={{
              left: `${(i * 12.5)}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `7s`,
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

      {/* Main content */}
      <div className={`content-wrapper ${imagesLoaded && introComplete ? 'loaded' : ''}`}>
        {/* Image display with smooth blending */}
        <div className="image-container">
          {/* Current frame */}
          <div className="image-display current">
            <img
              src={`/animations/frame_${String(frameState.frame).padStart(4, '0')}.png`}
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
                src={`/animations/frame_${String(frameState.nextFrame).padStart(4, '0')}.png`}
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
                {frameState.frame === 1 && '// Start building'}
                {frameState.frame === 2 && 'const future = "now"'}
                {frameState.frame === 3 && '// Seamless workflow'}
                {frameState.frame === 4 && 'function innovate() {}'}
                {frameState.frame === 5 && '// Real-time editing'}
                {frameState.frame === 6 && 'const collaborate = true'}
                {frameState.frame === 7 && '<AI /> Powered'}
                {frameState.frame === 8 && '// Welcome to FREYA'}
              </span>
            </div>
          </div>
        </div>

        {/* Button overlay */}
        <div className={`button-overlay ${frameState.showButton ? 'show' : ''}`}>
          <div className="button-wrapper">
            <h1 className="brand-title">FREYA</h1>
            <p className="brand-subtitle">AI-Powered Collaborative Code Editor</p>
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
        <div className={`scroll-hint ${imagesLoaded && !frameState.showButton && introComplete ? 'show' : ''}`}>
          <div className="hint-arrow"></div>
          <p>Scroll to explore</p>
        </div>

        {/* Frame counter */}
        <div className={`frame-counter ${imagesLoaded && introComplete ? 'show' : ''}`}>
          <span>{frameState.frame}</span> / <span>{totalFrames}</span>
        </div>
      </div>

      {/* Vignette */}
      <div className="vignette"></div>
    </div>
  );
};

export default LoadingAnimation;
