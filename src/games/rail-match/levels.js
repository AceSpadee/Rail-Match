export const BOARD_LAYOUT = {
  id: "basic-fork",
  width: 960,
  height: 540,

  spawn: { x: 480, y: 500 },

  switches: {
    main: {
      id: "main",
      x: 480,
      y: 280,
      defaultState: "left",
    },
  },

  houses: {
    red: {
      id: "red-house",
      color: "red",
      x: 250,
      y: 78,
      width: 82,
      height: 70,
    },
    blue: {
      id: "blue-house",
      color: "blue",
      x: 710,
      y: 78,
      width: 82,
      height: 70,
    },
  },

  paths: {
    trunk: [
      { x: 480, y: 500 },
      { x: 480, y: 430 },
      { x: 480, y: 360 },
      { x: 480, y: 280 },
    ],

    leftBranch: [
      { x: 480, y: 280 },
      { x: 430, y: 245 },
      { x: 375, y: 205 },
      { x: 315, y: 165 },
      { x: 250, y: 128 },
    ],

    rightBranch: [
      { x: 480, y: 280 },
      { x: 530, y: 245 },
      { x: 585, y: 205 },
      { x: 645, y: 165 },
      { x: 710, y: 128 },
    ],
  },
};

export const LEVELS = [
  {
    id: 1,
    name: "Level 1",
    boardId: "basic-fork",
    initialSwitchState: "left",
    trainSpeed: 110,
    trains: [{ id: "l1-t1", color: "red", spawnTime: 0 }],
  },
  {
    id: 2,
    name: "Level 2",
    boardId: "basic-fork",
    initialSwitchState: "left",
    trainSpeed: 110,
    trains: [{ id: "l2-t1", color: "blue", spawnTime: 0 }],
  },
  {
    id: 3,
    name: "Level 3",
    boardId: "basic-fork",
    initialSwitchState: "left",
    trainSpeed: 120,
    trains: [
      { id: "l3-t1", color: "red", spawnTime: 0.0 },
      { id: "l3-t2", color: "blue", spawnTime: 2.4 },
    ],
  },
  {
    id: 4,
    name: "Level 4",
    boardId: "basic-fork",
    initialSwitchState: "left",
    trainSpeed: 132,
    trains: [
      { id: "l4-t1", color: "blue", spawnTime: 0.0 },
      { id: "l4-t2", color: "red", spawnTime: 1.7 },
      { id: "l4-t3", color: "blue", spawnTime: 3.3 },
    ],
  },
  {
    id: 5,
    name: "Level 5",
    boardId: "basic-fork",
    initialSwitchState: "right",
    trainSpeed: 145,
    trains: [
      { id: "l5-t1", color: "red", spawnTime: 0.0 },
      { id: "l5-t2", color: "blue", spawnTime: 1.35 },
      { id: "l5-t3", color: "red", spawnTime: 2.7 },
      { id: "l5-t4", color: "blue", spawnTime: 3.9 },
    ],
  },
];