import type { FolderApi } from "tweakpane";
import type { Room, Tile } from "../types";

import { GameObjects, Math as MathUtils, Scene, Display } from "phaser";
import { Pane } from "tweakpane";
import * as EssentialsPlugin from "@tweakpane/plugin-essentials";
// import polylabel from "polylabel";
// import simplify from "simplify-path";
import { createNoise2D } from "simplex-noise";
import { map } from "math-toolbox";

import {
  getNeighbourTiles,
  getTileAt,
  removeDuplicatesTilesFromArray,
  removeTileFromArray,
  tileExistsInArray,
} from "../utils/tiles";

// https://colorhunt.co/palette/155263ff6f3cff9a3cffc93c
const COLOR_PALETTE = {
  BG: 0x155263,
  FLOOR: 0xff9a3c,
  GRID: 0xffc93c,
};

const rng = new MathUtils.RandomDataGenerator();

export class RandomRectangles extends Scene {
  roomWidth = {
    min: 3,
    max: 5,
  };
  roomHeight = {
    min: 3,
    max: 5,
  };
  graphics!: GameObjects.Graphics;
  pane!: FolderApi;
  cellSize = 20;
  roomIterations = 25;
  autoClear = true;
  noiseScale = 1;
  noiseThreshold = 0.5;
  rooms: Room[] = [];

  constructor() {
    super("RandomRectangles");
  }

  create() {
    this.createDebugUI();
    this.createGraphics();
    this.render();
  }

  createDebugUI() {
    this.pane = new Pane();
    this.pane.registerPlugin(EssentialsPlugin);

    const gridFolder = this.pane.addFolder({
      title: "Grid",
    });

    gridFolder.addBinding(this, "cellSize", {
      min: 5,
      max: 100,
      step: 5,
      label: "Cell size",
    });

    const roomFolder = this.pane.addFolder({
      title: "Rooms",
    });

    roomFolder.addBinding(this, "roomWidth", {
      min: 1,
      max: 100,
      step: 1,
      label: "Width",
    });

    roomFolder.addBinding(this, "roomHeight", {
      min: 1,
      max: 100,
      step: 1,
      label: "Height",
    });

    roomFolder.addBinding(this, "roomIterations", {
      min: 1,
      max: 100,
      step: 1,
      label: "Count",
    });

    roomFolder.addBinding(this, "autoClear", {
      label: "Auto clear",
    });

    roomFolder
      .addButton({
        title: "Draw rooms",
      })
      .on("click", () => {
        this.render();
      });

    const noiseFolder = this.pane.addFolder({
      title: "Noise",
    });

    noiseFolder.addBinding(this, "noiseScale", {
      label: "Scale",
      min: 0,
      max: 1,
      step: 0.001,
    });

    noiseFolder.addBinding(this, "noiseThreshold", {
      label: "Threshold",
      min: 0,
      max: 1,
      step: 0.001,
    });

    noiseFolder
      .addButton({
        title: "Noise",
      })
      .on("click", () => {
        this.noise();
      });

    this.pane
      .addButton({
        title: "Flood fill",
      })
      .on("click", () => {
        this.floodFillDebug();
      });

    this.pane
      .addButton({
        title: "Detect edges",
      })
      .on("click", () => {
        this.detectEdgesDebug();
      });

    this.pane
      .addButton({
        title: "Connect rooms",
      })
      .on("click", () => {
        this.connectRoomsDebug();
      });

    // this.pane
    //   .addButton({
    //     title: "Polylabel",
    //   })
    //   .on("click", () => {
    //     this.polylabel();
    //   });
  }

  createGraphics() {
    this.graphics = this.add.graphics();
    this.cameras.main.setBackgroundColor(COLOR_PALETTE.BG);
  }

  render() {
    this.graphics.clear();

    if (this.autoClear) {
      this.rooms = [];
    }

    for (let i = 0; i < this.roomIterations; i++) {
      this.generateRoom();
    }

    this.renderRooms();
    this.renderGrid();
  }

  generateRoom() {
    const roomX = rng.integerInRange(0, this.scale.width / this.cellSize);
    const roomY = rng.integerInRange(0, this.scale.height / this.cellSize);
    const roomWidth = rng.integerInRange(
      this.roomWidth.min,
      this.roomWidth.max
    );
    const roomHeight = rng.integerInRange(
      this.roomHeight.min,
      this.roomHeight.max
    );

    const room = [];
    for (let x = roomX; x < roomX + roomWidth; x++) {
      for (let y = roomY; y < roomY + roomHeight; y++) {
        room.push(new MathUtils.Vector2(x, y));
      }
    }
    this.rooms.push(room);
  }

  renderRooms() {
    this.rooms.forEach((room) => {
      room.forEach((tile) => {
        this.renderTile(tile);
      });
    });
  }

  renderGrid() {
    this.graphics.lineStyle(1, COLOR_PALETTE.GRID, 0.5);
    for (let x = 0; x < this.scale.width; x += this.cellSize) {
      for (let y = 0; y < this.scale.height; y += this.cellSize) {
        this.graphics.strokeRect(x, y, this.cellSize, this.cellSize);
      }
    }
  }

  renderTile(tile: Tile) {
    this.graphics.fillStyle(COLOR_PALETTE.FLOOR, 1);
    this.graphics.fillRect(
      tile.x * this.cellSize,
      tile.y * this.cellSize,
      this.cellSize,
      this.cellSize
    );
  }

  floodfill() {
    const tiles = removeDuplicatesTilesFromArray(this.rooms.flat());
    const rooms: Room[] = [];

    const addNeighboursToRegion = (tile: Tile, region: Room) => {
      const neighbours = getNeighbourTiles(tiles, tile);
      neighbours.forEach((neighbour) => {
        if (!tileExistsInArray(region, neighbour)) {
          region.push(neighbour);
          removeTileFromArray(tiles, neighbour);
          addNeighboursToRegion(neighbour, region);
        }
      });
    };

    while (tiles.length > 0) {
      const room: Room = [];
      const startTile = tiles[0];

      room.push(startTile);
      removeTileFromArray(tiles, startTile);
      addNeighboursToRegion(startTile, room);

      rooms.push(room);
    }

    return rooms;
  }

  floodFillDebug() {
    const size = this.cellSize / 2;

    this.floodfill().forEach((room) => {
      const fill = new Display.Color().random().color32;

      room.forEach((tile) => {
        this.graphics.fillStyle(fill, 0.5);
        this.graphics.fillRect(
          tile.x * this.cellSize + this.cellSize / 2 - size / 2,
          tile.y * this.cellSize + this.cellSize / 2 - size / 2,
          size,
          size
        );
      });
    });
  }

  detectEdges() {
    const roomsEdges: Room[] = [];
    this.floodfill().forEach((room) => {
      const edgesTiles: Tile[] = [];

      // If a tile has less than 4 neighbours, we consider it an edge tile.
      // getNeighbourTiles looks for cardinal neighbours and not diagonal neighbours.
      room.forEach((tile) => {
        if (getNeighbourTiles(room, tile).length < 4) {
          edgesTiles.push(tile);
        }
      });

      roomsEdges.push(edgesTiles);
    });

    return roomsEdges;
  }

  detectEdgesDebug() {
    const size = this.cellSize * 0.75;

    const edges = this.detectEdges();
    edges.forEach((room) => {
      const fill = new Display.Color().random().color32;

      room.forEach((tile) => {
        this.graphics.fillStyle(fill, 0.5);
        this.graphics.fillRect(
          tile.x * this.cellSize + this.cellSize / 2 - size / 2,
          tile.y * this.cellSize + this.cellSize / 2 - size / 2,
          size,
          size
        );
      });
    });

    return edges;
  }

  connectRooms() {
    const roomsEdges = this.detectEdges();

    // Now find find every room closest room
    for (let a = roomsEdges.length - 1; a >= 0; a--) {
      const roomA = roomsEdges[a];
      let closestDistanceBetweenRoom = Infinity;
      let closestTilesBetweenRoom: Tile[] = [];

      for (let b = 0; b < roomsEdges.length; b++) {
        if (a === b) {
          continue;
        }

        const roomB = roomsEdges[b];

        roomA.forEach((tileA) => {
          roomB.forEach((tileB) => {
            const distance = tileA.distance(tileB);
            if (distance < closestDistanceBetweenRoom) {
              closestDistanceBetweenRoom = distance;
              closestTilesBetweenRoom = [tileA, tileB];
            }
          });
        });
      }

      if (closestTilesBetweenRoom.length > 0) {
        this.createCorridor(
          closestTilesBetweenRoom[0],
          closestTilesBetweenRoom[1]
        );

        roomsEdges.splice(a);
      }
    }
  }

  createCorridor(from: Tile, to: Tile) {
    const corridor: Tile[] = [];

    const position = from.clone();

    while (position.y !== to.y) {
      if (to.y > position.y) {
        position.y += 1;
      } else {
        position.y -= 1;
      }

      if (!position.equals(to)) {
        corridor.push(position.clone());
      }
    }

    while (position.x !== to.x) {
      if (to.x > position.x) {
        position.x += 1;
      } else {
        position.x -= 1;
      }

      if (!position.equals(to)) {
        corridor.push(position.clone());
      }
    }

    corridor.forEach((tile) => {
      this.graphics.fillStyle(COLOR_PALETTE.FLOOR, 0.75);
      this.graphics.fillRect(
        tile.x * this.cellSize,
        tile.y * this.cellSize,
        this.cellSize,
        this.cellSize
      );
    });
  }

  connectRoomsDebug() {
    let roomsEdges = this.detectEdges();

    const test: { id: number; tiles: Tile[] }[] = roomsEdges.map((r, i) => ({
      id: i,
      tiles: r,
    }));

    // Now find find every room closest room
    for (let a = test.length - 1; a >= 0; a--) {
      const roomA = test[a];
      let closestDistanceBetweenRoom = Infinity;
      let closestTilesBetweenRoom: Tile[] = [];

      for (let b = 0; b < test.length; b++) {
        if (a === b) {
          continue;
        }

        const roomB = test[b];

        roomA.tiles.forEach((tileA) => {
          roomB.tiles.forEach((tileB) => {
            const distance = tileA.distance(tileB);

            if (distance < closestDistanceBetweenRoom) {
              closestDistanceBetweenRoom = distance;
              closestTilesBetweenRoom = [tileA, tileB];
            }
          });
        });
      }

      if (closestTilesBetweenRoom.length > 0) {
        this.createCorridor(
          closestTilesBetweenRoom[0],
          closestTilesBetweenRoom[1]
        );

        const size = this.cellSize / 2;
        const fill = new Display.Color().random().color32;
        closestTilesBetweenRoom.forEach((tile) => {
          this.graphics.fillStyle(fill, 1);
          this.graphics.fillRect(
            tile.x * this.cellSize + this.cellSize / 2 - size / 2,
            tile.y * this.cellSize + this.cellSize / 2 - size / 2,
            size,
            size
          );
        });

        test.splice(a);
      }
    }
  }

  polylabel() {
    this.detectEdges().forEach((room, i) => {
      room.forEach(({ x, y }, i) => {
        this.add.text(
          Math.round(x) * this.cellSize,
          Math.round(y) * this.cellSize,
          i.toString(),
          {
            color: "black",
            backgroundColor: "white",
          }
        );
      });
    });
  }

  noise() {
    const noise = createNoise2D();
    this.graphics.clear();

    this.rooms = [];

    for (let x = 0; x < this.scale.width / this.cellSize; x++) {
      for (let y = 0; y < this.scale.height / this.cellSize; y++) {
        const n = map(
          noise(x * this.noiseScale, y * this.noiseScale),
          -1,
          1,
          0,
          1
        );
        if (n >= this.noiseThreshold) {
          this.rooms.push([new MathUtils.Vector2(x, y)]);
        }
      }
    }

    this.renderRooms();
  }
}
