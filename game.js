// Shirt states enum
const ShirtState = {
  START: 0,
  LEFT_FOLD: 1,
  RIGHT_FOLD: 2,
  DOUBLE_FOLD: 3,
  COMPLETE: 4,
};

// Trousers states enum
const TrousersState = {
  START: 0,
  LEFT_FOLD: 1,
  RIGHT_FOLD: 2,
  LEFT_FIRST_UP_FOLD: 3,
  RIGHT_FIRST_UP_FOLD: 4,
  LEFT_COMPLETE: 5,
  RIGHT_COMPLETE: 6,
};

// Result states enum
const ResultState = {
  FAIL: 0,
  SUCCESS: 1,
};

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: "game-container",
  backgroundColor: "#34495e",
  render: {
    pixelArt: true,
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

const game = new Phaser.Game(config);

function preload() {
  // Load the shirt states spritesheet
  // The spritesheet has 6 frames (3 columns x 2 rows)
  // Each frame is 24x24 pixels
  this.load.spritesheet("shirt_states", "assets/shirt_states.png", {
    frameWidth: 24,
    frameHeight: 24,
  });

  // Load the trousers states spritesheet
  // The spritesheet has 7 frames
  // Each frame is 32x32 pixels
  this.load.spritesheet("trousers_states", "assets/trousers_states.png", {
    frameWidth: 32,
    frameHeight: 32,
  });

  // Load the results spritesheet
  // The spritesheet has 2 frames (2 columns x 1 row)
  // Each frame is 24x24 pixels
  this.load.spritesheet("results", "assets/results.png", {
    frameWidth: 24,
    frameHeight: 24,
  });
}

function create() {
  // Game state
  this.gameState = {
    clothingType: "shirt", // 'shirt' or 'trousers'
    currentState: 0,
    leftFoldDone: false,
    rightFoldDone: false,
    foldPath: null, // 'left' or 'right' for trousers
    isShowingResult: false,
    inputEnabled: true,
  };

  // Create main clothing sprites
  const centerX = this.cameras.main.width / 2;
  const centerY = this.cameras.main.height / 2;

  this.shirtSprite = this.add.sprite(
    centerX,
    centerY,
    "shirt_states",
    ShirtState.START
  );
  this.shirtSprite.setScale(8);

  this.trousersSprite = this.add.sprite(
    centerX,
    centerY,
    "trousers_states",
    TrousersState.START
  );
  this.trousersSprite.setScale(8);

  // Set initial random clothing type and color
  setRandomClothing.call(this);

  // Create result sprite (hidden initially) - positioned above the shirt
  this.resultSprite = this.add.sprite(
    centerX,
    centerY,
    "results",
    ResultState.FAIL
  );
  this.resultSprite.setScale(8);
  this.resultSprite.setVisible(false);

  // Instructions
  this.add
    .text(centerX, 50, "Fold the laundry using arrow keys!", {
      fontSize: "24px",
      color: "#ffffff",
      fontStyle: "bold",
    })
    .setOrigin(0.5);

  this.instructionText = this.add
    .text(centerX, 500, "Press LEFT or RIGHT to fold", {
      fontSize: "18px",
      color: "#ecf0f1",
    })
    .setOrigin(0.5);

  // Set up keyboard input
  this.cursors = this.input.keyboard.createCursorKeys();
  this.lastKeyState = {
    left: false,
    right: false,
    up: false,
  };
}

function update() {
  if (this.gameState.isShowingResult || !this.gameState.inputEnabled) {
    return;
  }

  // Detect key press (only trigger once per key press)
  const leftPressed = this.cursors.left.isDown && !this.lastKeyState.left;
  const rightPressed = this.cursors.right.isDown && !this.lastKeyState.right;
  const upPressed = this.cursors.up.isDown && !this.lastKeyState.up;

  this.lastKeyState.left = this.cursors.left.isDown;
  this.lastKeyState.right = this.cursors.right.isDown;
  this.lastKeyState.up = this.cursors.up.isDown;

  if (leftPressed) {
    handleLeftKey.call(this);
  } else if (rightPressed) {
    handleRightKey.call(this);
  } else if (upPressed) {
    handleUpKey.call(this);
  }
}

function handleLeftKey() {
  const state = this.gameState;

  if (state.clothingType === "shirt") {
    handleShirtLeftKey.call(this);
  } else {
    handleTrousersLeftKey.call(this);
  }
}

function handleShirtLeftKey() {
  const state = this.gameState;

  // LEFT key can only be pressed when in START, LEFT_FOLD, or RIGHT_FOLD state
  if (
    state.currentState === ShirtState.DOUBLE_FOLD ||
    state.currentState === ShirtState.COMPLETE
  ) {
    showResult.call(this, ResultState.FAIL);
    return;
  }

  // Check if left was already pressed
  if (state.leftFoldDone) {
    showResult.call(this, ResultState.FAIL);
    return;
  }

  // Mark left as done and update visual
  state.leftFoldDone = true;

  if (state.rightFoldDone) {
    // Both folds done -> DOUBLE_FOLD
    state.currentState = ShirtState.DOUBLE_FOLD;
    this.shirtSprite.setFrame(ShirtState.DOUBLE_FOLD);
    this.instructionText.setText("Press UP to complete!");
  } else {
    // Only left done -> RIGHT_FOLD visual
    state.currentState = ShirtState.RIGHT_FOLD;
    this.shirtSprite.setFrame(ShirtState.RIGHT_FOLD);
    this.instructionText.setText("Press RIGHT to do second fold");
  }
}

function handleTrousersLeftKey() {
  const state = this.gameState;

  // For trousers, LEFT can only be pressed at START
  if (state.currentState !== TrousersState.START) {
    showResult.call(this, ResultState.FAIL);
    return;
  }

  // Set the path to left
  state.foldPath = "left";
  state.currentState = TrousersState.LEFT_FOLD;
  this.trousersSprite.setFrame(TrousersState.LEFT_FOLD);
  this.instructionText.setText("Press UP to continue folding");
}

function handleRightKey() {
  const state = this.gameState;

  if (state.clothingType === "shirt") {
    handleShirtRightKey.call(this);
  } else {
    handleTrousersRightKey.call(this);
  }
}

function handleShirtRightKey() {
  const state = this.gameState;

  // RIGHT key can only be pressed when in START, LEFT_FOLD, or RIGHT_FOLD state
  if (
    state.currentState === ShirtState.DOUBLE_FOLD ||
    state.currentState === ShirtState.COMPLETE
  ) {
    showResult.call(this, ResultState.FAIL);
    return;
  }

  // Check if right was already pressed
  if (state.rightFoldDone) {
    showResult.call(this, ResultState.FAIL);
    return;
  }

  // Mark right as done and update visual
  state.rightFoldDone = true;

  if (state.leftFoldDone) {
    // Both folds done -> DOUBLE_FOLD
    state.currentState = ShirtState.DOUBLE_FOLD;
    this.shirtSprite.setFrame(ShirtState.DOUBLE_FOLD);
    this.instructionText.setText("Press UP to complete!");
  } else {
    // Only right done -> LEFT_FOLD visual
    state.currentState = ShirtState.LEFT_FOLD;
    this.shirtSprite.setFrame(ShirtState.LEFT_FOLD);
    this.instructionText.setText("Press LEFT to do second fold");
  }
}

function handleTrousersRightKey() {
  const state = this.gameState;

  // For trousers, RIGHT can only be pressed at START
  if (state.currentState !== TrousersState.START) {
    showResult.call(this, ResultState.FAIL);
    return;
  }

  // Set the path to right
  state.foldPath = "right";
  state.currentState = TrousersState.RIGHT_FOLD;
  this.trousersSprite.setFrame(TrousersState.RIGHT_FOLD);
  this.instructionText.setText("Press UP to continue folding");
}

function handleUpKey() {
  const state = this.gameState;

  if (state.clothingType === "shirt") {
    handleShirtUpKey.call(this);
  } else {
    handleTrousersUpKey.call(this);
  }
}

function handleShirtUpKey() {
  const state = this.gameState;

  if (state.currentState === ShirtState.DOUBLE_FOLD) {
    // Success! Complete the fold
    state.currentState = ShirtState.COMPLETE;
    this.shirtSprite.setFrame(ShirtState.COMPLETE);
    showResult.call(this, ResultState.SUCCESS);
  } else {
    // Invalid move
    showResult.call(this, ResultState.FAIL);
  }
}

function handleTrousersUpKey() {
  const state = this.gameState;

  if (state.foldPath === "left") {
    if (state.currentState === TrousersState.LEFT_FOLD) {
      // First UP press on left path
      state.currentState = TrousersState.LEFT_FIRST_UP_FOLD;
      this.trousersSprite.setFrame(TrousersState.LEFT_FIRST_UP_FOLD);
      this.instructionText.setText("Press UP one more time!");
    } else if (state.currentState === TrousersState.LEFT_FIRST_UP_FOLD) {
      // Second UP press on left path - complete!
      state.currentState = TrousersState.LEFT_COMPLETE;
      this.trousersSprite.setFrame(TrousersState.LEFT_COMPLETE);
      showResult.call(this, ResultState.SUCCESS);
    } else {
      showResult.call(this, ResultState.FAIL);
    }
  } else if (state.foldPath === "right") {
    if (state.currentState === TrousersState.RIGHT_FOLD) {
      // First UP press on right path
      state.currentState = TrousersState.RIGHT_FIRST_UP_FOLD;
      this.trousersSprite.setFrame(TrousersState.RIGHT_FIRST_UP_FOLD);
      this.instructionText.setText("Press UP one more time!");
    } else if (state.currentState === TrousersState.RIGHT_FIRST_UP_FOLD) {
      // Second UP press on right path - complete!
      state.currentState = TrousersState.RIGHT_COMPLETE;
      this.trousersSprite.setFrame(TrousersState.RIGHT_COMPLETE);
      showResult.call(this, ResultState.SUCCESS);
    } else {
      showResult.call(this, ResultState.FAIL);
    }
  } else {
    // No path selected yet
    showResult.call(this, ResultState.FAIL);
  }
}

function showResult(resultState) {
  this.gameState.isShowingResult = true;
  this.gameState.inputEnabled = false;

  // Show result sprite
  this.resultSprite.setFrame(resultState);
  this.resultSprite.setVisible(true);

  // Set success icon opacity to 0.5
  if (resultState === ResultState.SUCCESS) {
    this.resultSprite.setAlpha(0.5);
  } else {
    this.resultSprite.setAlpha(1);
  }

  // Hide after 1 second and reset
  this.time.delayedCall(1000, () => {
    this.resultSprite.setVisible(false);
    resetGame.call(this);
  });
}

function resetGame() {
  // Reset game state
  this.gameState.currentState = 0;
  this.gameState.leftFoldDone = false;
  this.gameState.rightFoldDone = false;
  this.gameState.foldPath = null;
  this.gameState.isShowingResult = false;
  this.gameState.inputEnabled = true;

  // Reset sprites to START frame
  this.shirtSprite.setFrame(ShirtState.START);
  this.trousersSprite.setFrame(TrousersState.START);

  // Change clothing type and color randomly for next round
  setRandomClothing.call(this);

  // Reset instruction text
  this.instructionText.setText("Press LEFT or RIGHT to fold");
}

function setRandomClothing() {
  // Randomly pick shirt or trousers
  const clothingTypes = ["shirt", "trousers"];
  this.gameState.clothingType = clothingTypes[Math.floor(Math.random() * clothingTypes.length)];

  // Show/hide appropriate sprite
  if (this.gameState.clothingType === "shirt") {
    this.shirtSprite.setVisible(true);
    this.trousersSprite.setVisible(false);
  } else {
    this.shirtSprite.setVisible(false);
    this.trousersSprite.setVisible(true);
  }

  // Generate random color
  const colors = [
    0xff6b6b, // Red
    0x4ecdc4, // Teal
    0xffe66d, // Yellow
    0xa8e6cf, // Mint
    0xffd3b6, // Peach
    0xffaaa5, // Pink
    0x95e1d3, // Turquoise
    0xf38181, // Coral
    0xaa96da, // Purple
    0xfcbad3, // Light Pink
    0xa8d8ea, // Light Blue
    0xffccb6, // Light Orange
  ];

  // Pick a random color from the array
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  // Apply color to current clothing
  if (this.gameState.clothingType === "shirt") {
    this.shirtSprite.setTint(randomColor);
  } else {
    this.trousersSprite.setTint(randomColor);
  }
}
