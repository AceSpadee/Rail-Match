import { useEffect, useRef } from "react";
import { GAME_HEIGHT, GAME_WIDTH } from "./constants";
import { drawScene } from "./draw";
import { getClickedSwitchId } from "./gameLogic";

export default function RailMatchCanvas({
  gameState,
  fxState,
  onToggleSwitch,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    drawScene(ctx, gameState, fxState);
  }, [gameState, fxState]);

  function handlePointerDown(event) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.focus();

    const rect = canvas.getBoundingClientRect();
    const scaleX = GAME_WIDTH / rect.width;
    const scaleY = GAME_HEIGHT / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    const clickedSwitchId = getClickedSwitchId(gameState.boardId, x, y);

    if (clickedSwitchId) {
      onToggleSwitch(clickedSwitchId);
    }
  }

  return (
    <canvas
      ref={canvasRef}
      width={GAME_WIDTH}
      height={GAME_HEIGHT}
      tabIndex={0}
      onPointerDown={handlePointerDown}
      style={{
        width: "100%",
        maxWidth: "1120px",
        aspectRatio: `${GAME_WIDTH} / ${GAME_HEIGHT}`,
        display: "block",
        borderRadius: "18px",
        border: "4px solid #1f2937",
        boxShadow: "0 14px 28px rgba(0, 0, 0, 0.18)",
        cursor: "pointer",
        background: "#d8d8d8",
        outline: "none",
      }}
    />
  );
}