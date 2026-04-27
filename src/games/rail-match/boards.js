export const BOARDS = {
  branchingIntro: {
    id: "branchingIntro",
    width: 1280,
    height: 720,

    spawnPoints: {
      mainSpawn: {
        id: "mainSpawn",
        x: 90,
        y: 360,
        entryRouteKey: "entry",
      },
    },

    switches: {
      s1: {
        id: "s1",
        x: 430,
        y: 365,
        defaultState: "left",
      },
      s2: {
        id: "s2",
        x: 790,
        y: 225,
        defaultState: "left",
      },
      s3: {
        id: "s3",
        x: 790,
        y: 545,
        defaultState: "left",
      },
      s4: {
        id: "s4",
        x: 1035,
        y: 260,
        defaultState: "left",
      },
    },

    houses: {
      blue: {
        id: "blue-house",
        color: "blue",
        x: 1115,
        y: 105,
        width: 82,
        height: 70,
      },
      gray: {
        id: "gray-house",
        color: "gray",
        x: 1215,
        y: 255,
        width: 82,
        height: 70,
      },
      yellow: {
        id: "yellow-house",
        color: "yellow",
        x: 1215,
        y: 365,
        width: 82,
        height: 70,
      },
      red: {
        id: "red-house",
        color: "red",
        x: 1095,
        y: 600,
        width: 82,
        height: 70,
      },
      green: {
        id: "green-house",
        color: "green",
        x: 835,
        y: 660,
        width: 82,
        height: 70,
      },
    },

    paths: {
      entry: [
        { x: 90, y: 360 },
        { x: 150, y: 360 },
        { x: 215, y: 361 },
        { x: 280, y: 362 },
        { x: 335, y: 363 },
        { x: 385, y: 364 },
        { x: 430, y: 365 },
      ],

      s1Left: [
        { x: 430, y: 365 },
        { x: 455, y: 347 },
        { x: 485, y: 329 },
        { x: 520, y: 308 },
        { x: 560, y: 286 },
        { x: 605, y: 266 },
        { x: 655, y: 248 },
        { x: 710, y: 235 },
        { x: 755, y: 228 },
        { x: 790, y: 225 },
      ],

      s1Right: [
        { x: 430, y: 365 },
        { x: 458, y: 386 },
        { x: 492, y: 410 },
        { x: 530, y: 436 },
        { x: 575, y: 462 },
        { x: 625, y: 488 },
        { x: 680, y: 512 },
        { x: 730, y: 530 },
        { x: 768, y: 541 },
        { x: 790, y: 545 },
      ],

      s2Left: [
        { x: 790, y: 225 },
        { x: 845, y: 210 },
        { x: 900, y: 190 },
        { x: 955, y: 168 },
        { x: 1005, y: 145 },
        { x: 1045, y: 128 },
        { x: 1080, y: 115 },
        { x: 1115, y: 105 },
      ],

      s2RightToS4: [
        { x: 790, y: 225 },
        { x: 850, y: 230 },
        { x: 905, y: 236 },
        { x: 955, y: 244 },
        { x: 995, y: 252 },
        { x: 1035, y: 260 },
      ],

      s4Left: [
        { x: 1035, y: 260 },
        { x: 1080, y: 258 },
        { x: 1125, y: 257 },
        { x: 1170, y: 256 },
        { x: 1215, y: 255 },
      ],

      s4Right: [
        { x: 1035, y: 260 },
        { x: 1080, y: 286 },
        { x: 1125, y: 315 },
        { x: 1170, y: 342 },
        { x: 1215, y: 365 },
      ],

      s3Left: [
        { x: 790, y: 545 },
        { x: 850, y: 548 },
        { x: 910, y: 553 },
        { x: 970, y: 562 },
        { x: 1025, y: 574 },
        { x: 1060, y: 586 },
        { x: 1080, y: 594 },
        { x: 1095, y: 600 },
      ],

      s3Right: [
        { x: 790, y: 545 },
        { x: 800, y: 565 },
        { x: 808, y: 584 },
        { x: 815, y: 602 },
        { x: 820, y: 620 },
        { x: 825, y: 635 },
        { x: 830, y: 648 },
        { x: 835, y: 660 },
      ],
    },

    routeMap: {
      entry: {
        switchId: "s1",
        left: "s1Left",
        right: "s1Right",
      },
      s1Left: {
        switchId: "s2",
        left: "s2Left",
        right: "s2RightToS4",
      },
      s2RightToS4: {
        switchId: "s4",
        left: "s4Left",
        right: "s4Right",
      },
      s1Right: {
        switchId: "s3",
        left: "s3Left",
        right: "s3Right",
      },
    },

    destinations: {
      s2Left: "blue",
      s4Left: "gray",
      s4Right: "yellow",
      s3Left: "red",
      s3Right: "green",
    },
  },
};