var clearColor = "rgb(222, 13, 170)";
var buildingColor = "rgb(5, 7, 55)";
var streetColor = "rgb(51, 48, 69)";
var lineColor = "rgb(82, 79, 49)";
var effectColor = "rgb(249,0,0)";
var spriteColor = "rgb(0, 0, 0)";
var saveKey = "alleyNoirSave";

function startDialog(background, dialog)
{
	var state = {

	};
	return state;
};

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

function startMenu()
{
	var titleSprite = newStaticObject("title");
	var newGameSprite = newStaticObject("new_game");
	var continueSprite = newStaticObject("continue_game");
	var cursorSprite = newStaticObject("cursor");

	titleSprite.x = continueSprite.x = newGameSprite.x = 640 - (newGameSprite.img.width/2);
	newGameSprite.y = 340 - (newGameSprite.img.height/2);
	continueSprite.y = 380 - (continueSprite.img.height/2);
	titleSprite.y = 20;
	cursorSprite.x = newGameSprite.x - 8 - newGameSprite.img.width/2;

	var state = {
		savedGame : null,
		selected : 0,
		titleSprite : titleSprite,
		continueSprite : continueSprite,
		newGameSprite : newGameSprite,
		cursorSprite : cursorSprite,
    idleTime : 0,
	};
	game.playMusic("Backed Vibes Clean");
	state.update = (function()
		{
		  // console.log("Input events " + game.inputEvents.length);
		  // Read input
		  while(game.inputEvents.length > 0)
		  {
		  	var e = game.inputEvents.shift();
		  	if ((e.state == KEYSTATE_UP) && (game.keyStates[e.keyCode] != KEYSTATE_DOWN))
		  	{
		  		switch(e.keyCode)
		  		{
		  			case KeyCodes.LEFT:
		  			case KeyCodes.A:
		  			    if((this.selected == 1) && (this.savedGame != null))
		  			    {
		  			    	this.selected = 0;
		  			    }
		  			    else
		  			    {
		  			    	this.selected = 1;
		  			    }
		  			  break;

		  			case KeyCodes.RIGHT:
		  			case KeyCodes.W:
		  				if ((this.selected == 0) && (this.savedGame != null))
		  				{
		  					pushState(this.savedGame);
		  				}
		  				else
		  				{
		  					pushState(startNewGame());
		  				}
		  			  break;

		  			default:
		  			  break;
		  		}
		  	}
		  }	

		}).bind(state);
	state.draw = (function()
		{
			clear();
			this.titleSprite.draw();
			this.newGameSprite.draw();
			this.continueSprite.draw();
			if (this.selected == 0)
			{
				this.cursorSprite.y = this.continueSprite.y;
			}
			else
			{
				this.cursorSprite.y = this.newGameSprite.y;
			}
			this.cursorSprite.draw();
		}).bind(state);
		
	if(typeof(Storage) !== "undefined") {
    	var savedGame = localStorage.getItem(saveKey);
    	if (savedGame == null)
    	{
    		var result = window.confirm("AlleyNoir would like to store save game data in your browser. We promise to only store a small amount of game-save data and nothing else!");
    		if (result == true)
    		{
    			localStorage.setItem(saveKey, {});
    		}
    		state.selected = 1;
    	}
    	else
    	{
    		state.savedGame = savedGame;
    		state.selected = 0;
    	}
	} else {
    	alert("Save games not supported by your browser");
	}
	
	return state;
};


function startNewGame()
{
	var state = {};
	state.npcs = [];
	state.alleys = [];

	state.offset = 0;
	state.noirSprite = newStaticObject("noir");
	state.noirSprite.x = game.width/2-state.noirSprite.img.width;
	state.noirSprite.y = 730-state.noirSprite.img.height;
  state.idleTime = 0;
	state.city = generateCity();
	game.playMusic("I Knew a Guy");
  state.overAlley = (function(){
    var index = 0;
    var playerx = (game.width/2) - this.offset;
    var playerhitbox = 64/2; // Centered on playerx
    while(index < this.city.length)
    {
      var building = this.city[index];
      if ((Math.abs(building.x - playerx) < playerhitbox) && (building.alley == true))
      {
        return true;
      }
      ++index;
    }
    return false;
  }).bind(state);
	state.update = (function()
	{
		var motion = 0;
		if (game.keyStates[KeyCodes.RIGHT] == KEYSTATE_DOWN)
		{
			motion = -1;
		}
		if (game.keyStates[KeyCodes.LEFT] == KEYSTATE_DOWN)
		{
			motion = 1;
		}
		this.offset += motion * Math.floor(128 * game.delta/1000);
    if (this.overAlley() == true)
    {
      this.idleTime += game.delta; 
      if(this.idleTime > 3000)
      {
        alert("Start Dialog");
      }
    }
    else
    {
      this.idleTime = 0;
    }
	}).bind(state);

	state.draw = (function()
	{
		clear();
		var width = game.width;
		var lineWidth = 128;
		var lineHeight = 8;
		
		for(var i = 0; i < this.city.length; ++i)
		{
			var building = this.city[i];
			if (building.alley == false)
			{
				game.context.fillStyle = buildingColor;
				game.context.fillRect(building.x + this.offset, building.y-building.h, building.w, building.h);
			}
		}

		game.context.fillStyle = streetColor;
		game.context.fillRect(0, 700, width, 100);
		game.context.fillStyle = lineColor;
		for(var i = -lineWidth; i < width+lineWidth; i += lineWidth*2)
		{
			game.context.fillRect(i+(this.offset%(2*lineWidth)), 746, lineWidth, 8);
		}
		this.noirSprite.draw();

    var elipsis_y = this.noirSprite.y-16-this.noirSprite.img.height;
		game.context.fillStyle = effectColor;
    if (this.idleTime > 200)
    {
      game.context.fillRect(this.offset-32, elipsis_y, 16, 16);
    }
    if (this.idleTime > 1000)
    {
      game.context.fillRect(this.offset, elipsis_y, 16, 16);
    }
    if (this.idleTime > 2000)
    {
      game.context.fillRect(this.offset+32, elipsis_y, 16, 16);
    }
	}).bind(state);
	return state;
};

function generateCity()
{
  var minAlleyCount = 6;
  var cityWidth = 25600;
  var alleyCount = 0;
  var city = [];
  while(alleyCount < 6)
  {
  	alleyCount = generateChunk(city, 0, cityWidth, true, 0);
  }
  return city;
};

function generateChunk(city, length, target, alleyBlock, alleyCount)
{
  var ab = false;
  var alleyWidth = 64;
  var buildingWidth = 128;
  var buildingHeight = 256;
  if (length <= target)
  {
  	if((Math.random() > 0.85) && (alleyBlock != true))
  	{
  	  city.push({alley: true, w: alleyWidth, h: 0, x: length, y: 700});
  	  length += alleyWidth;
  	  alleyCount += 1;
      ab = true;
  	}
  	else
  	{
      var l = (buildingWidth * (Math.ceil((2 * Math.random())+1 )));
  	  city.push({alley: false, w: l, h: (buildingHeight * Math.ceil((3 * Math.random()) + 1)), x: length, y: 700});
  	  length += l;
  	  ab = false;
  	}
  	return generateChunk(city, length, target, ab, alleyCount);
  }
  else
  	return alleyCount;
};

function startGame()
{
	game.clearColor = clearColor;
	return startMenu();
};