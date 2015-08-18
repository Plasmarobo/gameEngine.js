//REQUIRES engine_header.js TO BE REQUIRED FIRST

var game = {};

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
  }else if (window.mozRequestAnimationFrame) {
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

function resizeCanvas( element, callback ){
  var elementHeight = element.height,
      elementWidth = element.width;
  setInterval(function(){
      if( element.height !== elementHeight || element.width !== elementWidth ){
        elementHeight = element.height;
        elementWidth = element.width;
        game.window.width = window.innerWidth;
  game.window.height = window.innerHeight;
  game.width = game.context.canvas.clientWidth;
  game.height = game.context.canvas.clientHeight;
  game.scale = Math.min(expectedWidth/game.width, expectedHeight/game.height);
        callback();
      }
  }, 300);
}


function initializeGame()
{
  game.window = document.getElementById("game_window");
  resizeCanvas(game.window);
  document.addEventListener('keydown', keyDown, false);
  document.addEventListener('keyup', keyUp, false);

  game.context = game.window.getContext("2d");
  resizeCanvas();
  
  game.assetCount = assetQueue.length;
  game.fps = 60;
  game.clearColor = "rgb(0,0,0)";
  game.inputEvents = [];
  game.keyStates = Array(255); //ASCII keystates?
  game.assets = {images: {}, audio: {}, animations: {}};
  game.allowSave = false;
  clear();
  game.stack = [];
  game.context.drawRotated = DrawRotated.bind(game.context);
  game.music = null;
  game.sfx = [];
  game.playMusic = (function(name)
  {
    if (game.music != null)
    {
      game.music.pause();
    }
    game.music = game.assets.audio[name];
    game.music.loop = true;
    game.music.volume = 0.5;
    game.music.play();
  }).bind(game);
  game.playEffect = (function(name)
  {
    var sfx = game.assets.audio[name];
    sfx.currentTime = 0;
    // game.sfx.push(sfx);
    sfx.play();
  }).bind(game);
  game.delta = 0;
  game.lastframe = (new Date).getTime();
  game.update = (function() {
    var loops = 0, skipTicks = 1000 / game.fps,
      maxFrameSkip = 120,
      currentTime = (new Date).getTime(),
      nextGameTick = currentTime;
  
    return function() {
      loops = 0;

      if (game.stack.length > 0)
      {
        while (((currentTime = (new Date).getTime()) > nextGameTick) && (loops < maxFrameSkip)) {
          game.delta = currentTime - game.lastframe;
          game.stack[game.stack.length-1].update();
          nextGameTick += skipTicks;
          loops++;
          game.lastframe = currentTime;
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

function clear()
{
  game.context.fillStyle = game.clearColor;
  game.context.fillRect(0, 0, game.width, game.height);
}

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
  }else if (description.type == "animation")
  {
    game.assets.animations[description.name] = description.anim;
    onload();
  }
  else {alert("Unknown content specified for load, aborting");}
}

function DrawRotated(image, x, y, angle) {
  // TODO: SCALE COORDINATES SOMEHOW
  this.save();
  this.translate(x+game.width/2, y+game.height/2);
  this.rotate(angle);
  this.drawImage(image, -(image.width/2), -(image.height/2));
  this.restore();
};

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

function projectCoordinates(obj)
{
  return {x: obj.x * pixelScale * game.scale, y: obj.y * pixelScale * game.scale};
}

function advanceAnimation(delta)
{
  this.frameTime += game.delta;
  var currentFrame = this.currentFrame();
  if (this.frameTime > currentFrame.time)
  {
    if (currentFrame.trigger != null)
    {
      currentFrame.trigger();
    }

    if (this.frameIndex < this.currentAnimation().frames.length)
    {
      this.frameTime = 0;
      if (this.frameIndex < this.currentAnimation().frames.length-1)
      {
        this.frameIndex++;
      }
      else
      {
        if (this.currentAnimation().loop == true)
        {
          this.frameIndex = 0;
        }
      }
    }
    
  }
}

function newAnimation(asset, animation, initial_anim, update_function)
{
  var ao = {};
  ao.img = game.assets.images[asset];
  ao.x = 0;
  ao.y = 0;
  ao.z = 0;
  ao.anim = game.assets.animations[animation];

  ao.frameTime = 0;
  ao.frameIndex = 0;
  ao.animIndex = initial_anim;
  ao.advanceAnimation = (advanceAnimation).bind(ao);
  ao.update_binding = (update_function).bind(ao);
  ao.update = (function() {
    this.update_binding();
    this.advanceAnimation();    
  }).bind(ao);

  ao.draw = (function() {
      var frame = this.currentFrame();
      game.context.drawImage(this.img, frame.x, frame.y, frame.w, frame.h,this.x, this.y, frame.w, frame.h);
  }).bind(ao);

  ao.currentFrame = (function(){
    return this.anim[this.animIndex].frames[this.frameIndex];
  }).bind(ao);
  ao.currentAnimation = (function(){
    return this.anim[this.animIndex];
  }).bind(ao);
  ao.setAnimation = (function(key){
    if (this.animIndex != key)
    {
      this.animIndex = key;
      this.frameIndex = 0;
      this.frameTime = 0;
    }
  }).bind(ao);
  return ao;
}

function newStaticObject(asset)
{
  var so = {};
  so.img = game.assets.images[asset];
  so.x = 0;
  so.y = 0;
  so.z = 0;
  so.update = (function() {
      // Do nothing
    }).bind(so);
  so.draw = (function()
    {
      game.context.drawImage(this.img, this.x, this.y);
    }).bind(so);
  return so;
};
