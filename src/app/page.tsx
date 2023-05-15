"use client";
import { useRef, MouseEvent, useState, useEffect } from "react";
import styles from "./page.module.css";

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasCtx, setCanvasCtx] = useState(canvasRef.current?.getContext("2d"));
  const [shouldDraw, setShouldDraw] = useState(false);

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = "rgb(255, 255, 255)";
        ctx.beginPath();
      }
      setCanvasCtx(ctx);
    }
  }, [canvasRef.current]);

  const handleMouseMove = (e: MouseEvent) => {
    if (canvasCtx) {
      if (shouldDraw) {
        canvasCtx.lineTo(e.pageX, e.pageY);
        canvasCtx.stroke();
      } else {
        canvasCtx.moveTo(e.pageX, e.pageY);
      }
    }
  };

  return (
    <main className={styles.main}>
      <canvas
        height={1000}
        width={1000}
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseDown={() => setShouldDraw(true)}
        onMouseUp={() => setShouldDraw(false)}
      >
        <p>Your browser does not support this.</p>
      </canvas>
    </main>
  );
}

// function canvasMagic(ctx: CanvasRenderingContext2D) {
//   ctx.strokeStyle = "rgb(255, 255, 255)";
//   ctx.fillStyle = "rgb(255, 0, 0)";

//   // ctx.fillRect(0, 0, 300, 400);

//   ctx.beginPath();
//   ctx.moveTo(50, 50);
//   ctx.lineTo(150, 50);
//   ctx.lineTo(100, 50 + 50 * Math.tan(degToRad(60)));
//   ctx.lineTo(50, 50);
//   ctx.fill();

//   ctx.lineWidth = 1;
//   ctx.font = "48px arial";
//   ctx.fillText("Hello world", 300, 300);
//   ctx.strokeText("Hello world", 300, 300);
// }

export function degToRad(value: number) {
  return (value * Math.PI) / 180;
}
