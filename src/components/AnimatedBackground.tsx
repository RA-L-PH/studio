
'use client';

export default function AnimatedBackground() {
  return (
    <div className="absolute inset-0 z-0">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute text-green-500/10 text-5xl font-bold"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            transform: `rotate(${Math.random() * 360}deg)`,
            animation: `move 20s infinite alternate-reverse`,
          }}
        >
          +
        </div>
      ))}

      <style jsx global>{`
        @keyframes move {
          from {
            transform: translate(0, 0) rotate(0deg);
          }
          to {
            transform: translate(100px, -100px) rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
