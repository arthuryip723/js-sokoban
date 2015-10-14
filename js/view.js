(function () {
  window.Sokoban = window.Sokoban || {};

  var View = Sokoban.View = function ($el, level) {
    this.$el = $el;
    this.game = new Sokoban.Game(level);
    this.setupGrid();
    $(window).on('keydown', this.handleKeyPress.bind(this));
    // console.log("intializing...");
    this.render();
  };

  View.KEYS = {
    38: 'N',
    39: 'E',
    40: 'S',
    37: 'W'
  };

  View.prototype.setupGrid = function (event) {
    var str = ''
    for (var i = 0; i < this.game.height; i++) {
      str += '<ul>';
      for (var j = 0; j < this.game.width; j++) {
        str += '<li/>';
      }
      str += '</ul>';
    }

    this.$el.html(str);
  };

  View.prototype.render = function () {
    // use the $el here.
    // need to have width and height
    // debugger
    this.$el.find('li').removeClass();
    for (var i = 0; i < this.game.grid.length; i++) {
      // this.$el.find('li').eq(i).html(this.game.grid[i]);
      // console.log(this.game.grid[i]);
      var targetClass;
      switch (this.game.grid[i]) {
        case Sokoban.Game.NULL: targetClass = "soko-indent"; break;
        case Sokoban.Game.PLAYER: targetClass = "soko-worker"; break;
        case Sokoban.Game.BOX: targetClass = "soko-box"; break;
        case Sokoban.Game.WALL: targetClass = "soko-wall"; break;
        case Sokoban.Game.BASE: targetClass = "soko-base"; break;
        case (Sokoban.Game.BASE + Sokoban.Game.BOX): targetClass = "soko-box soko-base"; break;
        case (Sokoban.Game.BASE + Sokoban.Game.PLAYER): targetClass = "soko-worker"; break;
      }
      this.$el.find('li').eq(i).addClass(targetClass);
    }
  };

  View.prototype.handleKeyPress = function (event) {
    // console.log("pressed");
    // if (View.KEYS[event.keyCode]) {
    //
    // }

    var keynum;

    // if (sb == null) {
    //     return true;
    // }

    if (window.event) {
        keynum = event.keyCode;
    }
    else if (event.which) {
        keynum = e.which;
    }

    // if (keynum == 85) {
    //     sb.undo_move();
    //     return false;
    // }

    if (keynum == 37 || keynum == 100 || keynum == 65) { this.game.move(Sokoban.Game.WEST); this.render(); this.checkWon(); return false; }
    if (keynum == 39 || keynum == 102 || keynum == 68) { this.game.move(Sokoban.Game.EAST); this.render(); this.checkWon(); return false; }
    if (keynum == 38 || keynum == 104 || keynum == 87) { this.game.move(Sokoban.Game.NORTH); this.render(); this.checkWon(); return false; }
    if (keynum == 40 || keynum ==  98 || keynum == 83) { this.game.move(Sokoban.Game.SOUTH); this.render(); this.checkWon(); return false; }


    return true;
  };

  View.prototype.checkWon = function () {
    if (this.game.isWon() && !this.game.finished) {
      // $(window).off("keydown", this.handleKeyPress.bind(this));
      this.game.finished = true;
      alert("You win!");
    }
  };
})();
