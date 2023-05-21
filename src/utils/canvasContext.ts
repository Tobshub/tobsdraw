import { useState } from "react";

type Coord = { x: number; y: number };

export default function useCanvasCtx(
  ctx: CanvasRenderingContext2D | null | undefined,
  backgroundColor: string = "black"
) {
  const [previousStates, setPreviousStates] = useState<ImageData[]>([]);
  const [nextStates, setNextStates] = useState<ImageData[]>([]);
  const [currentShape, setCurrentShape] = useState<
    "line" | "rect" | "circle" | "ellipse" | "fill"
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

  const drawEllipse = (startCoords: Coord, centerCoords: Coord) => {
    if (ctx) {
      ctx.lineJoin = "round";
      ctx.ellipse(
        centerCoords.x,
        centerCoords.y,
        Math.abs(startCoords.x - centerCoords.x),
        Math.abs(startCoords.y - centerCoords.y),
        0,
        0,
        360
      );
      ctx.stroke();
    }
  };

  const fill = (x: number, y: number) => {
    if (!ctx) return;

    const canvasImageData = getCurrentState()!.data;
    const origin_px = (y * ctx.canvas.width + x) * 4;
    const origin_color = canvasImageData.slice(origin_px, origin_px + 4);
    const queue: { x: number; y: number }[] = [];

    const enqueNeighbours = (x: number, y: number) => {
      const neighbors = [
        { x: x - 1, y: y }, // Left
        { x: x + 1, y: y }, // Right
        { x: x, y: y - 1 }, // Top
        { x: x, y: y + 1 }, // Bottom
      ];

      for (const neighbor of neighbors) {
        const { x, y } = neighbor;
        if (x >= 0 && x < ctx.canvas.width && y >= 0 && y < ctx.canvas.height) {
          queue.push({ x, y });
        }
      }
    };

    queue.push({ x, y });
    const fillColor = hexToRGBA(ctx.fillStyle as string);

    while (queue.length > 0) {
      const { x: i, y: j } = queue.pop() as { x: number; y: number };
      const current_px = (j * ctx.canvas.width + i) * 4;
      let current_color = canvasImageData.slice(current_px, current_px + 4);

      if (colorMatch(origin_color, current_color)) {
        const fillColor = hexToRGBA(ctx.fillStyle as string);
        canvasImageData[current_px] = fillColor.r;
        canvasImageData[current_px + 1] = fillColor.g;
        canvasImageData[current_px + 2] = fillColor.b;
        enqueNeighbours(i, j);
      } else {
        continue;
      }
    }

    const imageData = new ImageData(
      canvasImageData,
      ctx.canvas.width,
      ctx.canvas.height
    );
    ctx.putImageData(imageData, 0, 0);
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
    drawEllipse,
    fill
  };
}

export function distanceBetweenPoints(start: Coord, end: Coord) {
  const x = (start.x - end.x) ** 2;
  const y = (start.y - end.y) ** 2;
  return Math.sqrt(x + y);
}

function hexToRGBA(hex: string) {
  const bigint = parseInt(hex.replace("#", ""), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b, a: 255 };
}

function colorMatch(color1: Uint8ClampedArray, color2: Uint8ClampedArray) {
  const tolerance = 2;
  const dr = Math.abs(color1[0] - color2[0]);
  const dg = Math.abs(color1[1] - color2[1]);
  const db = Math.abs(color1[2] - color2[2]);
  return dr <= tolerance && dg <= tolerance && db <= tolerance;
}
