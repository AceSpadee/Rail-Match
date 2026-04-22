import {
  COLORS,
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
import { BOARD_LAYOUT } from "./levels";

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

function drawBackground(ctx) {
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
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
    ctx.fillStyle = COLORS.tie;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = COLORS.tieDark;
    ctx.stroke();

    ctx.restore();
  }
}

function drawRailSegment(ctx, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);

  if (!length) return;

  const nx = -dy / length;
  const ny = dx / length;
  const offset = RAIL_GAP / 2;

  for (const sign of [-1, 1]) {
    const x1 = start.x + nx * offset * sign;
    const y1 = start.y + ny * offset * sign;
    const x2 = end.x + nx * offset * sign;
    const y2 = end.y + ny * offset * sign;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineCap = "round";
    ctx.lineWidth = RAIL_WIDTH + 4;
    ctx.strokeStyle = COLORS.railMetalDark;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineCap = "round";
    ctx.lineWidth = RAIL_WIDTH;
    ctx.strokeStyle = COLORS.railMetal;
    ctx.stroke();
  }
}

function drawPathRails(ctx, points) {
  for (let i = 0; i < points.length - 1; i += 1) {
    drawTiesForSegment(ctx, points[i], points[i + 1]);
  }

  for (let i = 0; i < points.length - 1; i += 1) {
    drawRailSegment(ctx, points[i], points[i + 1]);
  }
}

function drawHighlightedBranch(ctx, points) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i].x, points[i].y);
  }

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = 16;
  ctx.strokeStyle = COLORS.switchHighlight;
  ctx.globalAlpha = 0.42;
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawSwitch(ctx, switchState) {
  const { x, y } = BOARD_LAYOUT.switches.main;

  ctx.beginPath();
  ctx.arc(x, y, SWITCH_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.switchBase;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = COLORS.switchRing;
  ctx.stroke();

  const indicatorAngle = switchState === "left" ? -2.5 : -0.65;
  const length = 18;

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(indicatorAngle) * length, y + Math.sin(indicatorAngle) * length);
  ctx.lineCap = "round";
  ctx.lineWidth = 5;
  ctx.strokeStyle = COLORS.switchHighlight;
  ctx.stroke();
}

function drawHouse(ctx, house, color) {
  const x = house.x - HOUSE_WIDTH / 2;
  const y = house.y - HOUSE_HEIGHT / 2;
  const roofHeight = 26;
  const bodyY = y + roofHeight - 4;
  const bodyHeight = HOUSE_HEIGHT - roofHeight;

  ctx.beginPath();
  ctx.moveTo(house.x, y);
  ctx.lineTo(x + HOUSE_WIDTH, bodyY);
  ctx.lineTo(x, bodyY);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = COLORS.houseOutline;
  ctx.stroke();

  roundedRectPath(ctx, x, bodyY, HOUSE_WIDTH, bodyHeight, 8);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = COLORS.houseOutline;
  ctx.stroke();

  roundedRectPath(ctx, house.x - 10, bodyY + bodyHeight - 24, 20, 24, 4);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = COLORS.houseOutline;
  ctx.stroke();
}

function drawTrain(ctx, train) {
  ctx.save();
  ctx.translate(train.x, train.y);
  ctx.rotate(train.angle);

  ctx.fillStyle = "rgba(17, 24, 39, 0.14)";
  ctx.beginPath();
  ctx.ellipse(0, 11, 18, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  const bodyX = -TRAIN_WIDTH / 2;
  const bodyY = -TRAIN_HEIGHT / 2;

  roundedRectPath(ctx, bodyX, bodyY, TRAIN_WIDTH, TRAIN_HEIGHT, 8);
  ctx.fillStyle = train.color === "red" ? COLORS.red : COLORS.blue;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = COLORS.trainOutline;
  ctx.stroke();

  roundedRectPath(ctx, -12, -TRAIN_HEIGHT / 2 - 2, 12, 12, 4);
  ctx.fillStyle = train.color === "red" ? "#f87171" : "#60a5fa";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = COLORS.trainOutline;
  ctx.stroke();

  roundedRectPath(ctx, -9, -TRAIN_HEIGHT / 2 + 1, 6, 5, 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(TRAIN_WIDTH / 2 - 4, 0, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = "#fff7cc";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = COLORS.trainOutline;
  ctx.stroke();

  ctx.restore();
}

function drawBoard(ctx, switchState) {
  const { trunk, leftBranch, rightBranch } = BOARD_LAYOUT.paths;
  const activeBranch = switchState === "right" ? rightBranch : leftBranch;

  drawHighlightedBranch(ctx, activeBranch);

  drawPathRails(ctx, trunk);
  drawPathRails(ctx, leftBranch);
  drawPathRails(ctx, rightBranch);

  drawSwitch(ctx, switchState);

  drawHouse(ctx, BOARD_LAYOUT.houses.red, COLORS.red);
  drawHouse(ctx, BOARD_LAYOUT.houses.blue, COLORS.blue);
}

export function drawScene(ctx, gameState) {
  drawBackground(ctx);
  drawBoard(ctx, gameState.switches.main);

  for (const train of gameState.activeTrains) {
    drawTrain(ctx, train);
  }
}