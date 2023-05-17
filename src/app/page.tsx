"use client";
import { useRef, MouseEvent, useState, useEffect } from "react";
import styles from "./page.module.css";

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ctx, setCanvasCtx] = useState(canvasRef.current?.getContext("2d", { willReadFrequently: true }));
  const [shouldDraw, setShouldDraw] = useState(false);
  const controlsContainerRef = useRef<HTMLDivElement>(null);
  const [isEraser, setIsEraser] = useState(false);
  const colorChangerRef = useRef<HTMLInputElement>(null);
  const backgroundColor = "white";
  const [previousStates, setPreviousStates] = useState<ImageData[]>([]);
  const [nextStates, setNextStates] = useState<ImageData[]>([]);

  const getCurrentState = () => {
    if (ctx) {
      return ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
  };

  const saveState = () => {
    if (ctx) {
      const lastCanvasState = getCurrentState() as ImageData;
      setPreviousStates((state) => [...state, lastCanvasState]);
      setNextStates([]);
    }
  };

  const clearCanvas = () => {
    saveState();
    resetCanvas(ctx, backgroundColor);
  };

  const stopDrawing = () => {
    if (shouldDraw && ctx) {
      setShouldDraw(false);
    }
  };

  const revertCanvasState = () => {
    if (previousStates.length && ctx) {
      const currentState = getCurrentState() as ImageData;
      ctx.putImageData(previousStates.pop() as ImageData, 0, 0);
      setNextStates((state) => [...state, currentState]);
    }
  };

  const returnCanvasState = () => {
    if (nextStates.length && ctx) {
      const currentState = getCurrentState() as ImageData;
      ctx.putImageData(nextStates.pop() as ImageData, 0, 0);
      setPreviousStates((state) => [...state, currentState]);
    }
  };

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        resetCanvas(ctx, backgroundColor);
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
      <div className={styles.controls} ref={controlsContainerRef} style={{ opacity: shouldDraw ? "35%" : "80%" }}>
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
        <button onClick={revertCanvasState} disabled={!previousStates.length}>
          UNDO
        </button>
        <button onClick={returnCanvasState} disabled={!nextStates.length}>
          REDO
        </button>
      </div>
      <canvas
        height={500}
        width={500}
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseDown={() => {
          saveState();
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

function resetCanvas(ctx: CanvasRenderingContext2D | null | undefined, backgroundColor: string) {
  if (ctx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.lineWidth = 1;
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fill();
  }
}

export function degToRad(value: number) {
  return (value * Math.PI) / 180;
}
