(function() {
  var FPS, Field, Lifegame, isTouchDevice;

  FPS = 10;

  isTouchDevice = function() {
    return typeof window.ontouchstart !== 'undefined';
  };

  Field = (function() {

    function Field(width, height) {
      var i;
      this.width = width;
      this.height = height;
      this.datas = (function() {
        var _i, _ref, _results;
        _results = [];
        for (i = _i = 0, _ref = this.width * this.height; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
          _results.push(0);
        }
        return _results;
      }).call(this);
    }

    Field.prototype.get = function(x, y) {
      if (!((0 <= x && x < this.width))) {
        x = (x + this.width) % this.width;
      }
      if (!((0 <= y && y < this.height))) {
        y = (y + this.height) % this.height;
      }
      return this.datas[y * this.width + x];
    };

    Field.prototype.set = function(x, y, v) {
      if (!((0 <= x && x < this.width))) {
        x = (x + this.width) % this.width;
      }
      if (!((0 <= y && y < this.height))) {
        y = (y + this.height) % this.height;
      }
      return this.datas[y * this.width + x] = v;
    };

    return Field;

  })();

  Lifegame = (function() {

    function Lifegame(container, lifeContainer) {
      // console.log('call')
      var cell, x, y, _i, _j, _ref, _ref1,
        _this = this;
      // console.log(container)
      this.container = container;
      this.lifeContainer = lifeContainer;
      this.PIXEL_SIZE = 64;
      this.width = Math.ceil(this.container.width() / this.PIXEL_SIZE);
      this.height = Math.ceil(this.container.height() / this.PIXEL_SIZE);
      // console.log(this.width, this.height)
      this.lifes = new Field(this.width, this.height);
      this.nextLifes = new Field(this.width, this.height);
      if (isTouchDevice()) {
        this.container.live("touchmove", function(e) {
          var touch, _i, _len, _ref, _results;
          _ref = e.originalEvent.touches;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            touch = _ref[_i];
            _results.push(_this.setByMouse(touch.pageX, touch.pageY - 437, 1));
          }
          return _results;
        });
      } else {
        this.container.mousemove(function(e) {
          return _this.setByMouse(e.pageX, e.pageY - 437, 1);
        });
      }
      this.container.mousewheel(function(e, delta, deltaX, deltaY) {
        return _this.setByMouse(e.pageX, e.pageY - 437, 1);
      });
      this.isPause = false;
      $(window).blur(function(e) {
        return _this.isPause = true;
      });
      $(window).focus(function(e) {
        return _this.isPause = false;
      });
      this.divs = [];
      for (y = _i = 0, _ref = this.height; 0 <= _ref ? _i < _ref : _i > _ref; y = 0 <= _ref ? ++_i : --_i) {
        for (x = _j = 0, _ref1 = this.width; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; x = 0 <= _ref1 ? ++_j : --_j) {
          this.divs[y * this.width + x] = cell = $('<div id="X' + x + 'Y' + y + '"></div>').appendTo(this.lifeContainer);
          cell.css('position', 'absolute').css('width', this.PIXEL_SIZE).css('height', this.PIXEL_SIZE).css('left', x * this.PIXEL_SIZE).css('top', y * this.PIXEL_SIZE + 437).css('background-color', '#FFFFFF').css('display', 'none');
        }
      }
      setInterval((function() {
        return _this.update();
      }), 1000 / FPS);
    }

    Lifegame.prototype.setByMouse = function(mouseX, mouseY, v) {
      var x, y;
      if (this.isPause) {
        return;
      }
      if (!(mouseX && mouseY)) {
        return;
      }
      x = Math.floor(mouseX / this.PIXEL_SIZE);
      y = Math.floor(mouseY / this.PIXEL_SIZE);
      if ((0 <= x && x < this.width) && (0 <= y && y < this.height)) {
        this.lifes.set(x, y, v);
        return this.divs[y * this.width + x].css('display', 'block');
      }
    };

    Lifegame.prototype.update = function() {
      var count, life, nextLife, x, xo, y, yo, _i, _j, _k, _l, _ref, _ref1, _ref2;
      if (this.isPause) {
        return;
      }
      for (y = _i = 0, _ref = this.height; 0 <= _ref ? _i < _ref : _i > _ref; y = 0 <= _ref ? ++_i : --_i) {
        for (x = _j = 0, _ref1 = this.width; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; x = 0 <= _ref1 ? ++_j : --_j) {
          count = 0;
          for (yo = _k = -1; _k <= 1; yo = ++_k) {
            for (xo = _l = -1; _l <= 1; xo = ++_l) {
              count += this.lifes.get(x + xo, y + yo);
            }
          }
          nextLife = 0;
          life = this.lifes.get(x, y);
          if (life === 0) {
            if (count === 3) {
              nextLife = 1;
            }
          } else {
            if ((3 <= count && count <= 4)) {
              nextLife = 1;
            }
          }
          this.nextLifes.set(x, y, nextLife);
          if (life !== nextLife) {
            if (nextLife === 0) {
              this.divs[y * this.width + x].css('display', 'none');
            } else {
              this.divs[y * this.width + x].css('display', 'block');
            }
          }
        }
      }
      return _ref2 = [this.nextLifes, this.lifes], this.lifes = _ref2[0], this.nextLifes = _ref2[1], _ref2;
    };

    return Lifegame;

  })();

  window.Lifegame = Lifegame;

}).call(this);
