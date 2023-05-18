import { useState } from "react";

type Coord = { x: number; y: number };

export default function useCanvasCtx(
  ctx: CanvasRenderingContext2D | null | undefined,
  backgroundColor: string = "black"
) {
  const [previousStates, setPreviousStates] = useState<ImageData[]>([]);
  const [nextStates, setNextStates] = useState<ImageData[]>([]);
  const [currentShape, setCurrentShape] = useState<
    "line" | "rect" | "circle" | "ellipse"
  >("line");

  const resetCanvas = () => {
    if (ctx) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      const prevFillStyle = ctx.fillStyle;
      ctx.fillStyle = backgroundColor ?? "white";
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.fill();
      ctx.fillStyle = prevFillStyle;
    }
  };

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

  const undoCanvasState = () => {
    if (previousStates.length && ctx) {
      const currentState = getCurrentState() as ImageData;
      ctx.putImageData(previousStates.pop() as ImageData, 0, 0);
      setNextStates((state) => [...state, currentState]);
    }
  };

  const redoCanvasState = () => {
    if (nextStates.length && ctx) {
      const currentState = getCurrentState() as ImageData;
      ctx.putImageData(nextStates.pop() as ImageData, 0, 0);
      setPreviousStates((state) => [...state, currentState]);
    }
  };

  const drawCircle = (startCoords: Coord, centerCoords: Coord) => {
    if (ctx) {
      ctx.lineJoin = "round";
      const radius = distanceBetweenPoints(startCoords, centerCoords);
      ctx.arc(centerCoords.x, centerCoords.y, radius, 0, 360);
      ctx.stroke();
    }
  };

  const drawRect = (startCoords: Coord, endCoords: Coord) => {
    if (ctx) {
      ctx.lineJoin = "miter";
      ctx.strokeRect(
        startCoords.x,
        startCoords.y,
        endCoords.x - startCoords.x,
        endCoords.y - startCoords.y
      );
    }
  };

  return {
    getCurrentState,
    saveState,
    resetCanvas,
    undoCanvasState,
    redoCanvasState,
    previousStates,
    nextStates,
    backgroundColor,
    currentShape,
    setCurrentShape: (value: typeof currentShape) => setCurrentShape(value),
    drawCircle,
    drawRect,
  };
}

export function distanceBetweenPoints(start: Coord, end: Coord) {
  const x = (start.x - end.x) ** 2;
  const y = (start.y - end.y) ** 2;
  return Math.sqrt(x + y);
}
