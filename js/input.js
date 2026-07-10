// ===== input.js — keyboard state =====

const Input = {
  keys: new Set(),
  pressedThisFrame: new Set(),

  init() {
    window.addEventListener('keydown', (e) => {
      const code = e.code;
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(code)) {
        e.preventDefault();
      }
      if (!this.keys.has(code)) this.pressedThisFrame.add(code);
      this.keys.add(code);
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
    });
  },

  isDown(code) {
    return this.keys.has(code);
  },

  wasPressed(code) {
    return this.pressedThisFrame.has(code);
  },

  // call at end of each frame
  endFrame() {
    this.pressedThisFrame.clear();
  },

  // convenience combined checks
  up()    { return this.isDown('ArrowUp')    || this.isDown('KeyW'); },
  down()  { return this.isDown('ArrowDown')  || this.isDown('KeyS'); },
  left()  { return this.isDown('ArrowLeft')  || this.isDown('KeyA'); },
  right() { return this.isDown('ArrowRight') || this.isDown('KeyD'); },
  focus() { return this.isDown('ShiftLeft')  || this.isDown('ShiftRight'); },
  shoot() { return this.isDown('KeyZ'); },
  bomb()  { return this.wasPressed('KeyX'); },
  pause() { return this.wasPressed('KeyP') || this.wasPressed('Escape'); },
  confirm() { return this.wasPressed('KeyZ') || this.wasPressed('Enter'); },
  menuUp() { return this.wasPressed('ArrowUp') || this.wasPressed('KeyW'); },
  menuDown() { return this.wasPressed('ArrowDown') || this.wasPressed('KeyS'); },
  menuLeft() { return this.wasPressed('ArrowLeft') || this.wasPressed('KeyA'); },
  menuRight() { return this.wasPressed('ArrowRight') || this.wasPressed('KeyD'); },
};
