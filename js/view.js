(function () {
  window.Sokoban = window.Sokoban || {};

  var View = Sokoban.View = function ($el) {
    this.$el = $el;
    this.game = new Sokoban.Game();
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
    for (var i = 0; i < this.game.grid.length; i++) {
      this.$el.find('li').eq(i).html(this.game.grid[i]);
      // console.log(this.game.grid[i]);
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

    if (keynum == 37 || keynum == 100 || keynum == 65) { this.game.move(Sokoban.Game.WEST); this.render(); return false; }
    if (keynum == 39 || keynum == 102 || keynum == 68) { this.game.move(Sokoban.Game.EAST); this.render(); return false; }
    if (keynum == 38 || keynum == 104 || keynum == 87) { this.game.move(Sokoban.Game.NORTH); this.render(); return false; }
    if (keynum == 40 || keynum ==  98 || keynum == 83) { this.game.move(Sokoban.Game.SOUTH); this.render(); return false; }


    return true;
  };
})();
