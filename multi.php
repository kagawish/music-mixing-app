<!DOCTYPE HTML>
<html>
<head>
<meta charset=utf-8 />
    <style>
	
        body {
            margin: 0px;
            padding: 0px;
        }
  
        #myCanvas {
            border: 1px solid #9C9898;
        }
		
		h1 {
		background: #385C85;
		color: #FFF;
		padding: 10px;
		padding-left: 20px;
		margin-top: 0px;
		text-align: center 
		}
		.button {
		   border-top: 1px solid #96d1f8;
		   background: #65a9d7;
		   background: -webkit-gradient(linear, left top, left bottom, from(#3e779d), to(#65a9d7));
		   background: -webkit-linear-gradient(top, #3e779d, #65a9d7);
		   background: -moz-linear-gradient(top, #3e779d, #65a9d7);
		   background: -ms-linear-gradient(top, #3e779d, #65a9d7);
		   background: -o-linear-gradient(top, #3e779d, #65a9d7);
		   padding: 5px 10px;
		   -webkit-border-radius: 8px;
		   -moz-border-radius: 8px;
		   border-radius: 8px;
		   -webkit-box-shadow: rgba(0,0,0,1) 0 1px 0;
		   -moz-box-shadow: rgba(0,0,0,1) 0 1px 0;
		   box-shadow: rgba(0,0,0,1) 0 1px 0;
		   text-shadow: rgba(0,0,0,.4) 0 1px 0;
		   color: white;
		   font-size: 14px;
		   font-family: Georgia, serif;
		   text-decoration: none;
		   vertical-align: middle;
		}
		
		.row {
		  margin-left: -20px;
		  *zoom: 1;
		}
		
		.row:before,
		.row:after {
		  display: table;
		  line-height: 0;
		  content: "";
		}
		
		.row:after {
		  clear: both;
		}
		
		[class*="span"] {
		  min-height: 1px;
		  margin-left: 20px;
		}
    </style>
	<title>Notre Boite &agrave; Rythme</title>

    <script src="js/chroma.js"></script>
	
<script src="http://cwilso.github.io/AudioContext-MonkeyPatch/AudioContextMonkeyPatch.js"></script>
<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js"></script>

<?php 
		//on lit le fichier echantillons pour récupérer la liste des echantillons
		/**
		 *  Lire un fichier CSV et stoquer ces non dans le menu
		 *  @param chemin: le chemin ou le nom du fichier (si repertoire courant) (sans le point ".csv")
		 */
		function searchAndRead($chemin){
			//on commence a la ligne 1 et on cree une variable texte pour enregistrer le texte
			$ligne = 1;
		
			//tableau pour stocker les chemins
			$soundPath = array();
			
			//lien vers les musiques
			$lien = "../../Divers/Musiques/Echantillons/";
			
			//on ouvre le fichier en mode lecture et on va lire champs apres champs et ligne apres ligne
			if (($fic = fopen($chemin."Echantillons.csv", "r")) !== false) {
				while (($data = fgetcsv($fic, 1000, ",")) !== false) {
					//le nombre de champs par ligne
					$num = count($data);
					$texte = $lien;
					for ($case=0; $case < $num; $case++) {
						//on affiche le lien
						$texte .= $data[$case];
					}
					$soundPath[$ligne] = $texte;
					$ligne++;
		
				}
			
			}else{
				echo 'Erreur de lecture du fichier Ecantillon.csv';
			}
		
			//on ferme le fichier
			fclose($fic);	
			
			//on retourne le tableau
			return $soundPath;
		}

		//on renseigne le chemin
		$chemin = "../../Divers/Musiques/Echantillons/";

		$echantillons = searchAndRead($chemin);
		
		//on regarde si on a un nombre d'echantillons ajoutés
		if(isset($_POST['nb'])){
			if( $_POST['nb'] <= (sizeof($echantillons)-1) ){
				$nb = $_POST['nb'];
			}else{
				$nb = sizeof($echantillons)-1;
			}
		}else{
			$nb = 1;
		}

?>

	<script>
		var audioBuffer;
		var targetX = 500, targetY = 200, targetRadius = 50;
		var playerX=0, playerY=0;
		
		var canvas,context,contextSound;
		var keyPressed=false,key='';
		var mousePressed=false,mouseX=0,mouseY=0,pmouseX=0,pmouseY=0;
		var width,height;
		var sound;

		var QUAL_MUL = 30;

		function background(couleur){
		  fill(couleur);
		  context.fillRect(0,0,width,height);
		}
		
		function random(val){
		  return val*Math.random();
		}
		
		function random(val1,val2){
		  return random(val2-val1)+val1;
		}
		
		function keyPress(){
		  keyPressed=true;
		}
		
		function keyNotPress(){
		  keyPressed=false;
		}
		
		function mousePress(){
		  mousePressed=true;
		}
		
		function mouseNotPress(){
		  mousePressed=false;
		}
		
		function println(message){
		  console.log(message);
		}
		
		var calcDistanceToMove = function(delta, speed) {
		    return (speed * delta) ; 
		  };
		
		
		
		function image(nom,x,y){
		  var imageObj = new Image();
		  imageObj.onload = function() {
		    drawImage(this,x,y);
		  };
		  imageObj.src = nom;
		}
		
		function drawImage(imageObj,x,y) {
		  context.drawImage(imageObj, x, y);
		}
		
		function imageDim(nom,x,y,dx,dy){
		  var imageObj = new Image();
		  imageObj.onload = function() {
		    drawImageDim(this,x,y,dx,dy);
		  };
		  imageObj.src = nom;
		}
		
		function drawImageDim(imageObj,x,y,dx,dy) {
		  context.drawImage(imageObj, x, y,dx,dy);
		}
		
		function text(message) {
		  text(message,0,0);
		}
		
		function text(message,x,y) {
		  context.font = '18pt Calibri';
		  context.fillText(message, x, y);
		} 
		
		function fill(couleur){
		  context.fillStyle = couleur;
		}
		
		function getMousePos(canvas, evt) {
		  // get canvas position
		  var obj = canvas;
		  var top = 0;
		  var left = 0;
		  while (obj && obj.tagName != 'BODY') {
		    top += obj.offsetTop;
		    left += obj.offsetLeft;
		    obj = obj.offsetParent;
		  }
		
		  // return relative mouse position
		  var mouseX = evt.clientX - left + window.pageXOffset;
		  var mouseY = evt.clientY - top + window.pageYOffset;
		  return {
		    x:mouseX,
		    y:mouseY
		  };
		}
		
		function line(x1,y1,x2,y2){
		  context.beginPath();
		  context.moveTo(x1,y1);
		  context.lineTo(x2,y2);
		  context.stroke();
		}
		
		function ellipse(x, y, longueur, hauteur){
		    var ctx = canvas.getContext('2d');
		    ctx.beginPath();
		    var lx = x - longueur/2,
		        rx = x + longueur/2,
		        ty = y - hauteur/2,
		        by = y + hauteur/2;
		    var magic = 0.551784;
		    var xmagic = magic*longueur/2;
		    var ymagic = hauteur*magic/2;
		    context.moveTo(x,ty);
		    context.bezierCurveTo(x+xmagic,ty,rx,y-ymagic,rx,y);
		    context.bezierCurveTo(rx,y+ymagic,x+xmagic,by,x,by);
		    context.bezierCurveTo(x-xmagic,by,lx,y+ymagic,lx,y);
		    context.bezierCurveTo(lx,y-ymagic,x-xmagic,ty,x,ty);
		    context.fill();
		    context.stroke();
		}
		
		function circle(x,y,rayon){
			context.beginPath();
		    context.arc(x, y, rayon, 0, 2 * Math.PI, false);
		    //context.fillStyle = "black";
		    context.fill();
		    context.stroke();
		}
		
		function BoiteARythme(x,y,longueurX,longueurY,nbBeats,BPM){
		  this.x=x;
		  this.y=y;
		  this.longueurX=longueurX;
		  this.longueurY=longueurY;
		  this.nbBeats=nbBeats;
		  this.sons=[];
		  this.toucher=new Array([]);
		  this.appuyer=false;
		  this.lineX=0;
		  this.indexBeat=0;
		  this.BPM=BPM;
		  this.stop=false;
		  this.pause=false;
		  this.volume=true;
		  
		  
		  this.addSon=function(nom){
		    var son=new Sound();
		    loadAndDecodeSample(nom, son); 
		    this.sons.push(son);
		  };
		  
		  this.dessineToi=function(){
			if(!this.stop){
				this.dessineJouer();
			}
			else{
				time = contextSound.currentTime;
				if(this.lineX!=0){
					this.lineX=0;
				}
			}
		    this.dessineGrille();
		  };
		  
		  this.init=function(){
			var longueur=this.nbBeats;
		    var hauteur=this.sons.length;
			this.toucher=new Array([]);
				for(i=0;i<longueur;i++){
				  this.toucher.push([]);
				  for(j=0;j<hauteur;j++){
					this.toucher[i].push(false);
				  }
				}
			}
		  
		  this.dessineJouer=function(){
		    if(contextSound.currentTime!== 0) {
		    var now = contextSound.currentTime;
		    var delta = now - time;
		    var incX = calcDistanceToMove(delta, this.calculeVpourBPM(this.BPM));
		      
		    var nbSon=this.sons.length;
		    var longueur=longueurX/this.nbBeats;
		    var hauteur=longueurY/this.nbSon;
		      
		    line(this.lineX+this.x,0,this.lineX+this.x,height);
		    if(this.indexBeat*longueur<=this.lineX){
		      for(i=0;i<nbSon;i++){
		        if(this.toucher[this.indexBeat][i] && this.volume){
		          this.sons[i].play(0);
		        }
		      }
		      this.indexBeat++;
		    }
			if(!this.pause){
				this.lineX+=incX;
			}
		    if(this.lineX>this.longueurX){
		      this.lineX=0;
		      this.indexBeat=0;
		    }
		    time=now;
		    }
		  };
		  
		  this.dessineGrille=function(){
		    grille(x,y,longueurX,longueurY,longueurX/this.nbBeats,longueurY/this.sons.length);
		    var nbSon=this.sons.length;
		    
		    var longueur=longueurX/this.nbBeats;
		    var hauteur=longueurY/nbSon;
		    for(i=0;i<this.nbBeats;i++){
		      for(j=0;j<nbSon;j++){ 
				if(mousePressed&&mouseX>i*longueur+this.x&&mouseX<(i+1)*longueur+this.x&&mouseY>j*hauteur+this.y&&mouseY<(j+1)*hauteur+this.y&&!this.appuyer){
		             this.toucher[i][j]=!this.toucher[i][j];
		             this.appuyer=true;
		         }
		        if(!mousePressed){
		          this.appuyer=false;
		        }
		      }
		    }
		    
		    fill("grey");
		    for(i=0;i<this.nbBeats;i++){
		      for(j=0;j<nbSon;j++){
		        if(this.toucher[i][j]){
		          ellipse(longueur*i+longueur/2+this.x,hauteur*j+hauteur/2+this.y,longueur*10/12,hauteur*10/12);
		        }
		      }
		    }
		  };
		  
		  this.calculeVpourBPM=function(bpm) {
		  var bps = bpm/60;
		  var largeurPixelsUnBeat = width / this.nbBeats;
		  
		  // en une s, je dois parcourir bps * largeurPixelsUnBeat
		  
		  // vitesse en pixels par seconde pour
		  // que la barre verticale balaye BPM
		  // beats / minute
		  var v = bps * largeurPixelsUnBeat;
		  return v;
		};
		
			this.setStop=function(stop){
				this.stop=stop;
			}
			
			this.setPause=function(pause){
				this.pause=pause;
			}
			
			this.setSon=function(son){
				this.volume=son;
			}
			
		  this.setBPM=function(BPM){
			this.BPM=BPM;
		  }
		  this.max=nbBeats;
		  this.setNbBeats=function(nbBeats){
		    var nbSon=this.sons.length;
			if(nbBeats>this.max){
				for(i=this.max;i<nbBeats;i++){
				  this.toucher.push([]);
				  for(j=0;j<nbSon;j++){
					this.toucher[i].push(false);
				  }
				}
				this.max=nbBeats;
			}
			this.nbBeats=nbBeats;
		  }
		  
		}
		
		function Bouton(nom1,nom2,nom3){
		  this.nom1=nom1;
		  this.nom2=nom2;
		  this.nom3=nom3;
		  this.click=false;
		  this.appuyer=false;
		  this.dessineToi=function(x,y,dx,dy){
		    if(mousePressed){
		      if(x<mouseX&&x+dx>mouseX&&y<mouseY&&y+dy>mouseY){
		        imageDim(nom3,x,y,dx,dy);
		        if(!this.appuyer){
		          this.appuyer=true;
		        }
		      }
		      else{
		        imageDim(nom1,x,y,dx,dy);
		      }
		    }
		    else{
		      if(x<mouseX&&x+dx>mouseX&&y<mouseY&&y+dy>mouseY){
		        if(this.appuyer){
		          this.appuyer=false;
		          this.click=true;
		        }
		        imageDim(nom2,x,y,dx,dy);
		      }
		      else{
		        if(this.appuyer){
		          this.appuyer=false;
		        }
		        imageDim(nom1,x,y,dx,dy);
		      }
		    }
		  };
		  this.getClick=function(){
		    if(this.click){
		      this.click=false;
		      return true;
		    }
		    return false;
		  };
		}
		
		function Radio(nom1,nom2){
		  this.bouton1=new Bouton(nom1,nom1,nom1);
		  this.bouton2=new Bouton(nom2,nom2,nom2);
		  this.etat=true;
		  this.dessineToi=function(x,y,dx,dy){
		    if(this.etat){
		      this.bouton1.dessineToi(x,y,dx,dy);
		      if(this.bouton1.getClick()){
		        this.etat=false;
		      }
		    }
		    else{
		      this.bouton2.dessineToi(x,y,dx,dy);
		      if(this.bouton2.getClick()){
		        this.etat=true;
		      }
		    }
		  };
		
		  this.getEtat=function(){
		    return this.etat;
		  };
		
		  this.setEtat=function(b){
		    this.etat=b;
		  };
		}
		
		function grille(x,y,longueurX,longueurY,interX,interY){
		  fill("black");
		  for(i=x;i<=longueurX+x;i+=interX){
		    line(i,y,i,longueurY+y);
		  }
		  for(i=y;i<=longueurY+y;i+=interY){
		    line(x,i,longueurX+x,i);
		  }
		}
		
		function initAudioContext() {
		    console.log("initialisation of audio context. Should work with any browser except IE");
		    contextSound = new AudioContext();
		}
		
		// Load and decode a sound sample using Ajax/XhR2
		function loadAndDecodeSample(url, son) {
		    var request = new XMLHttpRequest();
		
		    request.open("GET", url, true);
		    request.responseType = "arraybuffer";
		
		    // Asynchronous callback. Called when the sound file has been downloaded using Ajax/Xhr2
		    request.onload = function() {
		        console.log("Sound file loaded");
		        // request.response = for example a mp3, ogg, wav file. We need to decode it in order
		        // to be processable by the web audio engine. Web Audio works only with "decoded" samples in
		        // memory
		        contextSound.decodeAudioData(request.response,
		                function onSuccess(decodedBuffer) {
		                    decodedSample = decodedBuffer;
		                    son.setDecodedSample(decodedSample);
		                    console.log("The music file we downloaded has been decoded");
		                  //sound.play();
		                  // init GUI
		                  buttonPlay.disabled = false;
		                  //this.audioBuffer = decodedBuffer;
		                },
		                function onFailure() {
		                    alert("Decoding the audio buffer failed");
		                });
		    };
		
		    // sending XhR2 request, when the response is arrived, the onload callback is called (above)
		    request.send();
		}
		
		// Note : no async callbacks in there. In callbacks, the use of "this" is very tricky
		function Sound() {
		  this.decodedSample=null;
		  this.sourceNode=null;
		  this.sourceNode2=null;
		  this.sourceNode3=null;
		
		    this.setDecodedSample = function(sample) {
		        this.decodedSample = sample;
		    };

			//Changer la Fréquence
			this.changeFrequency = function(element) {
				  // Clamp the frequency between the minimum value (40 Hz) and half of the
				  // sampling rate.
				  var minValue = 40;
				  var maxValue = contextSound.sampleRate / 2;
				  // Logarithm (base 2) to compute how many octaves fall in the range.
				  var numberOfOctaves = Math.log(maxValue / minValue) / Math.LN2;
				  // Compute a multiplier from 0 to 1 based on an exponential scale.
				  var multiplier = Math.pow(2, numberOfOctaves * (element.value - 1.0));
				  // Get back to the frequency value between min and max.
				  this.filter.frequency.value = maxValue * multiplier;
			};

			//Modifier la Qualité
			this.changeQuality = function(element) {
				  this.filter.Q.value = element.value * QUAL_MUL;
			};

			//ACTIVER / DESACTIVER LE FILTRE
			this.toggleFilter = function(element) {
				  this.sourceNode.disconnect(0);
				  this.filter.disconnect(0);
				  // Check if we want to enable the filter.
				  if (element.checked) {
				    // Connect through the filter.
				    this.sourceNode.connect(this.filter);
				    this.filter.connect(contextSound.destination);
				  } else {
				    // Otherwise, connect directly.
				    this.sourceNode.connect(contextSound.destination);
				  }
			};

		
		    this.buildAudioGraph = function() {
		        // We create a web audio node that will be the source of the graph
		        this.sourceNode = contextSound.createBufferSource();
		        // It will contain the decoded sound sample
		        this.sourceNode.buffer = this.decodedSample;

		        /**
		        *		Creation d'un filtre avec web audio
		        **/

		     	this.filter	= contextSound.createBiquadFilter();
		     	this.filter.type = 0; // LOWPASS
		     	this.filter.frequency.value = 5000;

		     	//on applique les filtres
		     	this.changeFrequency(document.getElementById("freq"));
		     	this.changeQuality(document.getElementById("qual"));

		     	// Soit le filtre est activé soiton démarre comme avant si désactivé
			    // Connect through the filter.
				this.toggleFilter(document.getElementById("c1"));
				
		        console.log("graphe web audio construit");
		    };
		
		    	// Finally: tell the source when to start
		    	this.play = function(delay) {
		        // We need to rebuild the graph before each play, this may seem odd but
		        // web audio is optimized for that pattern
		        this.buildAudioGraph();
		        //console.log("lecture");
		        // first param = time where to start, second optional parameter = delay before playing
		        //this.sourceNode.buffer = audioBuffer;
		        this.sourceNode.start(delay,0);

		        /** TEST COURBES **/
		        
		        /**
		        *   Init du noeud javascript
		        **/
				// setup a javascript node
				var javascriptNode = contextSound.createJavaScriptNode(1024, 1, 1);
				
				// connect to destination, else it isn't called
				javascriptNode.connect(contextSound.destination);	
				

				// when the javascript node is called
				// we use information from the analyzer node
				// to draw the volume
				javascriptNode.onaudioprocess = function () {
				
				    // get the average for the first channel
				    var array = new Uint8Array(analyser.frequencyBinCount);
				    analyser.getByteFrequencyData(array);

				    drawSpectrum(array);
						
				    drawSpectrogram(array);
				    
							
				    var array2 = new Uint8Array(analyser.frequencyBinCount);
				    analyser.getByteTimeDomainData(array2)
					
				    drawWave(array2);
				
				}

				//var delai = bpm/60;
				
				// setup a analyzer
				var analyser = contextSound.createAnalyser();
				analyser.smoothingTimeConstant = 0.01;
				analyser.fftSize = 512;
				
				// create a buffer source node
				this.filter.connect(analyser);
				analyser.connect(javascriptNode);
				
				// get the context from the canvas to draw on
				var ctx = $("#spectrogram").get()[0].getContext("2d");
				
				// create a temp canvas we use for copying
				var tempCanvas = document.createElement("canvas");
				tempCanvas.width = 300;
				tempCanvas.height = 150;
				var tempCtx = tempCanvas.getContext("2d");
				
				// used for color distribution
				var hot = new chroma.ColorScale({
				    colors:['#000000', '#ff0000', '#ffff00', '#ffffff'],
				    positions:[0, .25, .75, 1],
				    mode:'rgb',
				    limits:[0, 175]
				});
				
				
				
				function drawSpectrum(array) {
				    var ctx = $("#spectrum").get()[0].getContext("2d");

				    var som = 0;
				
				
				    for ( var i = 0; i < (array.length); i++ ){
				        var value2 = array[i];
						som = som + value2;
				        
				    }
				    //On ne dessine que lorsque l'on a un resultats valable (un son quoi)
					if(som != 0){
					    ctx.fillStyle = "#ffffff"
						ctx.clearRect(0, 0, 150, 128);
					    for ( var i = 0; i < (array.length); i++ ){
					        var value = array[i];
					
					        ctx.fillRect(i,200-value,1,150);
					        
					    }
					}
				   
				};
				
				function drawWave(array) {

					var ctx = $("#wave").get()[0].getContext("2d");

				    var som = 0;
					
					
				    for ( var i = 0; i < (array.length); i++ ){
				        var value2 = array[i];
						som = som + value2;
				        
				    }
				
				    if(som != 0){
					    ctx.fillStyle = "#ffffff"
					    ctx.clearRect(0, 0, 150, 128);
					
					    for ( var i = 0; i < (array.length); i++ ){
					        var value = array[i];
					
					        ctx.fillRect(i/2+11,202-value,1,1);
					    }
				    }


				};
				
				function drawSpectrogram(array) {
				
				    // copy the current canvas onto the temp canvas
				    var canvas2 = document.getElementById("spectrogram");
				
				    tempCtx.drawImage(canvas2, 0, 0, 150, 128);
				
				    // iterate over the elements from the array
				    for (var i = 0; i < array.length; i++) {
				        // draw each pixel with the specific color
				        var value = array[i];
				        ctx.fillStyle = hot.getColor(value).hex();
				
				        // draw the line at the right side of the canvas
				        ctx.fillRect(150 - 1, 128 - i, 1, 1);
				    }
				
				    // set translate on the canvas
				    ctx.translate(-1, 0);
				    // draw the copied image
				    ctx.drawImage(spectrogram, 0, 0, 150, 128, 0, 0, 150, 128);
				
				    // reset the transformation matrix
				    ctx.setTransform(1, 0, 0, 1, 0, 0);
				
				}

				/** FIN TEST COURBES **/
		       
		    	};
		}
		function play() {
		  sound.play();
		  
		}
		function stop() {
		  sound.stop();
		}
		
		
		window.onload = function () {
		  canvas = document.getElementById('myCanvas');
		  context = canvas.getContext('2d');
		  var mousePos;
		  width=canvas.width;height=canvas.height;
		
		  document.onkeydown=keyPress;
		  document.onkeyup=keyNotPress;
		  document.onmousedown=mousePress;
		  document.onmouseup=mouseNotPress;
		  
		  boiteARythme=new BoiteARythme(100,0,width-100,height,16,100);
		  
		  buttonPlay = document.querySelector("#play");
		  buttonStop = document.querySelector("#stop");
		  buttonPause = document.querySelector("#pause");
		  buttonSon = document.querySelector("#son");
		  buttonSansSon = document.querySelector("#sansSon");
		  
		  buttonPlay.disabled = true;
		
		  
		  initAudioContext();
		  sound = new Sound();
		  loadAndDecodeSample("../click.mp3", sound); 
		  
		  time = contextSound.currentTime;
		
		
		  canvas.addEventListener('mousemove', function (evt) {
		    mousePos = getMousePos(canvas, evt);
		    pmouseX = mouseX; pmouseY = mouseY;
		    mouseX = mousePos.x; mouseY = mousePos.y;
		  }, false);
		
		  window.addEventListener('keypress', function (e) {
		    key=String.fromCharCode(window.event? event.keyCode: e.keyCode);
		  }, false);
		  
		  buttonPlay.addEventListener("click", function() {
		    sound.play();
		    boiteARythme.setStop(false);
		    boiteARythme.setPause(false);
		  });
		  
		  buttonStop.addEventListener("click", function() {
		    boiteARythme.setStop(true);
		    boiteARythme.setPause(false);
		  });
		  
		  buttonPause.addEventListener("click", function() {
		    boiteARythme.setPause(true);
		    boiteARythme.setStop(false);
		  });
		  
		  buttonSon.addEventListener("click", function() {
		    boiteARythme.setSon(true);
		  });
		  
		  buttonSansSon.addEventListener("click", function() {
		    boiteARythme.setSon(false);
		  });

		
		  function setup(){
		    boiteARythme.init();
		    
		    boiteARythme.addSon("../tom1.mp3");
		    boiteARythme.addSon("../tom2.mp3");
		    boiteARythme.addSon("../tom3.mp3");
		    boiteARythme.addSon("../hihat.mp3");
		    boiteARythme.addSon("../snare.mp3");
		    boiteARythme.addSon("../kick.mp3");

			<?php 
					//on ajoute les échantillons
					if(isset($_POST["SendE"])){
						
						for($num = 0; $num < sizeof($echantillons); $num++){
				
							$string = 'echantillon'.$num;

							if(isset($_POST[$string])){
								
								echo 'boiteARythme.addSon("'.$chemin.$_POST[$string].'.mp3");';
							}
						}				
					}
							
			?>
		  }
		
		  var x=0;
		  function draw() {
		    background("white");
			fill("black");

			<?php
				//on place les labels relatifs aux échantillons ajoutés
				if(isset($_POST["SendE"])){
					

					
					echo '
							text("Pom1",20,30);
							text("Pom2",20,80);
							text("Pom3",20,130);
							text("Chapeau",5,180);
							text("Caisse",20,230);
							text("Pied",20,280);
						';
					
					$cptN = 280;
					
					for($num = 0; $num < sizeof($echantillons); $num++){
			
						$string = 'echantillon'.$num;

						if(isset($_POST[$string])){
							$cptN = $cptN + 50;
							if(strlen($_POST[$string]) <= 6){
								echo 'text("'.$_POST[$string].'",20,'.($cptN).');';
							}else{
								if(strlen($_POST[$string]) >= 8){
									$stringRes = substr($_POST[$string],0,8); 
									echo 'text("'.$stringRes.'",1,'.($cptN).');';

								}else{
									echo 'text("'.$_POST[$string].'",1,'.($cptN).');';
								}
							}
						}
					}				
				}else{
					echo '
							text("Pom1",20,30);
							text("Pom2",20,80);
							text("Pom3",20,130);
							text("Chapeau",5,180);
							text("Caisse",20,230);
							text("Pied",20,280);
						';
				}
						
			?>
			
			boiteARythme.setBPM(document.getElementById("BPM").value);
			boiteARythme.setNbBeats(document.getElementById("nbBeats").value);
					
		    //grille(0,0,width,height,100,100);
		    boiteARythme.dessineToi();
		    
		    // On reexecute la fonction mainloop 60 fois/s
		    window.requestAnimationFrame(draw);
		  }
		  setup();
		
		  // Appelé dès que la page est chargée
		  draw();
		};
    </script>
<body>

<center>


<table><tr><td>
<?php 
	//on modifie la taille du canvas
	if(!isset($_POST["SendE"])){
		echo'<canvas id="myCanvas" width="1000" height="300">';
	}else{
		echo'<canvas id="myCanvas" width="1000" height="'.(300+($nb*50)).'">';
	}
?>
</canvas>

</td><td>

        <div class="row">
            <div class="span4 " >
                Frequencies:
                <canvas id="spectrum" width="150" height="128"
                style="display: block; background-color: black ;"></canvas>
            </div>
            <div class="span4 ">
                Spectrogram:
                <canvas id="spectrogram" width="150" height="128"
                        style="display: block; background-color: black ;"></canvas>
            </div>
            <div class="span4">
                Waveform:
                <canvas id="wave" width="150" height="128"
                        style="display: block; background-color: black ;"></canvas>
            </div>

        </div>
        </td></tr>


</table>


        <br/>
 <button id="play"><img src="../play.png"></button>
 <button id="pause"><img src="../pause.png"></button>
 <button id="stop"><img src="../stop.png"></button>
 <button id="son"><img src="../son.png"></button>
 <button id="sansSon"><img src="../sansSon.png"></button></br>
 BPM<input type="number" id="BPM" min="60" max="1000" value="100" step="2" >
 nbBeats<input type="number" id="nbBeats" min="1" max="64" value="16" step="1" ></br>
 

<input type="checkbox" id="c1" checked="false" onchange="boiteARythme.toggleFilter(this);">
<label for="c1"><span></span>Enable filter</label></p>

<p><input type="range" id="freq" min="0" max="1" step="0.01" value="1" onchange="boiteARythme.changeFrequency(this);"> Frequency</p>

<p><input type="range" id="qual" min="0" max="1" step="0.01" value="0" onchange="boiteARythme.changeQuality(this);"> Quality</p>

 <?php 
 
		
 		//on affiche le formulaire qie si pas de retour du bouton submit
 		if(!isset($_POST["SendE"])){
		
	 		echo '<p>Ajouter un &eacute;chantillon &agrave; la boite</p>
	 			  <FORM method=post action="">
					<SELECT name="echantillon0">
					';
			
			for($i = 1; $i < sizeof($echantillons)+1; $i++){
				//On propose l'ajout d'échantillons
				$stringToReplace   = array(".mp3", "../../Divers/Musiques/Echantillons/");
				$enchantillonNom = str_replace($stringToReplace, "", $echantillons[$i]);
				
				echo '
				Ajouter...<OPTION VALUE="'.$enchantillonNom.'">'.$enchantillonNom.'</OPTION>
				';
		
	
			}
			
			echo '
			</SELECT><br/>
			';
			
			if(isset($_POST["getAnotherEchantillon"])){
					$n = intval($nb);
									
					for( $j = 0; $j < ($n); $j++ ){
						$nomEch = 'echantillon'.($j+1);
						
						echo '
						<SELECT name="'.$nomEch.'">
						';
						
							for($i = 1; $i < sizeof($echantillons)+1; $i++){
								//On propose l'ajout d'échantillons
								$stringToReplace   = array(".mp3", "../../Divers/Musiques/Echantillons/");
								$enchantillonNom = str_replace($stringToReplace, "", $echantillons[$i]);
								echo '
								Ajouter...<OPTION VALUE="'.$enchantillonNom.'">'.$enchantillonNom.'</OPTION>
								';
									
							}
						
						echo '
						</SELECT><br/>
						';
					}
					
					$nb = $nb + 1;
			}
			
			// nb vaut 0 si un seul echantillons
			// 1 si 1... etc ...
			echo '
				<INPUT type = "submit" value = "&#8635;" name = "getAnotherEchantillon">
				<INPUT type = "hidden" value = "'.$nb.'" name = "nb">
				<INPUT type="submit" name="SendE" value="Envoyer">
			</FORM>';
			
 		}
 		
 
 ?>
 
 
</center>
</body>
</html>