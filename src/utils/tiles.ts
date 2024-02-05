import type { Tile } from "../types";

function removeDuplicatesTilesFromArray(array: Tile[]) {
  return array.filter(
    (value, index, self) =>
      index === self.findIndex((t) => t.x === value.x && t.y === value.y)
  );
}

const removeTileFromArray = (array: Tile[], tile: Tile) => {
  // Find tile index in collection.
  // This returns the index of first entry where x and y coordinates matches
  // so might yeld unexpected results if initial array contains dupes.
  const tileIndex = array.findIndex((t) => t.x === tile.x && t.y === tile.y);

  if (tileIndex > -1) {
    array.splice(tileIndex, 1);
  }
};

const getTileAt = (tiles: Tile[], x: number, y: number) =>
  tiles.find((t) => t.x === x && t.y === y);

const getNeighbourTiles = (array: Tile[], tile: Tile) => {
  const neighbours: Tile[] = [];

  const top = getTileAt(array, tile.x, tile.y - 1);
  if (top) {
    neighbours.push(top);
  }

  const bottom = getTileAt(array, tile.x, tile.y + 1);
  if (bottom) {
    neighbours.push(bottom);
  }

  const left = getTileAt(array, tile.x - 1, tile.y);
  if (left) {
    neighbours.push(left);
  }

  const right = getTileAt(array, tile.x + 1, tile.y);
  if (right) {
    neighbours.push(right);
  }

  return neighbours;
};

const tileExistsInArray = (array: Tile[], tile: Tile) =>
  Boolean(getTileAt(array, tile.x, tile.y));

export {
  removeDuplicatesTilesFromArray,
  removeTileFromArray,
  getNeighbourTiles,
  getTileAt,
  tileExistsInArray,
};
