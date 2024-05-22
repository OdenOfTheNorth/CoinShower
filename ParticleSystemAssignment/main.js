// ----- Start of the assigment ----- //

//start of Small Math Lib
//https://easings.net/#easeOutBounce
function easeOutBounce(x) {
	const n1 = 7.5625;
	const d1 = 2.75;
	
	if (x < 1 / d1) {
		return n1 * x * x;
	} else if (x < 2 / d1) {
		return n1 * (x -= 1.5 / d1) * x + 0.75;
	} else if (x < 2.5 / d1) {
		return n1 * (x -= 2.25 / d1) * x + 0.9375;
	} else {
		return n1 * (x -= 2.625 / d1) * x + 0.984375;
	}
}

function easeInOutBack(x) {
	//const c1 = 1.70158;
	const c1 = 2.70158;
	const c2 = c1 * 1.525;
	
	return x < 0.5
	  ? (Math.pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2)) / 2
	  : (Math.pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2;
}

function easeOutCubic(x) {
	return 1 - Math.pow(1 - x, 3);
}

function lerp(x, y, a) {
	return x * (1 - a) + y * a;
}

function inverselerp(a, b, x) {
	return (x - a) / (b - a);
}

function clamp(x, y, a) {
	return Math.max(x, Math.min(y, a));
}


//End of Small Math Lib

// Tags for what a coin should do, given names to make expansion easier in the future
const CoinTags = {Small: 0, Large: 1, explosive: 2};

class ParticleSystem extends PIXI.Container {
	
	constructor() {
		super();
		// Set start and duration for this effect in milliseconds
		this.start    = 0;
		this.duration = 5000;
		this.lastTimeTextureIndexChanged = null;
		this.sp = [];
		//The time it takes for a partical to stop rendering in milliseconds
		this.particalLifeTime = 1000;

		/*
			Add lots of fast moving bouncing coins 
		*/

		//Create coins
		this.CreateCoins(100,CoinTags.Small);
		this.CreateCoins(10, CoinTags.Large);
		this.CreateCoins(20, CoinTags.explosive);
	}
	// General creation function for making sprites
	CreateSprite(location){
		// Create a sprite
		let sp        = game.sprite(location);
		// Set pivot to center of said sprite
		sp.pivot.x    = sp.width / 2;
		sp.pivot.y    = sp.height / 2;
		
		sp.y = game.height / 2;
		sp.x = game.width / 2;

		return sp;
	}
	// Create Coins 
	CreateCoins(amount, tag){
		// Make const as it will not need to be changed
		const timeDiff = (this.duration * 0.001 * 0.8) / amount;

		//Loop amount to create multiple sprites.
		for(let i = 0; i < amount; i++){
			// Create a sprite
			let sp = this.CreateSprite("CoinsGold00" + Math.floor(i % 9));
			// Set coin target Pos.											Can change to more random numbers if needed
			sp.targetX = Math.cos(i * 13.259) + Math.sin(i * 13.357) * 500; //(-500 + Math.random() * (500 * 2));
			sp.targetY = Math.sin(i * 17.356) + Math.cos(i * 51.356) * 250; //(-250 + Math.random() * (250 * 2));
			// Set Coin tag			
			sp.tag = tag;									
			// turn off visible by default
			sp.visible = false;								
			// Set Coins texture spawn index
			sp.textureIndex = Math.floor(i % 9);			
			// delay in seconds
			sp.timeOffset = i * timeDiff; 	
			//Set Rotation Speed		
			sp.rotationSpeed = 1 + Math.floor(Math.random() * 2);
			// add sp to chilldren
			this.addChild(sp);
			// Save a reference to the sprite particle
			this.sp.push(sp);
		}
	}

	launchBouncyCoins(startPos, highPoint, lowPoint, x) {
		//convert value from 0 - 1 to 0 - 2
		var value = lerp(0, 2, x);
		//check what functions should be used
		if(value <= 1){
			return startPos + easeOutCubic(value) * -highPoint;
		}
		//if value above 1 simply return this.
		return (startPos - highPoint) + easeOutBounce(value - 1) * lowPoint;
	}

	animTick(nt,lt,gt) {
		// Every update we get three different time variables: nt, lt and gt.
		//   nt: Normalized time in procentage (0.0 to 1.0) and is calculated by
		//       just dividing local time with duration of this effect.
		//   lt: Local time in milliseconds, from 0 to this.duration.
		//   gt: Global time in milliseconds,

		const startPosY = 225;
		const startPosX = 400;
		const height = 170;
		
		//Fun reverse effect
		const time = gt / 1000;
		const sinwave = 0.5 + (0.5 * Math.sin(time));

		const num = Math.floor(nt * 8);		
		let updateCoinTextureThisframe = this.lastTimeTextureIndexChanged !== num;
		if(updateCoinTextureThisframe){
			this.lastTimeTextureIndexChanged = num;
		}		

		// Loop trough all patricals to update
		for(let i = 0; i < this.sp.length; i++){
			let sp = this.sp[i];

			//Create spTime so move speed is not bound by this.duration
			const spTime = clamp(0, this.particalLifeTime * 0.001, lt * 0.001 - sp.timeOffset);
			//console.log(spStartTime);

			// Adjust nt with the use of coin offset
			const adjustedNt = spTime;// clamp(0, 1, (nt - sp.timeOffset) / (1 - sp.timeOffset));

			// Added a fun reverse effect
			//const adjustedNt = clamp(0, 1, (sinwave - sp.timeOffset) / (1 - sp.timeOffset));
			
			if (adjustedNt <= 0 || adjustedNt >= 1) {
				// Coin hasn't started its animation or Coin's animation is complete
				sp.visible = false;
				continue;
			}

			sp.visible = true;
			
			if(updateCoinTextureThisframe) {
				//Increase texture index by 1, if out of bounds set to 0 
				sp.textureIndex = (sp.textureIndex + 1) % 9;
				//Set sprite Texture
				game.setTexture(sp, "CoinsGold00" + sp.textureIndex);
			}

			sp.x = startPosX + adjustedNt * sp.targetX;
			
			// Use switch statment as it's easier to read when adding more tags
			switch (sp.tag) {
				case CoinTags.Large:
					sp.y = this.launchBouncyCoins(startPosY, height, 350, adjustedNt);
					sp.scale.x = sp.scale.y = lerp(0, 0.7, adjustedNt);
					sp.alpha = lerp(1, 0.3, adjustedNt);
					break;
				case CoinTags.Small:
					sp.scale.x = sp.scale.y = 0.1;
					sp.y = this.launchBouncyCoins(startPosY, height, 350, adjustedNt);
					sp.alpha = lerp(1, 0.3, adjustedNt);
					break;
			
				default:
					sp.scale.x = sp.scale.y = 0.1;
					sp.y = startPosY + easeInOutBack(adjustedNt) * 220;
					sp.alpha = lerp(1, 0.3, adjustedNt);
					break;
			}

			sp.rotation = adjustedNt * Math.PI * 2 * sp.rotationSpeed;
		}
	}
}

// ----- End of the assigment ----- //

class Game {
	constructor(props) {
		this.totalDuration = 0;
		this.effects = [];
		this.renderer = new PIXI.WebGLRenderer(800,450);
		document.body.appendChild(this.renderer.view);
		this.stage = new PIXI.Container();
		this.loadAssets(props&&props.onload);
	}
	loadAssets(cb) {
		let textureNames = [];
		// Load coin assets
		for (let i=0; i<=8; i++) {
			let num  = ("000"+i).substr(-3);
			let name = "CoinsGold"+num;
			let url  = "gfx/CoinsGold/"+num+".png";
			textureNames.push(name);
			PIXI.loader.add(name,url);
		}
		PIXI.loader.load(function(loader,res){
			// Access assets by name, not url
			let keys = Object.keys(res);
			for (let i=0; i<keys.length; i++) {
				var texture = res[keys[i]].texture;
				if ( ! texture) continue;
				PIXI.utils.TextureCache[keys[i]] = texture;
			}
			// Assets are loaded and ready!
			this.start();
			cb && cb();
		}.bind(this));
	}
	start() {	
		this.isRunning = true;
		this.t0 = Date.now();
		update.bind(this)();
		function update(){
			if ( ! this.isRunning) return;
			this.tick();
			this.render();
			requestAnimationFrame(update.bind(this));
		}
	}
	addEffect(eff) {
		this.totalDuration = Math.max(this.totalDuration,(eff.duration+eff.start)||0);
		this.effects.push(eff);
		this.stage.addChild(eff);
	}
	render() {
		this.renderer.render(this.stage);
	}
	tick() {
		let gt = Date.now();
		let lt = (gt-this.t0) % this.totalDuration;
		for (let i=0; i<this.effects.length; i++) {
			let eff = this.effects[i];
			if (lt>eff.start+eff.duration || lt<eff.start) continue;
			let elt = lt - eff.start;
			let ent = elt / eff.duration;
			eff.animTick(ent,elt,gt);
		}
	}
	sprite(name) {
		return new PIXI.Sprite(PIXI.utils.TextureCache[name]);
	}
	setTexture(sp,name) {
		sp.texture = PIXI.utils.TextureCache[name];
		if ( ! sp.texture) console.warn("Texture '"+name+"' don't exist!")
	}
}

window.onload = function(){
	window.game = new Game({onload:function(){
		game.addEffect(new ParticleSystem());
	}});
}
