import { useEffect, useMemo, useRef, useState } from "react";
import {
  COLORS,
  GAME_TITLE,
  MAX_DELTA_TIME,
} from "./constants";
import { LEVELS } from "./levels";
import {
  createInitialGameState,
  toggleMainSwitch,
  updateGameState,
} from "./gameLogic";
import RailMatchCanvas from "./RailMatchCanvas";

function buttonStyle(background, color = "#111827") {
  return {
    border: "3px solid #1f2937",
    background,
    color,
    borderRadius: "12px",
    padding: "10px 14px",
    fontWeight: 800,
    fontSize: "0.95rem",
    cursor: "pointer",
    boxShadow: "0 6px 0 rgba(17, 24, 39, 0.18)",
  };
}

export default function RailMatchGame() {
  const [levelIndex, setLevelIndex] = useState(0);
  const currentLevel = LEVELS[levelIndex];

  const [gameState, setGameState] = useState(() =>
    createInitialGameState(currentLevel)
  );

  const lastFrameTimeRef = useRef(null);

  useEffect(() => {
    lastFrameTimeRef.current = null;
    setGameState(createInitialGameState(currentLevel));
  }, [levelIndex, currentLevel]);

  useEffect(() => {
    if (gameState.status !== "playing") return undefined;

    let frameId = 0;

    const tick = (timestamp) => {
      if (lastFrameTimeRef.current == null) {
        lastFrameTimeRef.current = timestamp;
      }

      const deltaSeconds = Math.min(
        (timestamp - lastFrameTimeRef.current) / 1000,
        MAX_DELTA_TIME
      );

      lastFrameTimeRef.current = timestamp;

      setGameState((prev) => updateGameState(prev, currentLevel, deltaSeconds));
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [gameState.status, currentLevel]);

  const stats = useMemo(() => {
    const remaining = Math.max(0, gameState.totalCount - gameState.deliveredCount);
    return {
      delivered: gameState.deliveredCount,
      remaining,
      total: gameState.totalCount,
      switchDirection: gameState.switches.main === "left" ? "Left" : "Right",
    };
  }, [gameState]);

  function restartLevel() {
    lastFrameTimeRef.current = null;
    setGameState(createInitialGameState(currentLevel));
  }

  function goToNextLevel() {
    if (levelIndex >= LEVELS.length - 1) {
      setLevelIndex(0);
      return;
    }

    setLevelIndex((prev) => prev + 1);
  }

  function handleToggleSwitch() {
    setGameState((prev) => toggleMainSwitch(prev));
  }

  const isLastLevel = levelIndex === LEVELS.length - 1;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#cfd2d7",
        padding: "28px 16px 40px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          display: "grid",
          gap: "16px",
        }}
      >
        <div
          style={{
            background: COLORS.panel,
            border: `4px solid ${COLORS.panelBorder}`,
            borderRadius: "20px",
            padding: "18px",
            boxShadow: "0 16px 32px rgba(0, 0, 0, 0.12)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "16px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "2rem",
                  fontWeight: 900,
                  color: COLORS.text,
                  lineHeight: 1,
                }}
              >
                {GAME_TITLE}
              </div>
              <div
                style={{
                  marginTop: "6px",
                  fontWeight: 700,
                  color: COLORS.mutedText,
                }}
              >
                {currentLevel.name}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <button type="button" onClick={restartLevel} style={buttonStyle("#fef3c7")}>
                Restart
              </button>

              {gameState.status === "won" && (
                <button
                  type="button"
                  onClick={goToNextLevel}
                  style={buttonStyle("#86efac")}
                >
                  {isLastLevel ? "Play Again" : "Next Level"}
                </button>
              )}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
            gap: "12px",
          }}
        >
          <div
            style={{
              background: COLORS.panel,
              border: `4px solid ${COLORS.panelBorder}`,
              borderRadius: "16px",
              padding: "14px",
              fontWeight: 800,
              color: COLORS.text,
            }}
          >
            Delivered: {stats.delivered} / {stats.total}
          </div>

          <div
            style={{
              background: COLORS.panel,
              border: `4px solid ${COLORS.panelBorder}`,
              borderRadius: "16px",
              padding: "14px",
              fontWeight: 800,
              color: COLORS.text,
            }}
          >
            Remaining: {stats.remaining}
          </div>

          <div
            style={{
              background: COLORS.panel,
              border: `4px solid ${COLORS.panelBorder}`,
              borderRadius: "16px",
              padding: "14px",
              fontWeight: 800,
              color: COLORS.text,
            }}
          >
            Switch: {stats.switchDirection}
          </div>
        </div>

        <div
          style={{
            position: "relative",
            width: "100%",
          }}
        >
          <RailMatchCanvas gameState={gameState} onToggleSwitch={handleToggleSwitch} />

          {gameState.status !== "playing" && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                borderRadius: "18px",
                background:
                  gameState.status === "won"
                    ? "rgba(22, 163, 74, 0.18)"
                    : "rgba(220, 38, 38, 0.18)",
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  minWidth: "280px",
                  maxWidth: "420px",
                  background: "#ffffff",
                  border: "4px solid #1f2937",
                  borderRadius: "18px",
                  padding: "20px",
                  textAlign: "center",
                  boxShadow: "0 16px 32px rgba(0, 0, 0, 0.2)",
                }}
              >
                <div
                  style={{
                    fontSize: "1.8rem",
                    fontWeight: 900,
                    color:
                      gameState.status === "won" ? COLORS.success : COLORS.danger,
                  }}
                >
                  {gameState.status === "won" ? "Level Complete!" : "Wrong House!"}
                </div>

                <div
                  style={{
                    marginTop: "10px",
                    color: COLORS.mutedText,
                    fontWeight: 700,
                    lineHeight: 1.4,
                  }}
                >
                  {gameState.status === "won"
                    ? "Every train reached the correct house."
                    : "A train reached the wrong destination. Restart and try again."}
                </div>
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            background: COLORS.panel,
            border: `4px solid ${COLORS.panelBorder}`,
            borderRadius: "16px",
            padding: "14px",
            color: COLORS.mutedText,
            fontWeight: 700,
            lineHeight: 1.5,
          }}
        >
          Click the switch when you need to change the active route. Red trains belong
          in the red house, and blue trains belong in the blue house.
        </div>
      </div>
    </div>
  );
}