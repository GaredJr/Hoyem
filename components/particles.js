document.addEventListener('DOMContentLoaded', function () {
  particleground(document.getElementById('particles'), {
    dotColor: '#353535',
    lineColor: '#353535',
    minSpeedX: 0.02,
    maxSpeedX: 0.12,
    minSpeedY: 0.02,
    maxSpeedY: 0.12,
    parallaxMultiplier: 25
  });

  var intro = document.getElementById('intro');
  if (intro) intro.style.marginTop = -intro.offsetHeight / 2 + 'px';
}, false);

;(function(window, document) {
  "use strict";
  var pluginName = 'particleground';

  function extend(out) {
    out = out || {};
    for (var i = 1; i < arguments.length; i++) {
      var obj = arguments[i];
      if (!obj) continue;
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) out[key] = obj[key];
      }
    }
    return out;
  }

  var $ = window.jQuery;

  function Plugin(element, options) {
    var canvasSupport = !!document.createElement('canvas').getContext;
    var canvas, ctx;
    var particles = [];
    var raf;
    var mouseX = 0, mouseY = 0;
    var winW, winH;
    var desktop = !navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry|BB10|mobi|tablet|opera mini|nexus 7)/i);
    var orientationSupport = !!window.DeviceOrientationEvent;
    var tiltX = 0, tiltY = 0;
    var pointerX = 0, pointerY = 0;
    var paused = false;

    options = extend({}, window[pluginName].defaults, options);

    function init() {
      if (!canvasSupport) return;

      canvas = document.createElement('canvas');
      canvas.className = 'pg-canvas';
      canvas.style.display = 'block';
      element.insertBefore(canvas, element.firstChild);
      ctx = canvas.getContext('2d');
      styleCanvas();

      var numParticles = Math.round((canvas.width * canvas.height) / options.density);
      for (var i = 0; i < numParticles; i++) {
        var p = new Particle();
        p.setStackPos(i);
        particles.push(p);
      }

      window.addEventListener('resize', resizeHandler, false);

      document.addEventListener('mousemove', function(e) {
        mouseX = e.pageX;
        mouseY = e.pageY;
      }, false);

      if (orientationSupport && !desktop) {
        window.addEventListener('deviceorientation', function (event) {
          tiltY = Math.min(Math.max(-event.beta, -30), 30);
          tiltX = Math.min(Math.max(-event.gamma, -30), 30);
        }, true);
      }

      draw();
      hook('onInit');
    }

    function styleCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.fillStyle = options.dotColor;
      ctx.strokeStyle = options.lineColor;
      ctx.lineWidth = options.lineWidth;
    }

    function draw() {
      if (!canvasSupport) return;

      winW = window.innerWidth;
      winH = window.innerHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (var i = 0; i < particles.length; i++) particles[i].updatePosition();
      for (var j = 0; j < particles.length; j++) particles[j].draw();

      if (!paused) raf = requestAnimationFrame(draw);
    }

    function resizeHandler() {
      styleCanvas();

      var elWidth = canvas.width;
      var elHeight = canvas.height;

      for (var i = particles.length - 1; i >= 0; i--) {
        if (particles[i].position.x > elWidth || particles[i].position.y > elHeight) {
          particles.splice(i, 1);
        }
      }

      var numParticles = Math.round((canvas.width * canvas.height) / options.density);
      if (numParticles > particles.length) {
        while (numParticles > particles.length) particles.push(new Particle());
      } else if (numParticles < particles.length) {
        particles.splice(numParticles);
      }

      for (i = particles.length - 1; i >= 0; i--) particles[i].setStackPos(i);
    }

    function pause() { paused = true; }
    function start() { paused = false; draw(); }

    function Particle() {
      this.stackPos = 0;
      this.layer = Math.ceil(Math.random() * 3);
      this.parallaxOffsetX = 0;
      this.parallaxOffsetY = 0;

      this.position = {
        x: Math.ceil(Math.random() * canvas.width),
        y: Math.ceil(Math.random() * canvas.height)
      };

      this.speed = {};

      switch (options.directionX) {
        case 'left':
          this.speed.x = +(-options.maxSpeedX + (Math.random() * options.maxSpeedX) - options.minSpeedX).toFixed(3);
          break;
        case 'right':
          this.speed.x = +((Math.random() * options.maxSpeedX) + options.minSpeedX).toFixed(3);
          break;
        default:
          this.speed.x = +((-options.maxSpeedX / 2) + (Math.random() * options.maxSpeedX)).toFixed(3);
          this.speed.x += this.speed.x > 0 ? options.minSpeedX : -options.minSpeedX;
          break;
      }

      switch (options.directionY) {
        case 'up':
          this.speed.y = +(-options.maxSpeedY + (Math.random() * options.maxSpeedY) - options.minSpeedY).toFixed(3);
          break;
        case 'down':
          this.speed.y = +((Math.random() * options.maxSpeedY) + options.minSpeedY).toFixed(3);
          break;
        default:
          this.speed.y = +((-options.maxSpeedY / 2) + (Math.random() * options.maxSpeedY)).toFixed(3);
          this.speed.y += this.speed.y > 0 ? options.minSpeedY : -options.minSpeedY;
          break;
      }
    }

    Particle.prototype.draw = function() {
      ctx.beginPath();
      ctx.arc(
        this.position.x + this.parallaxOffsetX,
        this.position.y + this.parallaxOffsetY,
        options.particleRadius / 2,
        0,
        Math.PI * 2,
        true
      );
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      for (var i = particles.length - 1; i > this.stackPos; i--) {
        var p2 = particles[i];
        var a = this.position.x - p2.position.x;
        var b = this.position.y - p2.position.y;
        var dist = Math.sqrt((a * a) + (b * b));

        if (dist < options.proximity) {
          ctx.moveTo(this.position.x + this.parallaxOffsetX, this.position.y + this.parallaxOffsetY);
          if (options.curvedLines) {
            ctx.quadraticCurveTo(
              p2.position.x,
              p2.position.y,
              p2.position.x + p2.parallaxOffsetX,
              p2.position.y + p2.parallaxOffsetY
            );
          } else {
            ctx.lineTo(p2.position.x + p2.parallaxOffsetX, p2.position.y + p2.parallaxOffsetY);
          }
        }
      }
      ctx.stroke();
      ctx.closePath();
    };

    Particle.prototype.updatePosition = function() {
      if (options.parallax) {
        if (orientationSupport && !desktop) {
          var ratioX = winW / 60;
          pointerX = (tiltX + 30) * ratioX;
          var ratioY = winH / 60;
          pointerY = (tiltY + 30) * ratioY;
        } else {
          pointerX = mouseX;
          pointerY = mouseY;
        }

        this.parallaxTargX = (pointerX - (winW / 2)) / (options.parallaxMultiplier * this.layer);
        this.parallaxOffsetX += (this.parallaxTargX - this.parallaxOffsetX) / 25;

        this.parallaxTargY = (pointerY - (winH / 2)) / (options.parallaxMultiplier * this.layer);
        this.parallaxOffsetY += (this.parallaxTargY - this.parallaxOffsetY) / 25;
      }

      var elWidth = canvas.width;
      var elHeight = canvas.height;

      switch (options.directionX) {
        case 'left':
          if (this.position.x + this.speed.x + this.parallaxOffsetX < 0) this.position.x = elWidth - this.parallaxOffsetX;
          break;
        case 'right':
          if (this.position.x + this.speed.x + this.parallaxOffsetX > elWidth) this.position.x = 0 - this.parallaxOffsetX;
          break;
        default:
          if (this.position.x + this.speed.x + this.parallaxOffsetX > elWidth || this.position.x + this.speed.x + this.parallaxOffsetX < 0) {
            this.speed.x = -this.speed.x;
          }
          break;
      }

      switch (options.directionY) {
        case 'up':
          if (this.position.y + this.speed.y + this.parallaxOffsetY < 0) this.position.y = elHeight - this.parallaxOffsetY;
          break;
        case 'down':
          if (this.position.y + this.speed.y + this.parallaxOffsetY > elHeight) this.position.y = 0 - this.parallaxOffsetY;
          break;
        default:
          if (this.position.y + this.speed.y + this.parallaxOffsetY > elHeight || this.position.y + this.speed.y + this.parallaxOffsetY < 0) {
            this.speed.y = -this.speed.y;
          }
          break;
      }

      this.position.x += this.speed.x;
      this.position.y += this.speed.y;
    };

    Particle.prototype.setStackPos = function(i) { this.stackPos = i; };

    function option(key, val) {
      if (val !== undefined) options[key] = val;
      else return options[key];
    }

    function destroy() {
      if (raf) cancelAnimationFrame(raf);
      if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
      hook('onDestroy');
      if ($) $(element).removeData('plugin_' + pluginName);
    }

    function hook(hookName) {
      if (options[hookName] !== undefined) options[hookName].call(element);
    }

    init();

    return { option: option, destroy: destroy, start: start, pause: pause };
  }

  window[pluginName] = function(elem, options) {
    return new Plugin(elem, options);
  };

  window[pluginName].defaults = {
    minSpeedX: 0.02,
    maxSpeedX: 0.12,
    minSpeedY: 0.02,
    maxSpeedY: 0.12,
    directionX: 'center',
    directionY: 'center',
    density: 12000,
    dotColor: '#666666',
    lineColor: '#666666',
    particleRadius: 7,
    lineWidth: 1,
    curvedLines: false,
    proximity: 100,
    parallax: true,
    parallaxMultiplier: 25,
    onInit: function() {},
    onDestroy: function() {}
  };

  if ($) {
    $.fn[pluginName] = function(options) {
      if (typeof arguments[0] === 'string') {
        var methodName = arguments[0];
        var args = Array.prototype.slice.call(arguments, 1);
        var returnVal;
        this.each(function() {
          var inst = $.data(this, 'plugin_' + pluginName);
          if (inst && typeof inst[methodName] === 'function') {
            returnVal = inst[methodName].apply(this, args);
          }
        });
        return returnVal !== undefined ? returnVal : this;
      } else if (typeof options === "object" || !options) {
        return this.each(function() {
          if (!$.data(this, 'plugin_' + pluginName)) {
            $.data(this, 'plugin_' + pluginName, new Plugin(this, options));
          }
        });
      }
    };
  }
})(window, document);

(function() {
  var lastTime = 0;
  var vendors = ['ms', 'moz', 'webkit', 'o'];
  for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
    window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] ||
      window[vendors[x] + 'CancelRequestAnimationFrame'];
  }

  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function(callback) {
      var currTime = new Date().getTime();
      var timeToCall = Math.max(0, 16 - (currTime - lastTime));
      var id = window.setTimeout(function() { callback(currTime + timeToCall); }, timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };
  }

  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = function(id) { clearTimeout(id); };
  }
}());