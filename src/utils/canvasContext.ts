import { useState } from "react";

type Coord = { x: number; y: number };

export default function useCanvasCtx(
  ctx: CanvasRenderingContext2D | null | undefined,
  backgroundColor: string = "black"
) {
  const [previousStates, setPreviousStates] = useState<ImageData[]>([]);
  const [nextStates, setNextStates] = useState<ImageData[]>([]);
  const [currentShape, setCurrentShape] = useState<
    "line" | "rect" | "circle" | "ellipse" | "fill" | "free"
  >("free");

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

  const drawCircle = (startCoords: Coord, endCoords: Coord) => {
    if (ctx) {
      ctx.lineJoin = "round";
      const midPoint = calculateMidPoint(startCoords, endCoords);
      const r = distanceBetweenPoints(startCoords, midPoint);
      ctx.arc(midPoint.x, midPoint.y, r, 0, 360);
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

  const drawEllipse = (startCoords: Coord, endCoords: Coord) => {
    if (ctx) {
      ctx.lineJoin = "round";
      const midPoint = calculateMidPoint(startCoords, endCoords);
      ctx.ellipse(
        midPoint.x,
        midPoint.y,
        Math.abs(startCoords.x - midPoint.x),
        Math.abs(startCoords.y - midPoint.y),
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
    const origin_color = [
      canvasImageData[origin_px],
      canvasImageData[origin_px + 1],
      canvasImageData[origin_px + 2],
    ];
    const queue: { x: number; y: number }[] = [];

    const enqueNeighbours = (x: number, y: number) => {
      const neighbors = [
        { x: x - 1, y: y }, // Left
        { x: x + 1, y: y }, // Right
        { x: x, y: y - 1 }, // Top
        { x: x, y: y + 1 }, // Bottom
      ];

      neighbors.forEach((neighbor) => {
        const { x, y } = neighbor;
        if (x >= 0 && x < ctx.canvas.width && y >= 0 && y < ctx.canvas.height) {
          queue.push({ x, y });
        }
      });
    };

    queue.push({ x, y });
    const fillColor = hexToRGBA(ctx.fillStyle as string);

    while (queue.length > 0) {
      const { x: i, y: j } = queue.pop() as { x: number; y: number };
      const current_px = (j * ctx.canvas.width + i) * 4;
      const current_color = [
        canvasImageData[current_px],
        canvasImageData[current_px + 1],
        canvasImageData[current_px + 2],
      ];

      if (
        colorMatch(origin_color, current_color) &&
        !colorMatch(current_color, [fillColor.r, fillColor.g, fillColor.b])
      ) {
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

  const drawLine = (start: Coord, end: Coord) => {
    if (!ctx) return;
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  };

  const drawDot = ({ x, y }: Coord) => {
    if (!ctx) return;
    const r = Math.round(ctx.lineWidth / 2);
    ctx.arc(x, y, r, 0, 360);
    ctx.fill();
  };

  return {
    drawDot,
    drawLine,
    drawCircle,
    drawRect,
    drawEllipse,
    fill,
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
  };
}

export function distanceBetweenPoints(start: Coord, end: Coord) {
  const x = (start.x - end.x) ** 2;
  const y = (start.y - end.y) ** 2;
  return Math.sqrt(x + y);
}

function calculateMidPoint(start: Coord, end: Coord) {
  const x = (end.x + start.x) / 2;
  const y = (end.y + start.y) / 2;
  return { x, y };
}

function hexToRGBA(hex: string) {
  const bigint = parseInt(hex.replace("#", ""), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b, a: 255 };
}

function colorMatch(color1: number[], color2: number[]) {
  const tolerance = 2;
  const dr = Math.abs(color1[0] - color2[0]);
  const dg = Math.abs(color1[1] - color2[1]);
  const db = Math.abs(color1[2] - color2[2]);
  return dr <= tolerance && dg <= tolerance && db <= tolerance;
}
