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
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
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

  const finishDrawing = (x: number, y: number) => {
    if (shouldDraw && ctx) {
      x = x - ctx.canvas.offsetLeft;
      y = y - ctx.canvas.offsetTop;
      if (ctxUtils.isEraser) {
        if (x - startCoords.x === 0 && y - startCoords.y === 0) {
          ctxUtils.drawDot(startCoords);
        }
      } else {
        switch (ctxUtils.currentShape) {
          case "free": {
            if (x - startCoords.x === 0 && y - startCoords.y === 0) {
              ctxUtils.drawDot(startCoords);
            }
            break;
          }
          case "line": {
            ctxUtils.drawLine(startCoords, { x, y });
            break;
          }
          case "rect": {
            ctxUtils.drawRect(startCoords, { x, y });
            break;
          }
          case "circle": {
            ctxUtils.drawCircle(startCoords, { x, y });
            break;
          }
          case "ellipse": {
            ctxUtils.drawEllipse(startCoords, { x, y });
            break;
          }
          case "fill": {
            ctx.fillStyle = ctx.strokeStyle;
            ctxUtils.fill(x, y);
            break;
          }
          default: {
            console.error("SOMETHING UNEXPECTED HAPPENED");
            break;
          }
        }
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
        if (ctxUtils.currentShape === "free" || ctxUtils.isEraser) {
          ctx.lineJoin = "bevel";
          ctx.lineTo(x, y);
          ctx.stroke();
        }
      } else {
        ctx.moveTo(x, y);
        ctx.beginPath();
      }
    }
  };

  const startDrawing = (x: number, y: number) => {
    if (ctx) {
      x = x - ctx.canvas.offsetLeft;
      y = y - ctx.canvas.offsetTop;
      setStartCoords({ x, y });
      ctxUtils.saveState();
      setShouldDraw(true);
    }
  };

  return (
    <canvas
      className="drawing-canvas"
      height={500}
      width={500}
      ref={canvasRef}
      onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
      onMouseDown={(e) => startDrawing(e.clientX, e.clientY)}
      onMouseUp={(e) => finishDrawing(e.clientX, e.clientY)}
      onMouseOut={(e) => finishDrawing(e.clientX, e.clientY)}
      onTouchStart={(e) => {
        const touch = e.changedTouches[0];
        startDrawing(touch.clientX, touch.clientY);
      }}
      onTouchMove={(e) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        handleMove(touch.clientX, touch.clientY);
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        finishDrawing(touch.clientX, touch.clientY);
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
      <input
        type="range"
        onChange={(e) => {
          if (ctx) {
            ctx.lineWidth = parseInt(e.target.value);
          }
        }}
        defaultValue={1}
      />
      <select
        onChange={(e) => {
          const changeShapeTo = e.target.value as typeof ctxUtils.currentShape;
          ctxUtils.setCurrentShape(changeShapeTo);
        }}
      >
        <option defaultChecked value="free">
          Free
        </option>
        <option value="line">Line</option>
        <option value="rect">Rectangle</option>
        <option value="circle">Circle</option>
        <option value="ellipse">Elipse</option>
        <option value="fill">Fill</option>
      </select>
      <button
        onClick={() => {
          if (!ctx) {
            return;
          } else if (ctxUtils.isEraser) {
            ctx.strokeStyle = colorChangerRef.current?.value ?? "black";
            ctxUtils.setIsEraser(false);
          } else {
            ctx.strokeStyle = ctxUtils.backgroundColor;
            ctxUtils.setIsEraser(true);
          }
        }}
      >
        {ctxUtils.isEraser ? "PEN" : "ERASER"}
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
