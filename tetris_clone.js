// Tetris,
// based on TetrisClone by FouFou,
// jaws by ippa, and
// MicroTetris by Tromp, Nilsson.

'use strict';

var tetris_clone = function (jaws) {
    // abbreviations
    var tl = { row: -1, col: -1 }; // top left
    var tc = { row: -1, col: 0 }; // top center
    var tr = { row: -1, col: 1 }; // top right
    var ml = { row: 0, col: -1 }; // middle left
    var mr = { row: 0, col: 1 }; // middle right
    var bl = { row: 1, col: -1 }; // bottom left
    var bc = { row: 1, col: 0 }; // bottom center
    var br = { row: 1, col: 1 }; // bottom right

    // a convenience constructor.
    var shape = function (n, c) {
	return { next: n, cells: c };
    }

    // we use row, col and fillRect uses x, y
    // x is col and y is row
    var drawSquare = function (row, col) {
	jaws.context.fillRect(col, row, 1, 1);
    }

    // some magic numbers
    var initial_row = 1;
    var initial_col = 4;
    var frames_per_drop = 10;

    return {
	width: 10,
	height: 18,
	cellwidth: 8,
	running: true,
	cycle: 0,
	completed_rows: 0,
	row: initial_row,
	col: initial_col,
	shapes: [
	    shape(7, [tl, tc, mr]),
	    shape(8, [tr, tc, ml]),
	    shape(9, [ml, mr, bc]),
	    shape(3, [tl, tc, ml]),
	    shape(12, [ml, bl, mr]),
	    shape(15, [ml, br, mr]),
	    shape(18, [ml, mr, { row: 0, col: 2 }]),
	    shape(0, [tc, ml, bl]),
	    shape(1, [tc, mr, br]),
	    shape(10, [tc, mr, bc]),
	    shape(11, [tc, ml, mr]),
	    shape(2, [tc, ml, bc]),
	    shape(13, [tc, bc, br]),
	    shape(14, [tr, ml, mr]),
	    shape(4, [tl, tc, bc]),
	    shape(16, [tr, tc, bc]),
	    shape(17, [tl, mr, ml]),
	    shape(5, [tc, bc, bl]),
	    shape(6, [tc, bc, { row: 2, col: 0 }])
	],
	setTile: function () {
	    this.tile = Math.floor(Math.random() * (7 + 1));
	},
	newMap: function () {
	    this.map = [];
	    for (var row = 0; row < this.height; ++row) {
		this.map.push([]);
		for (var col = 0; col < this.height; ++col) {
		    this.map[row].push(0);
		}
	    }
	},
	drawPassive: function () {
	    for (var row = 0; row < this.height; ++row) {
		for (var col = 0; col < this.width; ++col) {
		    jaws.context.fillStyle =
			this.map[row][col] ? 'gray' : 'black';
		    drawSquare(row, col);
		}
	    }
	},
	drawActive: function () {
	    jaws.context.fillStyle = 'deeppink';
	    var cells = this.shapes[this.tile].cells;
	    cells.push({ row: 0, col: 0}); // center is always there
	    for (var i in cells) {
		drawSquare(this.row + cells[i].row +
			   (this.cycle / frames_per_drop) - 1, // smoother descent
			   this.col + cells[i].col);
	    }
	},
	checkCollision: function () {
	    var cells = this.shapes[this.tile].cells;
	    cells.push({ row: 0, col: 0}); // center is always there
	    for (var i in cells) {
		var row = this.row + cells[i].row;
		var col = this.col + cells[i].col;
		if (row >= this.height) {
		    return true;
		}
		if (col < 0 || col >= this.width) {
		    return true;
		}
		// note: we're depending on the falsyness of 0
		if (this.map[row][col]) {
		    return true;
		}
	    }
	    return false;
	},
	checkForRow: function () {
	    var to_clear = new Array();
	    for (var row = 0; row < this.height - 1; ++row) {
		var isRow = true;
		for (var col = 0; col < this.width; ++col) {
		    if (this.map[row][col] == 0) {
			isRow = false;
			break;
		    }
		}
		if (isRow) {
		    to_clear.unshift(row);
		    ++(this.completed_rows);
		}
	    }
	    var cleared = 0;
	    for (var row = this.height; row > -1; ) {
		if (row != to_clear[cleared] - cleared) {
		    row -= 1;
		    continue; // Neeeeeext
		}
		// move everything above down one
		for (var row_2 = row; row_2 > 0; --row_2) {
		    for (var col = 0; col < this.width; ++col) {
			this.map[row_2][col] = this.map[row_2 - 1][col];
		    }
		}
		// the new row at the top is empty
		for (var col = 0; col < this.width; ++col) {
		    this.map[0][col] = 0;
		}
		cleared += 1;
	    }
	},
	moveDown: function () {
	    ++this.row;
	    if (!this.checkCollision()) {
		return;
	    }
	    --this.row; // fix up
	    // lock active piece into place
	    this.map[this.row][this.col] = 2;
	    var cells = this.shapes[this.tile].cells;
	    for (var i in cells) {
		this.map[this.row + cells[i].row][this.col + cells[i].col] = 2;
	    }
	    // get a new piece
	    this.setTile();
	    // jump back to start
	    this.row = initial_row;
	    this.col = initial_col;
	    if (this.checkCollision()) {
		alert("Game Over");
		this.running = false;
		return;
	    }
	    this.checkForRow();
	},
	moveRight: function () {
	    ++this.col;
	    if (this.checkCollision()) {
		--this.col; // fix up
	    }
	},
	moveLeft: function () {
	    --this.col;
	    if (this.checkCollision()) {
		++this.col; // fix up
	    }
	},
	rotate: function () {
	    var old = this.tile;
	    this.tile = this.shapes[this.tile].next;
	    if (this.checkCollision()) {
		this.tile = old; // fix up
	    }
	},
	// called by jaws as part of jaws.start
	setup: function () {
	    // We bind the current this to a local variable.
	    // so we can use it in callbacks.
	    // It's a standard workaround for an awkward aspect of javascript.
	    var that = this;
	    
	    this.setTile();
	    this.newMap();
	    jaws.preventDefaultKeys(["up", "down", "left", "right"]);
	    jaws.on_keydown("up",  function () { that.rotate(); });
	    jaws.on_keydown("down",  function () { that.moveDown(); });
	    jaws.on_keydown("left",  function () { that.moveLeft(); });
	    jaws.on_keydown("right",  function () { that.moveRight(); });

	    var background = new Image();
	    background.src = 'background1.png';
	    jaws.context.drawImage(background, 0, 0);
	},
	// called periodically by jaws
	draw: function () {	
	    if (this.running) {
		jaws.context.save();
		jaws.context.translate(
		    (jaws.width - this.width * this.cellwidth) / 2,
		    (jaws.height - this.height * this.cellwidth) / 2);
		jaws.context.scale(this.cellwidth, this.cellwidth);
		jaws.context.beginPath();
		jaws.context.rect(0, 0, this.width, this.height);
		jaws.context.clip();
		this.drawPassive();
		this.drawActive();
		jaws.context.restore();
	    }
	},
	// called periodically by jaws
	update: function () {
	    if (this.running) {
		++this.cycle;
		if (this.cycle >= frames_per_drop) {
		    this.cycle = 0;
		    this.moveDown();	
		}
	    }
	}
    };
};

    


