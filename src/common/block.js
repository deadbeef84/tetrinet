export default class Block {
  constructor ({x = 0, y = 0, type = 0, rotation = 0} = {}) {
    this.x = x
    this.y = y
    this.type = type % numBlockTypes
    this.setRotation(rotation)
  }

  rotate (r) {
    this.setRotation(this.rotation + r)
  }

  setRotation (r) {
    const numRotations = blockData[this.type].length
    if (r < 0) {
      r = numRotations + r
    }
    this.rotation = r % numRotations
  }

  getData () {
    return blockData[this.type][this.rotation]
  }

  getCoords () {
    return this.getData().map(([px, py]) => [this.x + px, this.y + py])
  }

  getBoundingBox () {
    const xs = this.getData().map(([x]) => x)
    const ys = this.getData().map(([, y]) => y)
    return {
      minx: Math.min(...xs),
      maxx: Math.max(...xs),
      miny: Math.min(...ys),
      maxy: Math.max(...ys)
    }
  }

  hasPieceAt (x, y) {
    const lx = x - this.x
    const ly = y - this.y
    return this.getData().some(([px, py]) => lx === px && ly === py)
  }

}

export const blockData = [
  // O
  [[[1, 0], [2, 0], [1, 1], [2, 1]]],
  // I
  [
    [[0, 1], [1, 1], [2, 1], [3, 1]],
    [[2, 0], [2, 1], [2, 2], [2, 3]],
    [[0, 2], [1, 2], [2, 2], [3, 2]],
    [[1, 0], [1, 1], [1, 2], [1, 3]]
  ],
  // T
  [
    [[1, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [1, 2]],
    [[1, 0], [0, 1], [1, 1], [1, 2]]
  ],
  // L
  [
    [[2, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [1, 1], [1, 2], [2, 2]],
    [[0, 1], [1, 1], [2, 1], [0, 2]],
    [[0, 0], [1, 0], [1, 1], [1, 2]]
  ],
  // J
  [
    [[0, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [2, 2]],
    [[1, 0], [1, 1], [0, 2], [1, 2]]
  ],
  // Z
  [
    [[0, 0], [1, 0], [1, 1], [2, 1]],
    [[2, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [1, 2], [2, 2]],
    [[1, 0], [0, 1], [1, 1], [0, 2]]
  ],
  // S
  [
    [[1, 0], [2, 0], [0, 1], [1, 1]],
    [[1, 0], [1, 1], [2, 1], [2, 2]],
    [[1, 1], [2, 1], [0, 2], [1, 2]],
    [[0, 0], [0, 1], [1, 1], [1, 2]]
  ]
]

export const numBlockTypes = blockData.length
