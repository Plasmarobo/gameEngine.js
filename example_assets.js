

var assetQueue = [];

// Image assets
(["title",
  "new_game",
  "continue_game",
  "cursor",
  "noir"
]).forEach(function(name){
	assetQueue.push({type: "image", name: name});
});

//Audio assets
(["Backed Vibes Clean",
  "Despair and Triumph",
  "I Knew a Guy"
]).forEach(function(name){
	assetQueue.push({type: "audio", name: name});
});