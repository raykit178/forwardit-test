import { useEffect, useState } from "react";

const MICRO_COPY = [
  "Picking the perfect mood for your occasion…",
  "Every image made just for your brand…",
  "Your customers will love this one…",
  "Making sure your logo looks just right…",
  "Almost there — adding the finishing touches…",
  "30 seconds to a greeting your customers will remember…",
];

export function GenerateLoadingVisual() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % MICRO_COPY.length);
        setVisible(true);
      }, 500);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center">
      <svg
        width="200"
        height="200"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Drawing border */}
        <rect
          x="6"
          y="6"
          width="188"
          height="188"
          rx="20"
          ry="20"
          stroke="#0073F8"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          style={{
            strokeDasharray: 800,
            strokeDashoffset: 800,
            animation: "navo-draw 1s ease-out forwards",
          }}
        />

        {/* Circle */}
        <circle
          cx="55"
          cy="70"
          r="14"
          fill="#E5E7EB"
          style={{
            opacity: 0,
            animation:
              "navo-fade-in 0.6s ease-out 1.1s forwards, navo-float-a 4s ease-in-out 1.7s infinite",
          }}
        />

        {/* Horizontal line */}
        <rect
          x="50"
          y="110"
          width="100"
          height="6"
          rx="3"
          fill="#E5E7EB"
          style={{
            opacity: 0,
            animation:
              "navo-fade-in 0.6s ease-out 1.5s forwards, navo-float-b 4.5s ease-in-out 2.1s infinite",
          }}
        />

        {/* Rectangle accent */}
        <rect
          x="100"
          y="55"
          width="50"
          height="36"
          rx="6"
          fill="#0073F8"
          style={{
            opacity: 0,
            animation:
              "navo-fade-in 0.6s ease-out 1.9s forwards, navo-float-c 5s ease-in-out 2.5s infinite",
          }}
        />

        <style>{`
          @keyframes navo-draw {
            to { stroke-dashoffset: 0; }
          }
          @keyframes navo-fade-in {
            from { opacity: 0; transform: translateY(4px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes navo-float-a {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
          }
          @keyframes navo-float-b {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(4px); }
          }
          @keyframes navo-float-c {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-6px); }
          }
        `}</style>
      </svg>
    </div>
  );
}

export function GenerateLoadingMicroCopy() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % MICRO_COPY.length);
        setVisible(true);
      }, 500);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <p
      className="mt-6 text-center text-xs italic transition-opacity duration-500"
      style={{ color: "#888888", opacity: visible ? 1 : 0 }}
    >
      {MICRO_COPY[idx]}
    </p>
  );
}
