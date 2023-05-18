"use client";
import {
  useRef,
  useState,
  useEffect,
  RefObject,
  Dispatch,
  SetStateAction,
} from "react";
import styles from "./page.module.css";
import useCanvasCtx from "@/utils/canvasContext";

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ctx, setCanvasCtx] = useState(
    canvasRef.current?.getContext("2d", { willReadFrequently: true })
  );
  const [shouldDraw, setShouldDraw] = useState(false);
  const ctxUtils = useCanvasCtx(ctx, "white");

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        if (window) {
          ctx.canvas.width = window.innerWidth;
          ctx.canvas.height = window.innerHeight;
        }
        ctxUtils.resetCanvas();
        ctx.beginPath();
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
      }
      setCanvasCtx(ctx);
    }
  }, [canvasRef.current]);

  return (
    <main className={styles.main}>
      <ControlPanel ctx={ctx} ctxUtils={ctxUtils} shouldDraw={shouldDraw} />
      <DrawingCanvas
        ctx={ctx}
        ctxUtils={ctxUtils}
        shouldDraw={shouldDraw}
        setShouldDraw={setShouldDraw}
        canvasRef={canvasRef}
      />
    </main>
  );
}

interface DrawingCanvasProps {
  ctx: CanvasRenderingContext2D | null | undefined;
  shouldDraw: boolean;
  setShouldDraw: Dispatch<SetStateAction<boolean>>;
  ctxUtils: ReturnType<typeof useCanvasCtx>;
  canvasRef: RefObject<HTMLCanvasElement>;
}

function DrawingCanvas({
  ctx,
  shouldDraw,
  setShouldDraw,
  ctxUtils,
  canvasRef,
}: DrawingCanvasProps) {
  const [startCoords, setStartCoords] = useState({ x: 0, y: 0 });
  const stopDrawing = (x: number, y: number) => {
    if (shouldDraw && ctx) {
      if (x - startCoords.x === 0 && y - startCoords.y === 0) {
        x = x - ctx.canvas.offsetLeft;
        y = y - ctx.canvas.offsetTop;
        ctx.arc(x, y, ctx.lineWidth, 0, 360);
        ctx.fill();
      }
      setShouldDraw(false);
      ctx.beginPath();
    }
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (ctx && canvasRef.current) {
      const x = clientX - canvasRef.current.offsetLeft;
      const y = clientY - canvasRef.current.offsetTop;
      if (shouldDraw) {
        ctx.lineTo(x, y);
        ctx.stroke();
      } else {
        ctx.moveTo(x, y);
        ctx.beginPath();
      }
    }
  };

  const handleStart = (x: number, y: number) => {
    setStartCoords({ x, y });
    ctxUtils.saveState();
    setShouldDraw(true);
  };

  return (
    <canvas
      height={500}
      width={500}
      ref={canvasRef}
      onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
      onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
      onMouseUp={(e) => stopDrawing(e.clientX, e.clientY)}
      onMouseOut={(e) => stopDrawing(e.clientX, e.clientY)}
      onTouchStart={(e) => {
        const touch = e.changedTouches[0];
        handleStart(touch.clientX, touch.clientY);
      }}
      onTouchMove={(e) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        handleMove(touch.clientX, touch.clientY);
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        stopDrawing(touch.clientX, touch.clientY);
      }}
    >
      <p>Your browser does not support this.</p>
    </canvas>
  );
}

interface ControlPanelProps {
  ctx: CanvasRenderingContext2D | null | undefined;
  ctxUtils: ReturnType<typeof useCanvasCtx>;
  shouldDraw: boolean;
}

function ControlPanel({ ctx, ctxUtils, shouldDraw }: ControlPanelProps) {
  const colorChangerRef = useRef<HTMLInputElement>(null);
  const [isEraser, setIsEraser] = useState(false);

  const clearCanvas = () => {
    ctxUtils.saveState();
    ctxUtils.resetCanvas();
  };

  return (
    <div
      className={styles.controls}
      style={{ opacity: shouldDraw ? "35%" : "80%" }}
    >
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
      <select
        onChange={(e) => {
          if (ctx) {
            ctx.lineWidth = parseInt(e.target.value);
          }
        }}
      >
        <option value={1} defaultChecked>
          1px
        </option>
        <option value={2}>2px</option>
        <option value={4}>4px</option>
        <option value={8}>8px</option>
        <option value={16}>16px</option>
        <option value={32}>32px</option>
      </select>
      <button
        onClick={() => {
          if (!ctx) {
            return;
          } else if (isEraser) {
            ctx.strokeStyle = colorChangerRef.current?.value ?? "black";
            setIsEraser(false);
          } else {
            ctx.strokeStyle = ctxUtils.backgroundColor;
            setIsEraser(true);
          }
        }}
      >
        {isEraser ? "PEN" : "ERASER"}
      </button>
      <button
        onClick={ctxUtils.undoCanvasState}
        disabled={!ctxUtils.previousStates.length}
      >
        UNDO
      </button>
      <button
        onClick={ctxUtils.redoCanvasState}
        disabled={!ctxUtils.nextStates.length}
      >
        REDO
      </button>
    </div>
  );
}
