class Cell {
  constructor(index) {
    this._index = index;
    this._type = '';
    this._isRevealed = false;
  }

  get index() {
    return this._index;
  }

  get type() {
    return this._type;
  }

  get isRevealed() {
    return this._isRevealed;
  }

  reveal() {
    this._isRevealed = true;
  }
}

class EmptyCell extends Cell {
  constructor(index) {
    super(index);
    this._type = 'empty';
  }

  get adjacentCellIndexes() {
    return this._adjacentCellIndexes;
  }

  set adjacentCellIndexes(adjCellIdx) {
    this._adjacentCellIndexes = adjCellIdx;
  }
}

class BombCell extends Cell {
  constructor(index) {
    super(index);
    this._type = 'bomb';
  }
}

class NumberCell extends Cell {
  constructor(index) {
    super(index);
    this._type = 'number';
    this._number = 1;
  }

  get number() {
    return this._number;
  }

  increment() {
    ++this._number;
  }
}

class Board {
  init(width, height, bombs) {
    this._width = width;
    this._height = height;
    this._size = width * height;
    this._bombs = bombs;
    this._cells = [];
    this._lastRevealedCells = [];
    this._allRevealedCells = [];
  }

  get width() {
    return this._width;
  }

  get height() {
    return this._height;
  }

  get size() {
    return this._size;
  }

  get lastRevealedCells() {
    return this._lastRevealedCells;
  }

  get allRevealedCells() {
    return this._allRevealedCells;
  }

  // Completely randomly place bombs,
  // then number cells adjacent to bombs,
  // then fill empty cells
  generate(initialIndex) {
    // place bombs
    let bombsPlaced = 0;
    while (bombsPlaced < this._bombs) {
      let bombIndex = Math.floor((Math.random() * this._width * this._height));
      if (bombIndex !== initialIndex && !this._cells[bombIndex]) {
        this._cells[bombIndex] = new BombCell(bombIndex);
        ++bombsPlaced;
      }
    }

    // number cells adjacent to bombs
    // note: we duplicate the array so as to not accidentally traverse
    //       newly added cells
    const bombCells = this._cells.slice();
    bombCells.forEach((cell) => {
      let adjacentCellIndexes = this._getAdjacentCellIndexes(cell.index);
      adjacentCellIndexes.forEach((index) => {
        if (!this._cells[index]) {
          this._cells[index] = new NumberCell(index);
        } else if (this._cells[index].type === 'number') {
          this._cells[index].increment();
        }
      });
    });

    // fill empty cells
    for (let i = 0; i < this._size; ++i) {
      if (!this._cells[i]) {
        this._cells[i] = new EmptyCell(i);
        this._cells[i].adjacentCellIndexes = this._getAdjacentCellIndexes(i);
      }
    }
  }

  _getAdjacentCellIndexes(index) {
    let adjacentCellIndexes = [];

    // cell is to the left edge of the grid
    if (index % this._width !== 0) {
      // left
      adjacentCellIndexes.push(index - 1);
      // top left
      if (index - this._width >= 0) {
        adjacentCellIndexes.push(index - 1 - this._width);
      }
      // bottom left
      if (index + this._width < this._size) {
        adjacentCellIndexes.push(index - 1 + this._width);
      }
    }

    // cell is to the right edge of the grid
    if ((index + 1) % this._width !== 0) {
      // right
      adjacentCellIndexes.push(index + 1);
      // top right
      if (index - this._width >= 0) {
        adjacentCellIndexes.push(index + 1 - this._width);
      }
      // bottom right
      if (index + this._width < this._size) {
        adjacentCellIndexes.push(index + 1 + this._width);
      }
    }

    // cell is to the top of the grid
    if (index - this._width >= 0) {
      adjacentCellIndexes.push(index - this._width);
    }

    // cell is to the bottom edge of the grid
    if (index + this._width < this._size) {
      adjacentCellIndexes.push(index + this._width);
    }

    return adjacentCellIndexes;
  }

  revealCell(index) {
    this._lastRevealedCells = [];
    this._revealCell(index);
  }

  _revealCell(index) {
    if (!this._cells[index].isRevealed) {
      this._lastRevealedCells.push(this._cells[index]);
      this._allRevealedCells.push(this._cells[index]);
      this._cells[index].reveal();
      if (this._cells[index].type === 'empty') {
        this._cells[index].adjacentCellIndexes.forEach((childIndex) => {
          this._revealCell(childIndex);
        });
      }
    }
  }

  getCell(index) {
    return this._cells[index];
  }
}

module.exports = { Board }
