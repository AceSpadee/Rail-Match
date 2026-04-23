import { SWITCH_HIT_RADIUS } from "./constants";
import { BOARDS } from "./boards";

function distance(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function getBoard(boardId) {
  const board = BOARDS[boardId];

  if (!board) {
    throw new Error(`Unknown boardId: ${boardId}`);
  }

  return board;
}

function getPath(board, routeKey) {
  return board.paths[routeKey];
}

function getInitialAngleForRoute(board, routeKey) {
  const path = getPath(board, routeKey);

  if (!path || path.length < 2) {
    return -Math.PI / 2;
  }

  const start = path[0];
  const end = path[1];

  return Math.atan2(end.y - start.y, end.x - start.x);
}

function buildInitialSwitchState(board, level) {
  const boardDefaults = Object.fromEntries(
    Object.values(board.switches).map((switchDef) => [
      switchDef.id,
      switchDef.defaultState,
    ])
  );

  return {
    ...boardDefaults,
    ...(level.initialSwitchStates || {}),
  };
}

function createTrain(trainConfig, speed, board) {
  const spawnPoint = board.spawnPoints[trainConfig.spawnPointId];

  if (!spawnPoint) {
    throw new Error(
      `Unknown spawnPointId "${trainConfig.spawnPointId}" on board "${board.id}"`
    );
  }

  return {
    id: trainConfig.id,
    color: trainConfig.color,
    spawnPointId: trainConfig.spawnPointId,
    speed,
    x: spawnPoint.x,
    y: spawnPoint.y,
    angle: getInitialAngleForRoute(board, spawnPoint.entryRouteKey),
    routeKey: spawnPoint.entryRouteKey,
    segmentIndex: 0,
    segmentProgress: 0,
    committedBranch: null,
    status: "moving",
  };
}

function resolveRouteEnd(train, switches, board) {
  const routeRule = board.routeMap?.[train.routeKey];

  if (routeRule) {
    const switchState = switches[routeRule.switchId];
    const nextRouteKey = routeRule[switchState];

    if (!nextRouteKey || !board.paths[nextRouteKey]) {
      return {
        status: "failed",
        train: {
          ...train,
          status: "failed",
          destinationColor: null,
        },
      };
    }

    const nextTrain = {
      ...train,
      routeKey: nextRouteKey,
      committedBranch: nextRouteKey,
      segmentIndex: 0,
      segmentProgress: 0,
      angle: getInitialAngleForRoute(board, nextRouteKey),
    };

    return {
      status: "continue",
      train: nextTrain,
    };
  }

  const destinationColor = board.destinations?.[train.routeKey] ?? null;

  if (!destinationColor) {
    return {
      status: "failed",
      train: {
        ...train,
        status: "failed",
        destinationColor: null,
      },
    };
  }

  const finalStatus = destinationColor === train.color ? "delivered" : "failed";

  return {
    status: finalStatus,
    train: {
      ...train,
      status: finalStatus,
      destinationColor,
    },
  };
}

function stepTrain(train, switches, board, deltaTime) {
  let updated = { ...train };
  let remainingDistance = updated.speed * deltaTime;

  while (remainingDistance > 0) {
    const path = getPath(board, updated.routeKey);

    if (!path || path.length < 2) {
      return {
        status: "failed",
        train: {
          ...updated,
          status: "failed",
          destinationColor: null,
        },
      };
    }

    if (updated.segmentIndex >= path.length - 1) {
      const routeEnd = resolveRouteEnd(updated, switches, board);

      if (routeEnd.status === "continue") {
        updated = routeEnd.train;
        continue;
      }

      return routeEnd;
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

      return {
        status: "moving",
        train: updated,
      };
    }

    updated.x = end.x;
    updated.y = end.y;
    updated.segmentIndex += 1;
    remainingDistance -= distanceLeftOnSegment;
    updated.segmentProgress = 0;
  }

  return {
    status: "moving",
    train: updated,
  };
}

export function createInitialGameState(level) {
  const board = getBoard(level.boardId);
  const sortedTrains = [...level.trains].sort((a, b) => a.spawnTime - b.spawnTime);

  return {
    status: "playing",
    elapsed: 0,
    boardId: board.id,
    switches: buildInitialSwitchState(board, level),
    pendingTrains: sortedTrains,
    activeTrains: [],
    deliveredIds: [],
    deliveredCount: 0,
    totalCount: sortedTrains.length,
    failedTrain: null,
    recentEvents: [],
  };
}

export function toggleSwitch(gameState, switchId) {
  if (gameState.status !== "playing") return gameState;
  if (!(switchId in gameState.switches)) return gameState;

  return {
    ...gameState,
    switches: {
      ...gameState.switches,
      [switchId]:
        gameState.switches[switchId] === "left" ? "right" : "left",
    },
    recentEvents: [{ type: "switch-toggled", switchId }],
  };
}

export function updateGameState(gameState, level, deltaTime) {
  if (gameState.status !== "playing") {
    return {
      ...gameState,
      recentEvents: [],
    };
  }

  const board = getBoard(level.boardId);
  const elapsed = gameState.elapsed + deltaTime;
  const pendingTrains = [...gameState.pendingTrains];
  const activeTrains = [...gameState.activeTrains];
  const deliveredIds = [...gameState.deliveredIds];
  const recentEvents = [];

  let deliveredCount = gameState.deliveredCount;
  let failedTrain = null;
  let nextStatus = "playing";

  while (pendingTrains.length > 0 && pendingTrains[0].spawnTime <= elapsed) {
    const nextTrain = pendingTrains.shift();
    activeTrains.push(createTrain(nextTrain, level.trainSpeed, board));
  }

  const nextActiveTrains = [];

  for (const train of activeTrains) {
    const result = stepTrain(train, gameState.switches, board, deltaTime);

    if (result.status === "moving") {
      nextActiveTrains.push(result.train);
      continue;
    }

    if (result.status === "delivered") {
      deliveredCount += 1;
      deliveredIds.push(result.train.id);
      recentEvents.push({
        type: "train-delivered",
        color: result.train.color,
        destinationColor: result.train.destinationColor,
      });
      continue;
    }

    if (result.status === "failed") {
      failedTrain = result.train;
      nextStatus = "lost";
      recentEvents.push({
        type: "train-failed",
        color: result.train.color,
        destinationColor: result.train.destinationColor,
      });
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
    recentEvents.push({ type: "level-won" });
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
    recentEvents,
  };
}

export function getClickedSwitchId(boardId, x, y) {
  const board = getBoard(boardId);

  for (const switchDef of Object.values(board.switches)) {
    if (distance({ x, y }, switchDef) <= SWITCH_HIT_RADIUS) {
      return switchDef.id;
    }
  }

  return null;
}