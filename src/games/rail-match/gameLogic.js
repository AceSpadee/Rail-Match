import { BOARD_LAYOUT } from "./levels";

function distance(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function getPath(routeKey) {
  return BOARD_LAYOUT.paths[routeKey];
}

function getRouteDestinationColor(routeKey) {
  if (routeKey === "leftBranch") return "red";
  if (routeKey === "rightBranch") return "blue";
  return null;
}

function createTrain(trainConfig, speed) {
  return {
    id: trainConfig.id,
    color: trainConfig.color,
    speed,
    x: BOARD_LAYOUT.spawn.x,
    y: BOARD_LAYOUT.spawn.y,
    angle: -Math.PI / 2,
    routeKey: "trunk",
    segmentIndex: 0,
    segmentProgress: 0,
    committedBranch: null,
    status: "moving",
  };
}

function stepTrain(train, switchState, deltaTime) {
  const updated = { ...train };
  let remainingDistance = updated.speed * deltaTime;

  while (remainingDistance > 0) {
    const path = getPath(updated.routeKey);

    if (updated.segmentIndex >= path.length - 1) {
      const destinationColor = getRouteDestinationColor(updated.routeKey);
      updated.status = destinationColor === updated.color ? "delivered" : "failed";
      updated.destinationColor = destinationColor;
      return {
        status: updated.status,
        train: updated,
      };
    }

    const start = path[updated.segmentIndex];
    const end = path[updated.segmentIndex + 1];

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const segmentLength = Math.hypot(dx, dy);
    const distanceLeftOnSegment = segmentLength - updated.segmentProgress;

    updated.angle = Math.atan2(dy, dx);

    if (remainingDistance < distanceLeftOnSegment) {
      updated.segmentProgress += remainingDistance;
      const t = updated.segmentProgress / segmentLength;
      updated.x = start.x + dx * t;
      updated.y = start.y + dy * t;
      remainingDistance = 0;
      return {
        status: "moving",
        train: updated,
      };
    }

    updated.x = end.x;
    updated.y = end.y;
    remainingDistance -= distanceLeftOnSegment;
    updated.segmentIndex += 1;
    updated.segmentProgress = 0;

    if (updated.routeKey === "trunk" && updated.segmentIndex >= path.length - 1) {
      const branchKey = switchState === "right" ? "rightBranch" : "leftBranch";
      const branchPath = getPath(branchKey);

      updated.routeKey = branchKey;
      updated.committedBranch = branchKey;
      updated.segmentIndex = 0;
      updated.segmentProgress = 0;
      updated.angle = Math.atan2(
        branchPath[1].y - branchPath[0].y,
        branchPath[1].x - branchPath[0].x
      );
    }
  }

  return {
    status: "moving",
    train: updated,
  };
}

export function createInitialGameState(level) {
  const sortedTrains = [...level.trains].sort((a, b) => a.spawnTime - b.spawnTime);

  return {
    status: "playing",
    elapsed: 0,
    switches: {
      main: level.initialSwitchState || BOARD_LAYOUT.switches.main.defaultState,
    },
    pendingTrains: sortedTrains,
    activeTrains: [],
    deliveredIds: [],
    deliveredCount: 0,
    totalCount: sortedTrains.length,
    failedTrain: null,
  };
}

export function toggleMainSwitch(gameState) {
  if (gameState.status !== "playing") return gameState;

  return {
    ...gameState,
    switches: {
      ...gameState.switches,
      main: gameState.switches.main === "left" ? "right" : "left",
    },
  };
}

export function updateGameState(gameState, level, deltaTime) {
  if (gameState.status !== "playing") return gameState;

  const elapsed = gameState.elapsed + deltaTime;
  const pendingTrains = [...gameState.pendingTrains];
  const activeTrains = [...gameState.activeTrains];
  const deliveredIds = [...gameState.deliveredIds];

  let deliveredCount = gameState.deliveredCount;
  let failedTrain = null;
  let nextStatus = "playing";

  while (pendingTrains.length > 0 && pendingTrains[0].spawnTime <= elapsed) {
    const nextTrain = pendingTrains.shift();
    activeTrains.push(createTrain(nextTrain, level.trainSpeed));
  }

  const nextActiveTrains = [];

  for (const train of activeTrains) {
    const result = stepTrain(train, gameState.switches.main, deltaTime);

    if (result.status === "moving") {
      nextActiveTrains.push(result.train);
      continue;
    }

    if (result.status === "delivered") {
      deliveredCount += 1;
      deliveredIds.push(result.train.id);
      continue;
    }

    if (result.status === "failed") {
      failedTrain = result.train;
      nextStatus = "lost";
      nextActiveTrains.push(result.train);
      break;
    }
  }

  if (
    nextStatus === "playing" &&
    pendingTrains.length === 0 &&
    nextActiveTrains.length === 0 &&
    deliveredCount === gameState.totalCount
  ) {
    nextStatus = "won";
  }

  return {
    ...gameState,
    elapsed,
    pendingTrains,
    activeTrains: nextActiveTrains,
    deliveredIds,
    deliveredCount,
    failedTrain,
    status: nextStatus,
  };
}

export function isPointInsideMainSwitch(x, y) {
  const switchPoint = BOARD_LAYOUT.switches.main;
  return distance({ x, y }, switchPoint) <= 28;
}