import { useState } from "react";

export default function useCanvasCtx(
  ctx: CanvasRenderingContext2D | null | undefined,
  backgroundColor: string = "black"
) {
  const [previousStates, setPreviousStates] = useState<ImageData[]>([]);
  const [nextStates, setNextStates] = useState<ImageData[]>([]);

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

  return {
    getCurrentState,
    saveState,
    resetCanvas,
    undoCanvasState,
    redoCanvasState,
    previousStates,
    nextStates,
    backgroundColor,
  };
}
