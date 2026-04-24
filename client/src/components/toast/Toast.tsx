import React, { useEffect, useState, useRef, useCallback } from 'react';
import './styles.scss';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 3000 }) => {
  const [isClosing, setIsClosing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  // 1. Use ReturnType<typeof setTimeout> for environment-agnostic TS compatibility
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remainingTimeRef = useRef(duration);
  // 2. Initialize with 0 to satisfy React's strict purity linter
  const startTimeRef = useRef<number>(0);

  // 3. Slowed down the unmount wait to match the new 0.5s CSS animation
  const triggerClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 750);
  }, [onClose]);

  const startTimer = useCallback(() => {
    // Failsafe: Don't start a new timer if one is already running
    if (timerRef.current) return;

    startTimeRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      triggerClose();
    }, remainingTimeRef.current);
  }, [triggerClose]);

  const pauseTimer = useCallback(() => {
    // Failsafe: Only do the math if a timer is ACTUALLY running.
    // This prevents double-subtraction if the user hovers AND clicks pin.
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null; // Clear it out!
      remainingTimeRef.current -= Date.now() - startTimeRef.current;
    }
  }, []);

  useEffect(() => {
    if (!isPinned && !isHovered) {
      startTimer();
    } else {
      pauseTimer();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPinned, isHovered, startTimer, pauseTimer]);

  const isPaused = isHovered || isPinned;

  return (
    <div
      className={`toast-container ${type} ${isClosing ? 'closing' : ''} ${isPaused ? 'paused' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="toast-content">
        <span className="toast-message">{message}</span>

        <div className="toast-actions">
          {/* PAUSE / PLAY BUTTON */}
          <button
            className="toast-btn"
            onClick={() => setIsPinned(!isPinned)}
            title={isPinned ? 'Resume timer' : 'Keep toast open'}
          >
            {isPinned ? (
              // Play Icon
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            ) : (
              // Pause Icon
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
              </svg>
            )}
          </button>

          {/* CLOSE BUTTON */}
          <button className="toast-btn" onClick={triggerClose} title="Close">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <div className="toast-progress" style={{ animationDuration: `${duration}ms` }} />
    </div>
  );
};

export default Toast;
