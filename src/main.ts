import "./style.css";

import { RandomRectangles } from "./scenes/RandomRectangles";
import { AUTO, Scale, Game } from "phaser";

const config = {
  type: AUTO,
  width: 500,
  height: 500,
  backgroundColor: "#028af8",
  antialias: true,
  pixelArt: true,
  scale: {
    mode: Scale.FIT,
    autoCenter: Scale.CENTER_BOTH,
  },
  scene: [RandomRectangles],
};

export default new Game(config);
