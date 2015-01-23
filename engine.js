// Initial game settings.
// Override or alter these (we suggest you override in another js file)
var game = { 
  settings : {
    window_id      : "game_window",
    expectedWidth  : 1280,
    expectedHeight : 720,
    pixelScale     : 8, // 8 px to one unit at scale 1 
    scale          : 1,
    fps            : 60, // Target FPS
    allowSave      : false,
  },
  input : {
    keystateDown   : 0,
    keystateUp     : 1,
    KeyCodes : {
      Backspace    : 8,
      Tab          : 9,
      Enter        : 13,
      Shift        : 16,
      Ctrl         : 17,
      Alt          : 18,
      Esc          : 27,
      Space        : 32,
      Left         : 37,
      Up           : 38,
      Right        : 39,
      Down         : 40,
      A            : 65,
      D            : 68,
      S            : 83,
      W            : 87,
    },
    eventQueue : [],
    keyStates : Array(255),
  },
  assetQueue : [],
  assets : {images: {}, audio: {}},

  stack : [],
  audio : {
    music : null,
    sfx : [],
  },
  clearColor : "rgb(0, 0, 0)",
};

// Engine logic
// Create game loop using requestAnimationFrame
document.addEventListener("DOMContentLoaded", function(event) {
  initializeGame();
  //Create a friendly game loop
  // http://nokarma.org/2011/02/02/javascript-game-development-the-game-loop/
  (function() {
  var onEachFrame;
  if (window.requestAnimationFrame) {
    onEachFrame = function(cb) {
      var _cb = function () { cb(); requestAnimationFrame(_cb); }
      _cb();
    }
  } else if (window.webkitRequestAnimationFrame) {
    onEachFrame = function(cb) {
      var _cb = function() { cb(); webkitRequestAnimationFrame(_cb); }
      _cb();
    };
  } else if (window.mozRequestAnimationFrame) {
    onEachFrame = function(cb) {
      var _cb = function() { cb(); mozRequestAnimationFrame(_cb); }
      _cb();
    };
  } else {
    onEachFrame = function(cb) {
      setInterval(cb, 1000 / 60);
    }
  }
  window.onEachFrame = onEachFrame;
  })();
  
  window.onEachFrame(game.update);
});



// Register all assets and functions before calling initializeGame
function initializeGame()
{
  game.window = document.getElementById(game.settings.window_id);

  document.addEventListener('keydown', keyDown, false);
  document.addEventListener('keyup', keyUp, false);

  game.context = game.window.getContext("2d");
  resizeCanvas();
  
  game.assetCount = game.assetQueue.length;

  game.clear = (function()
  {
    this.context.fillStyle = this.clearColor;
    this.context.fillRect(0, 0, this.width, this.height);
  }).bind(game);

  game.clear();

  // drawing functions
  game.context.drawRotated = (function(image, x, y, angle) {
    // TODO: SCALE COORDINATES SOMEHOW
    this.save();
    this.translate(x+game.width/2, y+game.height/2);
    this.rotate(angle);
    this.drawImage(image, -(image.width/2), -(image.height/2));
    this.restore();
  }).bind(game.context);

  game.playMusic = (function(name)
  {
    if (game.music != null)
    {
      game.music.pause();
    }
    game.music = game.assets.audio[name];
    game.music.loop = true;
    game.music.play();
  }).bind(game);

  game.playEffect = (function(name)
  {
    var sfx = game.assets.audio[name];
    sfx.currentTime = 0;
    // game.sfx.push(sfx);
    sfx.play();
  }).bind(game);
  game.lastframe = (new Date).getTime();
  game.delta = 0;
  game.update = (function() {
    var loops = 0, skipTicks = 1000 / game.fps,
      maxFrameSkip = 10,
      nextGameTick = (new Date).getTime();
  
    return function() {
      loops = 0;
      if (game.stack.length > 0)
      {
        while ((new Date).getTime() > nextGameTick && loops < maxFrameSkip) {
          game.delta = (new Date).getTime() - game.lastframe;
          game.stack[game.stack.length-1].update();
          nextGameTick += skipTicks;
          loops++;
          game.lastframe = (new Date).getTime();
          // purge input queue
        }
    
        if(loops)
        {
          game.stack[game.stack.length-1].draw();
        }
      }
      else
      {
        //clear();
      }
    };
  })();
  //Will load all assets
  game.stack.push(startLoader());
};


function startLoader()
{
  var state = {};
  state.progress = 0;
  state.update = (function()
  {
    clear();
    this.progress = game.assetCount - assetQueue.length;
    //Get scale, should be about 80% of screen space by 10%
    if (assetQueue.length == 0)
    {
      popState();
      pushState(startGame());
    }
  }).bind(state);

  state.draw = (function()
  {
    var width = game.width * (4/5);
    var height = game.height / 10;
    game.context.fillStyle = "rgb(255, 255, 255)";
    game.context.fillRect((game.width/2)-(width/2)-1,(game.height/2)-(height/2)-1, width+1, height+1);
    game.context.fillStyle = "rgb(0, 196, 0)";
    game.context.fillRect((game.width/2)-(width/2), (game.height/2)-(height/2), width * (this.progress/game.assetCount),height);
  }).bind(state);
  //start load process
  loadAsset(assetQueue.shift());
  return state;
};

function loadAsset(description)
{
  var onload = function() {
    if (assetQueue.length > 0)
    {
      loadAsset(assetQueue.shift());
    }
  };

  if (description.type == "image")
  {
    var imageObj = new Image();
    imageObj.src = "img/" + description.name + ".png";
    imageObj.onload = onload;
    imageObj.onerror = function() {
      alert("Failed to load image " + imageObj.src);
    };
    game.assets.images[description.name] = imageObj;
  }
  else if (description.type == "audio")
  {
    var audioObj = new Audio();
    audioObj.src = "sfx/" + description.name + ".ogg";
    audioObj.oncanplaythrough = onload;
    audioObj.onerror = function() {
      alert("Failed to load audio " + audioObj.src);
    };
    game.assets.audio[description.name] = audioObj;
  }
  else {alert("Unknown content specified for load, aborting");}
}

function newObject()
{
  var obj = {x : 0, 
          y : 0, 
          z: 0
        };
  obj.draw = (function(){
            game.context.fillStyle = "rgb(255, 255, 255)";
            game.context.fillRect(this.x, this.y, 16, 16);
          }).bind(obj);
  obj.update = (function(){
            
          }).bind(obj);
  return obj;
};

//All states need two functions: update and draw
function pushState(state)
{
  game.stack.push(state);
};


function popState()
{
  game.stack.pop();
};

function zSort(a, b)
{
  return (a.z - b.z);
};

function keyUp(event)
{
  // Update state
  var keyCode = ('which' in event) ? event.which : event.keyCode;
  game.keyStates[keyCode] = KEYSTATE_UP;
  // Enque input
  game.inputEvents.push({state: KEYSTATE_UP, keyCode: keyCode});
};

function keyDown(event)
{
  var keyCode = ('which' in event) ? event.which : event.keyCode;
  game.keyStates[keyCode] = KEYSTATE_DOWN;
  game.inputEvents.push({state: KEYSTATE_DOWN, keyCode: keyCode});
};

function resizeCanvas() {
  game.window.width = window.innerWidth;
  game.window.height = window.innerHeight;
  game.width = game.context.canvas.clientWidth;
  game.height = game.context.canvas.clientHeight;
  game.scale = Math.min(expectedWidth/game.width, expectedHeight/game.height);
};
document.addEventListener("resize", resizeCanvas);

function projectCoordinates(obj)
{
  return {x: obj.x * pixelScale * game.scale, y: obj.y * pixelScale * game.scale};
}
