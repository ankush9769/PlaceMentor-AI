import React, { useEffect, useState } from 'react';
import '../styles/components/Timer.css';

const Timer = ({ initialTime, onExpire }) => {
  const [timeRemaining, setTimeRemaining] = useState(initialTime);

  useEffect(() => {
    if (timeRemaining <= 0) {
      onExpire();
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining, onExpire]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerClass = () => {
    const percentage = (timeRemaining / initialTime) * 100;
    if (percentage <= 10) return 'timer critical';
    if (percentage <= 25) return 'timer warning';
    return 'timer';
  };

  return (
    <div className={getTimerClass()}>
      <svg className="timer-ring" width="80" height="80">
        <circle
          className="timer-ring-circle"
          stroke="currentColor"
          strokeWidth="4"
          fill="transparent"
          r="36"
          cx="40"
          cy="40"
          style={{
            strokeDasharray: `${2 * Math.PI * 36}`,
            strokeDashoffset: `${2 * Math.PI * 36 * (1 - timeRemaining / initialTime)}`,
          }}
        />
      </svg>
      <div className="timer-text">{formatTime(timeRemaining)}</div>
    </div>
  );
};

export default Timer;
