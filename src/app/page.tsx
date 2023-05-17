"use client";
import { useRef, MouseEvent, useState, useEffect } from "react";
import styles from "./page.module.css";
import useCanvasCtx from "@/utils/canvasContext";

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ctx, setCanvasCtx] = useState(canvasRef.current?.getContext("2d", { willReadFrequently: true }));
  const [shouldDraw, setShouldDraw] = useState(false);
  const [isEraser, setIsEraser] = useState(false);
  const colorChangerRef = useRef<HTMLInputElement>(null);
  const backgroundColor = "white";
  const ctxUtils = useCanvasCtx(ctx, backgroundColor);

  const clearCanvas = () => {
    ctxUtils.saveState();
    ctxUtils.resetCanvas();
  };

  const stopDrawing = () => {
    if (shouldDraw && ctx) {
      setShouldDraw(false);
    }
  };

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctxUtils.resetCanvas();
        ctx.beginPath();
        ctx.lineJoin = "round";
        ctx.fillStyle = colorChangerRef.current?.value ?? "black";
      }
      setCanvasCtx(ctx);
    }
  }, [canvasRef.current]);

  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    if (ctx) {
      const x = e.clientX - e.currentTarget.offsetLeft;
      const y = e.clientY - e.currentTarget.offsetTop;
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
      <div className={styles.controls} style={{ opacity: shouldDraw ? "35%" : "80%" }}>
        <button onClick={clearCanvas}>CLEAR</button>
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
        <button onClick={ctxUtils.undoCanvasState} disabled={!ctxUtils.previousStates.length}>
          UNDO
        </button>
        <button onClick={ctxUtils.redoCanvasState} disabled={!ctxUtils.nextStates.length}>
          REDO
        </button>
      </div>
      <canvas
        height={500}
        width={500}
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseDown={() => {
          ctxUtils.saveState();
          setShouldDraw(true);
        }}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
      >
        <p>Your browser does not support this.</p>
      </canvas>
    </main>
  );
}

export function degToRad(value: number) {
  return (value * Math.PI) / 180;
}
