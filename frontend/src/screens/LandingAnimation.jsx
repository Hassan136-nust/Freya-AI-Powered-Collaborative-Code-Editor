import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoadingAnimation.css';

const LandingAnimation = () => {
  const containerRef = useRef(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const navigate = useNavigate();

  const totalFrames = 8;
  const animationDuration = 4500; // 4.5 seconds

  useEffect(() => {
    // Preload all images
    const images = [];
    for (let i = 1; i <= totalFrames; i++) {
      const img = new Image();
      img.src = `/animations/frame_${String(i).padStart(4, '0')}.png`;
      images.push(img);
    }

    // Start animation after a brief delay
    const startDelay = setTimeout(() => {
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / animationDuration, 1);
        
        // Cinematic easing (ease-in-out-cubic)
        const eased = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        
        setProgress(eased);
        
        // Calculate current frame with smooth transitions
        const frameIndex = Math.floor(eased * (totalFrames - 1));
        setCurrentFrame(frameIndex);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setIsComplete(true);
          // Show button after animation completes
          setTimeout(() => {
            setShowButton(true);
          }, 500);
        }
      };
      
      requestAnimationFrame(animate);
    }, 300);

    return () => clearTimeout(startDelay);
  }, []);

  // Generate floating particles
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 3,
    duration: 3 + Math.random() * 4,
  }));

  return (
    <div className="loading-animation-container" ref={containerRef}>
      {/* Background with gradient */}
      <div className="loading-bg">
        <div className="loading-gradient"></div>
        <div className="loading-grid"></div>
      </div>

      {/* Floating particles */}
      <div className="particles-container">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="particle"
            style={{
              left: `${particle.left}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
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

      {/* Main animation frames */}
      <div className="frames-container">
        {Array.from({ length: totalFrames }, (_, i) => {
          const frameNum = i + 1;
          const isActive = i === currentFrame;
          const isPrev = i === currentFrame - 1;
          
          // Calculate transform based on progress
          const frameProgress = (progress * totalFrames) - i;
          const scale = isActive 
            ? 1 + (isComplete ? 0.05 : Math.sin(progress * Math.PI) * 0.02)
            : 1;
          const opacity = isActive ? 1 : isPrev ? 0.3 : 0;
          const translateY = isActive ? 0 : frameProgress * -20;
          const blur = isActive ? 0 : 5;
          
          return (
            <div
              key={frameNum}
              className={`frame ${isActive ? 'active' : ''} ${isPrev ? 'prev' : ''}`}
              style={{
                opacity,
                transform: `scale(${scale}) translateY(${translateY}px) translateZ(${i * 10}px)`,
                filter: `blur(${blur}px)`,
                zIndex: totalFrames - i,
              }}
            >
              <img
                src={`/animations/frame_${String(frameNum).padStart(4, '0')}.png`}
                alt={`Frame ${frameNum}`}
                draggable="false"
              />
              
              {/* Glow effect on active frame */}
              {isActive && (
                <div className="frame-glow"></div>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating code snippets */}
      <div className="code-snippets">
        <div className="code-snippet snippet-1" style={{ opacity: Math.min(progress * 2, 0.6) }}>
          <span className="code-line">{'<AI>'}</span>
        </div>
        <div className="code-snippet snippet-2" style={{ opacity: Math.min(progress * 1.5, 0.5) }}>
          <span className="code-line">{'const freya = () => {}'}</span>
        </div>
        <div className="code-snippet snippet-3" style={{ opacity: Math.min(progress * 1.8, 0.4) }}>
          <span className="code-line">{'// Collaborative coding'}</span>
        </div>
      </div>

      {/* Cursor effect */}
      <div 
        className="cursor-trail"
        style={{
          left: `${30 + progress * 40}%`,
          top: `${40 + Math.sin(progress * Math.PI * 2) * 10}%`,
        }}
      ></div>

      {/* FREYA branding */}
      <div className="branding" style={{ opacity: isComplete ? 1 : 0 }}>
       
        
        {/* Get Started Button */}
        {showButton && (
          <button 
            className="cta-button"
            onClick={() => navigate('/home')}
          >
            Get Started
            <span className="button-glow"></span>
          </button>
        )}
      </div>

      {/* Progress indicator */}
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${progress * 100}%` }}
        ></div>
      </div>

      {/* Vignette overlay */}
      <div className="vignette" style={{ opacity: isComplete ? 0.6 : 0.3 }}></div>
    </div>
  );
};

export default LandingAnimation;
