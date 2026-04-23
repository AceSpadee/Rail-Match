import { useEffect, useMemo, useRef, useState } from "react";
import {
  COLORS,
  FX_DURATIONS,
  GAME_TITLE,
  MAX_DELTA_TIME,
} from "./constants";
import { LEVELS } from "./levels";
import {
  createInitialGameState,
  toggleSwitch,
  updateGameState,
} from "./gameLogic";
import RailMatchCanvas from "./RailMatchCanvas";
import {
  loadSelectedLevelIndex,
  loadUnlockedLevelIndex,
  resetProgress,
  saveSelectedLevelIndex,
  saveUnlockedLevelIndex,
} from "./storage";

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

function levelButtonStyle(isSelected, isLocked) {
  return {
    border: "3px solid #1f2937",
    background: isLocked ? "#e5e7eb" : isSelected ? "#bfdbfe" : "#ffffff",
    color: isLocked ? "#6b7280" : "#111827",
    opacity: isLocked ? 0.7 : 1,
    borderRadius: "12px",
    padding: "10px 12px",
    fontWeight: 900,
    cursor: isLocked ? "not-allowed" : "pointer",
  };
}

function infoCardStyle() {
  return {
    background: COLORS.panel,
    border: `4px solid ${COLORS.panelBorder}`,
    borderRadius: "16px",
    padding: "14px",
    color: COLORS.text,
  };
}

function switchCardStyle() {
  return {
    background: COLORS.panel,
    border: `4px solid ${COLORS.panelBorder}`,
    borderRadius: "16px",
    padding: "14px",
    color: COLORS.text,
  };
}

function formatSwitchLabel(switchId) {
  if (switchId === "s1") return "Switch 1";
  if (switchId === "s2") return "Switch 2";
  if (switchId === "s3") return "Switch 3";

  return switchId
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase());
}

function formatSwitchState(state) {
  return state === "left" ? "Left" : "Right";
}

function formatSwitchControls(switchId) {
  if (switchId === "s1") return "Click switch or press 1 / A / Left";
  if (switchId === "s2") return "Click switch or press 2 / S / Up";
  if (switchId === "s3") return "Click switch or press 3 / D / Right";
  return "Click switch to toggle";
}

function getOrderedSwitchIds(switches) {
  const ids = Object.keys(switches || {});
  const order = ["s1", "s2", "s3"];

  return ids.sort((a, b) => {
    const aIndex = order.indexOf(a);
    const bIndex = order.indexOf(b);

    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.localeCompare(b);
  });
}

export default function RailMatchGame() {
  const maxLevelIndex = LEVELS.length - 1;

  const [unlockedLevelIndex, setUnlockedLevelIndex] = useState(() =>
    loadUnlockedLevelIndex(maxLevelIndex)
  );

  const [levelIndex, setLevelIndex] = useState(() => {
    const unlocked = loadUnlockedLevelIndex(maxLevelIndex);
    return loadSelectedLevelIndex(maxLevelIndex, unlocked);
  });

  const [gameState, setGameState] = useState(() =>
    createInitialGameState(LEVELS[levelIndex])
  );
  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [fxState, setFxState] = useState({
    currentTime: 0,
    switchFlashUntil: 0,
    failFlashUntil: 0,
    housePulseUntil: { red: 0, blue: 0, gray: 0, green: 0 },
  });

  const COUNTDOWN_SECONDS = 3;
  const [isCountingDown, setIsCountingDown] = useState(true);
  const [countdownValue, setCountdownValue] = useState(COUNTDOWN_SECONDS);

  const currentLevel = LEVELS[levelIndex];
  const lastFrameTimeRef = useRef(null);
  const previousStatusRef = useRef(gameState.status);

  function resetFx() {
    setFxState({
      currentTime: 0,
      switchFlashUntil: 0,
      failFlashUntil: 0,
      housePulseUntil: { red: 0, blue: 0, gray: 0, green: 0 },
    });
  }

  function beginCountdown(level, seconds = COUNTDOWN_SECONDS) {
    lastFrameTimeRef.current = null;
    previousStatusRef.current = "playing";
    setIsPaused(false);
    setIsCountingDown(true);
    setCountdownValue(seconds);
    setGameState(createInitialGameState(level));
    resetFx();
  }

  function loadLevel(nextIndex, seconds = COUNTDOWN_SECONDS) {
    const clampedIndex = Math.max(0, Math.min(maxLevelIndex, nextIndex));
    const nextLevel = LEVELS[clampedIndex];

    setLevelIndex(clampedIndex);
    beginCountdown(nextLevel, seconds);
  }

  function applySwitchToggle(switchId) {
    setGameState((prev) => toggleSwitch(prev, switchId));
  }

  useEffect(() => {
    if (!isCountingDown) return undefined;

    const timeoutId = window.setTimeout(() => {
      setCountdownValue((prev) => {
        if (prev <= 1) {
          setIsCountingDown(false);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isCountingDown, countdownValue]);

  useEffect(() => {
    if (gameState.status !== "playing" || isPaused || isCountingDown) {
      lastFrameTimeRef.current = null;
      return undefined;
    }

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
      setCurrentTime(timestamp);

      setGameState((prev) => updateGameState(prev, currentLevel, deltaSeconds));
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [gameState.status, isPaused, isCountingDown, currentLevel]);

  useEffect(() => {
    if (!gameState.recentEvents.length) return;

    const now = performance.now();

    setFxState((prev) => {
      const next = {
        ...prev,
        housePulseUntil: { ...prev.housePulseUntil },
      };

      for (const event of gameState.recentEvents) {
        if (event.type === "switch-toggled") {
          next.switchFlashUntil = now + FX_DURATIONS.switchFlash;
        }

        if (event.type === "train-delivered") {
          next.housePulseUntil[event.color] = now + FX_DURATIONS.housePulse;
        }

        if (event.type === "train-failed") {
          next.failFlashUntil = now + FX_DURATIONS.failFlash;
        }
      }

      return next;
    });
  }, [gameState.recentEvents]);

  useEffect(() => {
    setFxState((prev) => ({
      ...prev,
      currentTime,
    }));
  }, [currentTime]);

  useEffect(() => {
    const justWon =
      previousStatusRef.current !== "won" && gameState.status === "won";

    if (justWon) {
      const nextUnlocked = Math.min(maxLevelIndex, levelIndex + 1);

      if (nextUnlocked > unlockedLevelIndex) {
        setUnlockedLevelIndex(nextUnlocked);
        saveUnlockedLevelIndex(nextUnlocked);
      }
    }

    previousStatusRef.current = gameState.status;
  }, [gameState.status, levelIndex, unlockedLevelIndex, maxLevelIndex]);

  useEffect(() => {
    saveSelectedLevelIndex(levelIndex);
  }, [levelIndex]);

  useEffect(() => {
    function handleBlurPause() {
      setIsPaused((prev) =>
        gameState.status === "playing" && !isCountingDown ? true : prev
      );
    }

    function handleVisibilityChange() {
      if (document.hidden && gameState.status === "playing" && !isCountingDown) {
        setIsPaused(true);
      }
    }

    window.addEventListener("blur", handleBlurPause);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("blur", handleBlurPause);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [gameState.status, isCountingDown]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.code === "KeyP") {
        event.preventDefault();
        setIsPaused((prev) =>
          gameState.status === "playing" && !isCountingDown ? !prev : prev
        );
        return;
      }

      if (gameState.status !== "playing" || isPaused || isCountingDown) return;

      const switchIds = getOrderedSwitchIds(gameState.switches);
      const [firstSwitchId, secondSwitchId, thirdSwitchId] = switchIds;

      if (
        (event.code === "Digit1" || event.code === "KeyA" || event.code === "ArrowLeft") &&
        firstSwitchId
      ) {
        event.preventDefault();
        applySwitchToggle(firstSwitchId);
        return;
      }

      if (
        (event.code === "Digit2" || event.code === "KeyS" || event.code === "ArrowUp") &&
        secondSwitchId
      ) {
        event.preventDefault();
        applySwitchToggle(secondSwitchId);
        return;
      }

      if (
        (event.code === "Digit3" || event.code === "KeyD" || event.code === "ArrowRight") &&
        thirdSwitchId
      ) {
        event.preventDefault();
        applySwitchToggle(thirdSwitchId);
        return;
      }

      if (event.code === "Space" && firstSwitchId && !secondSwitchId) {
        event.preventDefault();
        applySwitchToggle(firstSwitchId);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [gameState.status, isPaused, isCountingDown, gameState.switches]);

  useEffect(() => {
    beginCountdown(LEVELS[levelIndex]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const remaining = Math.max(
      0,
      gameState.totalCount - gameState.deliveredCount
    );

    const switchSummary = getOrderedSwitchIds(gameState.switches).map((switchId) => ({
      id: switchId,
      label: formatSwitchLabel(switchId),
      state: formatSwitchState(gameState.switches[switchId]),
      controls: formatSwitchControls(switchId),
    }));

    return {
      remaining,
      total: gameState.totalCount,
      switchSummary,
    };
  }, [gameState]);

  function restartLevel() {
    beginCountdown(currentLevel);
  }

  function goToNextLevel() {
    if (levelIndex >= maxLevelIndex) {
      loadLevel(0);
      return;
    }

    loadLevel(levelIndex + 1);
  }

  function handleToggleSwitch(switchId) {
    if (gameState.status !== "playing" || isPaused || isCountingDown) return;
    applySwitchToggle(switchId);
  }

  function handleSelectLevel(index) {
    if (index > unlockedLevelIndex) return;
    loadLevel(index);
  }

  function handleResetProgress() {
    resetProgress();
    setUnlockedLevelIndex(0);
    loadLevel(0);
  }

  const isLastLevel = levelIndex === maxLevelIndex;
  const overlayState = isCountingDown
    ? "countdown"
    : isPaused && gameState.status === "playing"
      ? "paused"
      : gameState.status !== "playing"
        ? gameState.status
        : null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: COLORS.backgroundDark,
        padding: "28px 16px 40px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
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
            boxShadow: `0 16px 32px ${COLORS.shadow}`,
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
                {currentLevel.name} · {currentLevel.difficultyLabel}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              {gameState.status === "playing" && !isCountingDown && (
                <button
                  type="button"
                  onClick={() => setIsPaused((prev) => !prev)}
                  style={buttonStyle(isPaused ? "#c7d2fe" : "#e0e7ff")}
                >
                  {isPaused ? "Resume" : "Pause"}
                </button>
              )}

              <button
                type="button"
                onClick={restartLevel}
                style={buttonStyle("#fef3c7")}
              >
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

        <div style={infoCardStyle()}>
          <div
            style={{
              fontWeight: 900,
              marginBottom: "6px",
            }}
          >
            Objective
          </div>

          <div
            style={{
              color: COLORS.mutedText,
              fontWeight: 700,
              lineHeight: 1.5,
            }}
          >
            {currentLevel.tutorialText}
          </div>

          <div
            style={{
              marginTop: "8px",
              color: COLORS.mutedText,
              fontWeight: 700,
              lineHeight: 1.5,
            }}
          >
            Set the route before the train reaches each junction. Follow the
            network ahead and keep the switches ready for the destination you need.
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "12px",
          }}
        >
          {stats.switchSummary.map((switchItem) => (
            <div key={switchItem.id} style={switchCardStyle()}>
              <div
                style={{
                  fontWeight: 900,
                  marginBottom: "8px",
                }}
              >
                {switchItem.label}
              </div>

              <div
                style={{
                  fontWeight: 800,
                  color: COLORS.text,
                  marginBottom: "6px",
                }}
              >
                Current Route: {switchItem.state}
              </div>

              <div
                style={{
                  color: COLORS.mutedText,
                  fontWeight: 700,
                  lineHeight: 1.45,
                  fontSize: "0.95rem",
                }}
              >
                {switchItem.controls}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            background: COLORS.panel,
            border: `4px solid ${COLORS.panelBorder}`,
            borderRadius: "16px",
            padding: "14px",
          }}
        >
          <div
            style={{
              fontWeight: 900,
              color: COLORS.text,
              marginBottom: "12px",
            }}
          >
            Level Select
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(92px, 1fr))",
              gap: "10px",
            }}
          >
            {LEVELS.map((level, index) => {
              const isLocked = index > unlockedLevelIndex;
              const isSelected = index === levelIndex;

              return (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => handleSelectLevel(index)}
                  disabled={isLocked}
                  style={levelButtonStyle(isSelected, isLocked)}
                >
                  {isLocked ? "Locked" : `L${index + 1}`}
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: "12px" }}>
            <button
              type="button"
              onClick={handleResetProgress}
              style={buttonStyle("#fee2e2")}
            >
              Reset Progress
            </button>
          </div>
        </div>

        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "1120px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "14px",
              right: "14px",
              zIndex: 2,
              background: "rgba(255, 255, 255, 0.94)",
              border: "3px solid #1f2937",
              borderRadius: "12px",
              padding: "10px 14px",
              boxShadow: "0 8px 18px rgba(0, 0, 0, 0.15)",
              fontWeight: 900,
              color: "#111827",
            }}
          >
            Remaining: {stats.remaining} / {stats.total}
          </div>

          <RailMatchCanvas
            gameState={gameState}
            fxState={fxState}
            onToggleSwitch={handleToggleSwitch}
          />

          {overlayState && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                borderRadius: "18px",
                background:
                  overlayState === "countdown"
                    ? "rgba(15, 23, 42, 0.20)"
                    : overlayState === "paused"
                      ? "rgba(99, 102, 241, 0.16)"
                      : overlayState === "won"
                        ? "rgba(22, 163, 74, 0.18)"
                        : "rgba(220, 38, 38, 0.18)",
              }}
            >
              <div
                style={{
                  minWidth: "280px",
                  maxWidth: "430px",
                  background: "#ffffff",
                  border: "4px solid #1f2937",
                  borderRadius: "18px",
                  padding: "20px",
                  textAlign: "center",
                  boxShadow: "0 16px 32px rgba(0, 0, 0, 0.2)",
                }}
              >
                {overlayState === "countdown" ? (
                  <>
                    <div
                      style={{
                        fontSize: "3.5rem",
                        fontWeight: 900,
                        color: COLORS.text,
                        lineHeight: 1,
                      }}
                    >
                      {countdownValue}
                    </div>

                    <div
                      style={{
                        marginTop: "10px",
                        color: COLORS.mutedText,
                        fontWeight: 700,
                        lineHeight: 1.45,
                      }}
                    >
                      Get ready. The train starts in a moment.
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        fontSize: "1.8rem",
                        fontWeight: 900,
                        color:
                          overlayState === "paused"
                            ? COLORS.paused
                            : overlayState === "won"
                              ? COLORS.success
                              : COLORS.danger,
                      }}
                    >
                      {overlayState === "paused"
                        ? "Paused"
                        : overlayState === "won"
                          ? isLastLevel
                            ? "All Clear!"
                            : "Level Complete!"
                          : "Wrong House!"}
                    </div>

                    <div
                      style={{
                        marginTop: "10px",
                        color: COLORS.mutedText,
                        fontWeight: 700,
                        lineHeight: 1.45,
                      }}
                    >
                      {overlayState === "paused"
                        ? "The game paused because you clicked away or pressed pause."
                        : overlayState === "won"
                          ? isLastLevel
                            ? "You cleared the full branching board set."
                            : "Every train reached the correct destination."
                          : "A train reached the wrong destination. Restart and try again."}
                    </div>

                    <div
                      style={{
                        marginTop: "16px",
                        display: "flex",
                        justifyContent: "center",
                        gap: "10px",
                        flexWrap: "wrap",
                      }}
                    >
                      {overlayState === "paused" && (
                        <button
                          type="button"
                          onClick={() => setIsPaused(false)}
                          style={buttonStyle("#c7d2fe")}
                        >
                          Resume
                        </button>
                      )}

                      {overlayState === "won" && (
                        <button
                          type="button"
                          onClick={goToNextLevel}
                          style={buttonStyle("#86efac")}
                        >
                          {isLastLevel ? "Play Again" : "Next Level"}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={restartLevel}
                        style={buttonStyle("#fef3c7")}
                      >
                        {overlayState === "paused" ? "Restart Level" : "Replay"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}