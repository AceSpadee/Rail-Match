import {
  COLORS,
  FX_DURATIONS,
  GAME_WIDTH,
  GAME_HEIGHT,
  HOUSE_HEIGHT,
  HOUSE_WIDTH,
  RAIL_GAP,
  RAIL_WIDTH,
  SWITCH_RADIUS,
  TIE_HEIGHT,
  TIE_SPACING,
  TIE_WIDTH,
  TRAIN_HEIGHT,
  TRAIN_WIDTH,
} from "./constants";
import { BOARDS } from "./boards";

function roundedRectPath(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function getBoard(boardId) {
  const board = BOARDS[boardId];

  if (!board) {
    throw new Error(`Unknown boardId: ${boardId}`);
  }

  return board;
}

function getRemainingStrength(untilTime, currentTime, duration) {
  if (!untilTime || untilTime <= currentTime) return 0;
  return Math.max(0, Math.min(1, (untilTime - currentTime) / duration));
}

function getColorValue(colorKey) {
  const palette = {
    red: COLORS.red || "#ef4444",
    blue: COLORS.blue || "#3b82f6",
    green: COLORS.green || "#16a34a",
    gray: COLORS.gray || "#4b5563",
    yellow: COLORS.yellow || "#eab308",
    pink: COLORS.pink || "#ec4899",
    purple: COLORS.purple || "#a855f7",
    black: "#111827",
  };

  return palette[colorKey] || "#9ca3af";
}

function getLightColorValue(colorKey) {
  const palette = {
    red: COLORS.redLight || "#f87171",
    blue: COLORS.blueLight || "#60a5fa",
    green: COLORS.greenLight || "#4ade80",
    gray: COLORS.grayLight || "#94a3b8",
    yellow: COLORS.yellowLight || "#fde047",
    pink: COLORS.pinkLight || "#f472b6",
    purple: COLORS.purpleLight || "#c084fc",
    black: "#4b5563",
  };

  return palette[colorKey] || "#d1d5db";
}

function getHousePulseColor(colorKey, strength) {
  const baseMap = {
    red: [239, 68, 68],
    blue: [59, 130, 246],
    green: [34, 197, 94],
    gray: [148, 163, 184],
    yellow: [234, 179, 8],
    pink: [236, 72, 153],
    purple: [168, 85, 247],
  };

  const [r, g, b] = baseMap[colorKey] || [156, 163, 175];
  return `rgba(${r}, ${g}, ${b}, ${0.18 + strength * 0.14})`;
}

function normalizeVector(x, y) {
  const length = Math.hypot(x, y);
  if (!length) return { x: 0, y: 0 };
  return { x: x / length, y: y / length };
}

function getOffsetPoints(points, offset) {
  if (!points || points.length < 2) return points || [];

  return points.map((point, index) => {
    let nx = 0;
    let ny = 0;

    if (index > 0) {
      const prev = points[index - 1];
      const dir = normalizeVector(point.x - prev.x, point.y - prev.y);
      nx += -dir.y;
      ny += dir.x;
    }

    if (index < points.length - 1) {
      const next = points[index + 1];
      const dir = normalizeVector(next.x - point.x, next.y - point.y);
      nx += -dir.y;
      ny += dir.x;
    }

    const normal = normalizeVector(nx, ny);

    return {
      x: point.x + normal.x * offset,
      y: point.y + normal.y * offset,
    };
  });
}

function buildSmoothPath(ctx, points) {
  if (!points || points.length === 0) return;
  if (points.length === 1) {
    ctx.moveTo(points[0].x, points[0].y);
    return;
  }

  ctx.moveTo(points[0].x, points[0].y);

  if (points.length === 2) {
    ctx.lineTo(points[1].x, points[1].y);
    return;
  }

  for (let i = 1; i < points.length - 1; i += 1) {
    const current = points[i];
    const next = points[i + 1];
    const midX = (current.x + next.x) / 2;
    const midY = (current.y + next.y) / 2;

    ctx.quadraticCurveTo(current.x, current.y, midX, midY);
  }

  const secondLast = points[points.length - 2];
  const last = points[points.length - 1];
  ctx.quadraticCurveTo(secondLast.x, secondLast.y, last.x, last.y);
}

function drawBackground(ctx, failFlashStrength) {
  const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  gradient.addColorStop(0, "#356b4a");
  gradient.addColorStop(0.45, "#2f6947");
  gradient.addColorStop(1, "#28583d");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  ctx.save();
  ctx.globalAlpha = 0.12;
  for (let i = 0; i < 50; i += 1) {
    const x = (i * 173) % GAME_WIDTH;
    const y = (i * 97) % GAME_HEIGHT;
    const size = 12 + (i % 4) * 8;

    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size * 0.75, y);
    ctx.lineTo(x, y + size);
    ctx.lineTo(x - size * 0.75, y);
    ctx.closePath();
    ctx.fillStyle = i % 3 === 0 ? "#183524" : "#214a31";
    ctx.fill();
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.08;
  for (let i = 0; i < 90; i += 1) {
    const x = (i * 79) % GAME_WIDTH;
    const y = (i * 133) % GAME_HEIGHT;
    const h = 10 + (i % 5) * 6;

    ctx.fillStyle = "#10251a";
    ctx.fillRect(x, y, 2, h);
    ctx.beginPath();
    ctx.arc(x, y, 5 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  const vignette = ctx.createRadialGradient(
    GAME_WIDTH / 2,
    GAME_HEIGHT / 2,
    100,
    GAME_WIDTH / 2,
    GAME_HEIGHT / 2,
    GAME_WIDTH / 1.2
  );
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.22)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  if (failFlashStrength > 0) {
    ctx.fillStyle = `rgba(220, 38, 38, ${0.2 * failFlashStrength})`;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }
}

function drawTiesForSegment(ctx, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx) + Math.PI / 2;
  const tieCount = Math.max(1, Math.floor(length / TIE_SPACING));

  for (let i = 0; i <= tieCount; i += 1) {
    const t = tieCount === 0 ? 0 : i / tieCount;
    const x = start.x + dx * t;
    const y = start.y + dy * t;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    roundedRectPath(
      ctx,
      -TIE_WIDTH / 2,
      -TIE_HEIGHT / 2,
      TIE_WIDTH,
      TIE_HEIGHT,
      3
    );
    ctx.fillStyle = "#2a4c3b";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#173126";
    ctx.stroke();

    ctx.restore();
  }
}

function drawSmoothRail(ctx, points, offset) {
  const offsetPoints = getOffsetPoints(points, offset);

  ctx.beginPath();
  buildSmoothPath(ctx, offsetPoints);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = RAIL_WIDTH + 6;
  ctx.strokeStyle = "rgba(8, 20, 14, 0.45)";
  ctx.stroke();

  ctx.beginPath();
  buildSmoothPath(ctx, offsetPoints);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = RAIL_WIDTH + 3;
  ctx.strokeStyle = "#173126";
  ctx.stroke();

  ctx.beginPath();
  buildSmoothPath(ctx, offsetPoints);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = RAIL_WIDTH;
  ctx.strokeStyle = "#294f3e";
  ctx.stroke();
}

function drawPathRails(ctx, points) {
  for (let i = 0; i < points.length - 1; i += 1) {
    drawTiesForSegment(ctx, points[i], points[i + 1]);
  }

  drawSmoothRail(ctx, points, -RAIL_GAP / 2);
  drawSmoothRail(ctx, points, RAIL_GAP / 2);
}

function drawHighlightedRoute(ctx, points, flashStrength) {
  if (!points || points.length < 2) return;

  ctx.beginPath();
  buildSmoothPath(ctx, points);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = 22 + flashStrength * 8;
  ctx.strokeStyle = "#8bf05f";
  ctx.globalAlpha = 0.16 + flashStrength * 0.12;
  ctx.stroke();

  ctx.beginPath();
  buildSmoothPath(ctx, points);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = 14 + flashStrength * 5;
  ctx.strokeStyle = "#6cdf50";
  ctx.globalAlpha = 0.22 + flashStrength * 0.14;
  ctx.stroke();

  ctx.globalAlpha = 1;
}

function getSwitchIndicatorAngle(board, switchId, switchState) {
  const routeRule = Object.values(board.routeMap || {}).find(
    (rule) => rule.switchId === switchId
  );

  if (!routeRule) {
    return switchState === "left" ? -2.5 : -0.65;
  }

  const activeRouteKey = routeRule[switchState];
  const activePath = board.paths[activeRouteKey];

  if (!activePath || activePath.length < 2) {
    return switchState === "left" ? -2.5 : -0.65;
  }

  const start = activePath[0];
  const end = activePath[1];

  return Math.atan2(end.y - start.y, end.x - start.x);
}

function drawJunctionPad(ctx, x, y, activeStrength = 0) {
  ctx.save();

  ctx.beginPath();
  ctx.arc(x, y, 34 + activeStrength * 4, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(9, 30, 18, ${0.28 + activeStrength * 0.12})`;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x, y, 27 + activeStrength * 2, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(116, 242, 95, ${0.45 + activeStrength * 0.18})`;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x, y, 19, 0, Math.PI * 2);
  ctx.fillStyle = "#60c34a";
  ctx.fill();

  ctx.restore();
}

function drawSwitch(ctx, board, switchDef, switchState, flashStrength) {
  const { x, y } = switchDef;

  drawJunctionPad(ctx, x, y, flashStrength);

  ctx.beginPath();
  ctx.arc(x, y, SWITCH_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = "#20352b";
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();

  const indicatorAngle = getSwitchIndicatorAngle(board, switchDef.id, switchState);
  const length = 18;

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(
    x + Math.cos(indicatorAngle) * length,
    y + Math.sin(indicatorAngle) * length
  );
  ctx.lineCap = "round";
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fillStyle = "#8bf05f";
  ctx.fill();
}

function drawHouse(ctx, house, colorKey, pulseStrength) {
  const color = getColorValue(colorKey);
  const light = getLightColorValue(colorKey);
  const scale = 1 + pulseStrength * 0.08;

  ctx.save();
  ctx.translate(house.x, house.y);
  ctx.scale(scale, scale);

  if (pulseStrength > 0) {
    ctx.beginPath();
    ctx.arc(0, 0, 62 + pulseStrength * 16, 0, Math.PI * 2);
    ctx.fillStyle = getHousePulseColor(colorKey, pulseStrength);
    ctx.fill();
  }

  ctx.translate(-HOUSE_WIDTH / 2, -HOUSE_HEIGHT / 2);

  const roofHeight = 24;
  const bodyY = roofHeight - 2;
  const bodyHeight = HOUSE_HEIGHT - roofHeight;

  ctx.beginPath();
  ctx.moveTo(HOUSE_WIDTH * 0.18, bodyY);
  ctx.lineTo(HOUSE_WIDTH * 0.5, 0);
  ctx.lineTo(HOUSE_WIDTH * 0.82, bodyY);
  ctx.closePath();
  ctx.fillStyle = light;
  ctx.fill();

  roundedRectPath(ctx, 6, bodyY, HOUSE_WIDTH - 12, bodyHeight, 8);
  ctx.fillStyle = color;
  ctx.fill();

  roundedRectPath(ctx, HOUSE_WIDTH - 28, 8, 12, 22, 3);
  ctx.fillStyle = light;
  ctx.fill();

  roundedRectPath(ctx, 14, bodyY + 12, 16, 16, 3);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  roundedRectPath(ctx, HOUSE_WIDTH * 0.37, bodyY + bodyHeight - 26, 18, 26, 4);
  ctx.fillStyle = "#1f2937";
  ctx.fill();

  ctx.lineWidth = 6;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();

  ctx.lineWidth = 3;
  ctx.strokeStyle = "#223126";
  ctx.stroke();

  ctx.restore();
}

function drawSpawn(ctx, spawnPoint) {
  ctx.save();
  ctx.translate(spawnPoint.x, spawnPoint.y);

  roundedRectPath(ctx, -44, -28, 48, 56, 10);
  ctx.fillStyle = "#183226";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, 0, 24, -Math.PI / 2, Math.PI / 2, false);
  ctx.closePath();
  ctx.fillStyle = "#0f2018";
  ctx.fill();

  ctx.lineWidth = 4;
  ctx.strokeStyle = "#284638";
  ctx.stroke();

  ctx.restore();
}

function drawTrain(ctx, train) {
  ctx.save();
  ctx.translate(train.x, train.y);
  ctx.rotate(train.angle);

  ctx.fillStyle = "rgba(8, 20, 14, 0.24)";
  ctx.beginPath();
  ctx.ellipse(0, 12, 18, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  const bodyX = -TRAIN_WIDTH / 2;
  const bodyY = -TRAIN_HEIGHT / 2;
  const mainColor = getColorValue(train.color);
  const topColor = getLightColorValue(train.color);

  roundedRectPath(ctx, bodyX, bodyY, TRAIN_WIDTH, TRAIN_HEIGHT, 8);
  ctx.fillStyle = mainColor;
  ctx.fill();

  roundedRectPath(ctx, -12, -TRAIN_HEIGHT / 2 - 2, 12, 12, 4);
  ctx.fillStyle = topColor;
  ctx.fill();

  roundedRectPath(ctx, -9, -TRAIN_HEIGHT / 2 + 1, 6, 5, 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(TRAIN_WIDTH / 2 - 4, 0, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = "#fff7cc";
  ctx.fill();

  ctx.lineWidth = 5;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();

  ctx.lineWidth = 3;
  ctx.strokeStyle = "#223126";
  ctx.stroke();

  ctx.restore();
}

function drawBoard(ctx, board, switches, fxState) {
  for (const pathPoints of Object.values(board.paths)) {
    drawPathRails(ctx, pathPoints);
  }

  for (const routeRule of Object.values(board.routeMap || {})) {
    const switchState = switches[routeRule.switchId];
    const activeRouteKey = routeRule[switchState];
    const activePath = board.paths[activeRouteKey];

    drawHighlightedRoute(ctx, activePath, fxState.switchFlashStrength);
  }

  for (const spawnPoint of Object.values(board.spawnPoints || {})) {
    drawSpawn(ctx, spawnPoint);
  }

  for (const switchDef of Object.values(board.switches || {})) {
    drawSwitch(
      ctx,
      board,
      switchDef,
      switches[switchDef.id],
      fxState.switchFlashStrength
    );
  }

  for (const house of Object.values(board.houses || {})) {
    drawHouse(
      ctx,
      house,
      house.color,
      fxState.housePulseStrengths[house.color] || 0
    );
  }
}

export function drawScene(ctx, gameState, fxState = {}) {
  const board = getBoard(gameState.boardId);
  const currentTime = fxState.currentTime || 0;

  const switchFlashStrength = getRemainingStrength(
    fxState.switchFlashUntil,
    currentTime,
    FX_DURATIONS.switchFlash
  );

  const failFlashStrength = getRemainingStrength(
    fxState.failFlashUntil,
    currentTime,
    FX_DURATIONS.failFlash
  );

  const housePulseStrengths = Object.fromEntries(
    Object.values(board.houses || {}).map((house) => [
      house.color,
      getRemainingStrength(
        fxState.housePulseUntil?.[house.color],
        currentTime,
        FX_DURATIONS.housePulse
      ),
    ])
  );

  drawBackground(ctx, failFlashStrength);
  drawBoard(ctx, board, gameState.switches, {
    switchFlashStrength,
    housePulseStrengths,
  });

  for (const train of gameState.activeTrains) {
    drawTrain(ctx, train);
  }
}