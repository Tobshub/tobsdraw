"use client";
import { useRef, MouseEvent, useState, useEffect } from "react";
import styles from "./page.module.css";

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ctx, setCanvasCtx] = useState(canvasRef.current?.getContext("2d"));
  const [shouldDraw, setShouldDraw] = useState(false);
  const controlsContainerRef = useRef<HTMLDivElement>(null);
  const [isEraser, setIsEraser] = useState(false);
  const colorChangerRef = useRef<HTMLInputElement>(null);
  const backgroundColor = "white";

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        resetCanvas(ctx, backgroundColor);
        ctx.beginPath();
        ctx.fillStyle = colorChangerRef.current?.value ?? "black";
      }
      setCanvasCtx(ctx);
    }
  }, [canvasRef.current]);

  const handleMouseMove = (e: MouseEvent) => {
    if (ctx) {
      const x = e.pageX,
        y = e.pageY;
      if (shouldDraw) {
        ctx.lineTo(x, y);
        ctx.stroke();
      } else {
        ctx.moveTo(x, y);
        ctx.beginPath();
      }
    }
  };

  return (
    <main className={styles.main}>
      <canvas
        height={800}
        width={1000}
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseDown={() => setShouldDraw(true)}
        onMouseUp={() => setShouldDraw(false)}
        onMouseOut={() => setShouldDraw(false)}
      >
        <p>Your browser does not support this.</p>
      </canvas>
      <div className={styles.controls} ref={controlsContainerRef} style={{ opacity: shouldDraw ? "35%" : "80%" }}>
        <button onClick={() => resetCanvas(ctx, backgroundColor)}>CLEAR</button>
        <input
          type="color"
          onChange={(e) => {
            if (ctx) {
              ctx.strokeStyle = e.target.value;
              ctx.fillStyle = e.target.value;
            }
          }}
          ref={colorChangerRef}
        />
        <button
          onClick={() => {
            if (!ctx) {
              return;
            } else if (isEraser) {
              ctx.lineWidth = 1;
              ctx.strokeStyle = colorChangerRef.current?.value ?? "black";
              setIsEraser(false);
            } else {
              ctx.lineWidth = 50;
              ctx.strokeStyle = backgroundColor;
              setIsEraser(true);
            }
          }}
        >
          {isEraser ? "PEN" : "ERASER"}
        </button>
      </div>
    </main>
  );
}

function resetCanvas(ctx: CanvasRenderingContext2D | null | undefined, backgroundColor: string) {
  if (ctx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.lineWidth = 2;
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fill();
  }
}

export function degToRad(value: number) {
  return (value * Math.PI) / 180;
}
