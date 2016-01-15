var context;
var source = null;
var audioBuffer = null;
// Les echantillons prêts à être joués, de toutes les pistes
var tracks = [];
var buffers = []; // audio buffers decoded
var samples = []; // audiograph nodes

var analysers = [];

// Master volume
var masterVolumeNode;
var trackVolumeNodes = [];
var distortionNodes = [];

var buttonPlay, buttonStop, buttonPause;
var masterVolumeSlider;
// List of tracks and mute buttons
var divTrack;

var canvas, ctx;
var frontCanvas, frontCtx;

// Sample size in pixels
var SAMPLE_HEIGHT = 100;

// Useful for memorizing when we paused the song
var lastTime = 0;
var currentTime;
var delta;

var elapsedTimeSinceStart = 0;

var paused = true;

// requestAnim shim layer by Paul Irish, like that canvas animation works
// in all browsers
window.requestAnimFrame = (function() {
    return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function(/* function */ callback, /* DOMElement */ element) {
                window.setTimeout(callback, 1000 / 60);
            };
})();


function init() {

	// Object that draws a sample waveform in a canvas  
	waveformDrawer = new WaveformDrawer(); 


    // Get handles on buttons
    buttonPlay = document.querySelector("#bplay");
    buttonPause = document.querySelector("#bpause");
    buttonStop = document.querySelector("#bstop");

    divTrack = document.getElementById("tracks");


    // canvas where we draw the samples
    canvas = document.querySelector("#myCanvas");
    ctx = canvas.getContext('2d');

    // Create a second canvas
    frontCanvas = document.createElement('canvas');
    frontCanvas.id = 'canvasFront';
    // Add it as a second child of the mainCanvas parent.
    canvas.parentNode.appendChild(frontCanvas);
    // make it same size as its brother
    frontCanvas.height = canvas.height;
    frontCanvas.width = canvas.width;
    frontCtx = frontCanvas.getContext('2d');

    frontCanvas.addEventListener("mousedown", function(event) {
        console.log("mouse click on canvas, let's jump to another position in the song")
        var mousePos = getMousePos(frontCanvas, event);
        // will compute time from mouse pos and start playing from there...
        jumpTo(mousePos);
    })

    // Master volume slider
    masterVolumeSlider = document.querySelector("#masterVolume");

    // Init audio context
    context = initAudioContext();
	
	// Create a filter
	filter = context.createBiquadFilter();
    
    // Get the list of the songs available on the server and build a 
    // drop down menu
    loadSongList();

    animateTime();
}


function initAudioContext() {
    // Initialise the Audio Context
    // There can be only one!
    var audioContext = window.AudioContext || window.webkitAudioContext;

    var ctx = new audioContext();
	
	//alert(ctx);
	analyser = ctx.createAnalyser();
	javascriptNode = ctx.createScriptProcessor(1024, 1, 1);
	//distortion = ctx.createWaveShaper();
	


    if(ctx === undefined) {
        throw new Error('AudioContext is not supported. :(');
    }

    return ctx;
}
// SOUNDS AUDIO ETC.


function resetAllBeforeLoadingANewSong() {
    // Marche pas, c'est pour tester...
    console.log('resetAllBeforeLoadingANewSong');
    // reset array of tracks. If we don't do this we just add new samples to existing
    // ones... playing two songs at the same time etc.
    tracks = [];

    stopAllTracks();
    buttonPlay.disabled = true;
    divTrack.innerHTML="";
    /*
    samples.forEach(function(s) {
        s.stop(0);
        s.disconnect(0);
    });*/
}

var bufferLoader;
function loadAllSoundSamples(tracks) {


    bufferLoader = new BufferLoader(
            context,
            tracks,
            finishedLoading
            );
    bufferLoader.load();
	
}

function finishedLoading(bufferList) {
    console.log("finished loading");
    
    buffers = bufferList;
    buttonPlay.disabled = false;
}

function buildGraph(bufferList) {
    var sources = [];
    // Create a single gain node for master volume
    masterVolumeNode = context.createGain();
    console.log("in build graph, bufferList.size = " + bufferList.length);	
	
    bufferList.forEach(function(sample, i) {
		
		//init context pour la distortion
		distortionNodes[i] = context.createWaveShaper();
		
		
		// each sound sample is the  source of a graph
        sources[i] = context.createBufferSource();
        sources[i].buffer = sample;
        // connect each sound sample to a vomume node
        trackVolumeNodes[i] = context.createGain();
        // Connect the sound sample to its volume node
        sources[i].connect(trackVolumeNodes[i]);
        // Connects all track volume nodes a single master volume node
        //trackVolumeNodes[i].connect(masterVolumeNode);
		trackVolumeNodes[i].connect(distortionNodes[i]);
		
		
		distortionNodes[i].connect(masterVolumeNode);
		
        //masterVolumeNode.connect(distortion);
		
		//distortion.connect(filter);
		
		masterVolumeNode.connect(filter);
		
		// Note: the Web Audio spec is moving from constants to strings.
		// filter.type = 'lowpass';
		filter.type = filter.LOWPASS;
		filter.frequency.value = 1000;
		
		// Connect the master volume to the speakers
		filter.connect(context.destination);
		filter.connect(analyser);
		analyser.connect(javascriptNode);	
		javascriptNode.connect(context.destination);
		
				
        // On active les boutons start et stop
        samples = sources;
    });	
	
	
	//alert(ctx);
	//alert(context);
	
}

// ######### SONGS
function loadSongList() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', "track", true);

    // Menu for song selection
    var s = $("<select/>");
    s.appendTo("#songs");
    s.change(function(e) {
        console.log("You chose : " + $(this).val());
        loadTrackList($(this).val());
    });

    xhr.onload = function(e) {
        var songList = JSON.parse(this.response);

        songList.forEach(function(songName) {
            console.log(songName);

            $("<option />", {value: songName, text: songName}).appendTo(s);


            /*
            var list = document.getElementById("songs");
            var li = document.createElement('li');
            li.textContent = songName;
            button = document.createElement('button');
            button.setAttribute("onclick", "loadTrackList('" + songName + "');");
            button.textContent = "load";
            li.appendChild(button);
            list.appendChild(li);
            */
        });
    };
    xhr.send();
}


// ######## TRACKS
function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

function getTrackName(elem) {
// returns the name without the suffix
    var n = elem.lastIndexOf(".");
    return elem.slice(0, n + 1);
}

function loadTrackList(songName) {
resetAllBeforeLoadingANewSong();

    var xhr = new XMLHttpRequest();
    xhr.open('GET', "track/" + songName, true);
    xhr.onload = function(e) {
        var track = JSON.parse(this.response);
        // resize canvas depending on number of samples
        resizeSampleCanvas(track.instruments.length);
        var i = 0;
		
		nbInstrumentsMusique = 0;

        track.instruments.forEach(function(instrument, trackNumber) {
            // Image
            console.log("on a une image");
            // Render HTMl
            var span = document.createElement('span');
            var imageURL = "track/" + songName + "/visualisation/" + instrument.visualisation;

            span.innerHTML = instrument.name +
                    "<button id='mute" + trackNumber + "' onclick='muteUnmuteTrack(" + trackNumber + ");'>Mute</button><br/>"
                    /*
                    +
                    "<img class='sample' src='" + imageURL + "'/><br/>";
                    */
            drawSampleImage(imageURL, trackNumber, instrument.name);
            divTrack.appendChild(span);

            // Audio
            console.log("on a un fichier audio");
            // load audio dans un tableau...
            var url = "track/" + songName + "/sound/" + instrument.sound;
            tracks.push(url);
            console.log("Ajout piste audio " + instrument.name);
            
			nbInstrumentsMusique = nbInstrumentsMusique + 1;
        });
        loadAllSoundSamples(tracks);
		//alert("Nombre d'instruments de la musique courante: "+nbInstrumentsMusique);
    };
    xhr.send();
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

 function jumpTo(mousePos) {
    console.log("in jumpTo x = " + mousePos.x + " y = " + mousePos.y);
    // width - totalTime
    // x - ?
       stopAllTracks();
    var totalTime = buffers[0].duration;
    var startTime = (mousePos.x * totalTime) / frontCanvas.width;
	elapsedTimeSinceStart = startTime;
    playAllTracks(startTime);
 }

function animateTime() {
    if (!paused) {
        // Draw the time on the front canvas
        currentTime = context.currentTime;
        var delta = currentTime - lastTime;


        var totalTime;

        frontCtx.clearRect(0, 0, canvas.width, canvas.height);
        frontCtx.fillStyle = 'white';
        frontCtx.font = '14pt Arial';
        frontCtx.fillText(elapsedTimeSinceStart.toPrecision(4), 100, 20);
        //console.log("dans animate");

        // at least one track has been loaded
        if (buffers[0] != undefined) {

            var totalTime = buffers[0].duration;
            var x = elapsedTimeSinceStart * canvas.width / totalTime;

            frontCtx.strokeStyle = "white";
            frontCtx.lineWidth = 3;
            frontCtx.beginPath();
            frontCtx.moveTo(x, 0);
            frontCtx.lineTo(x, canvas.height);
            frontCtx.stroke();

            elapsedTimeSinceStart += delta;
            lastTime = currentTime;
        }
    }
    requestAnimFrame(animateTime);
}

function drawSampleImage(imageURL, trackNumber, trackName) {
    var image = new Image();

    image.onload = function() {
        // SAMPLE_HEIGHT pixels height
        var x = 0;
        var y = trackNumber * SAMPLE_HEIGHT;
        ctx.drawImage(image, x, y, canvas.width, SAMPLE_HEIGHT);

        ctx.strokeStyle = "white";
        ctx.strokeRect(x, y, canvas.width, SAMPLE_HEIGHT);

        ctx.font = '14pt Arial';
        ctx.fillStyle = 'white';
        ctx.fillText(trackName, x + 10, y + 20);
    }
    image.src = imageURL;
}

function resizeSampleCanvas(numTracks) {
    canvas.height = SAMPLE_HEIGHT * numTracks;
    frontCanvas.height = canvas.height;
}
function clearAllSampleDrawings() {
    //ctx.clearRect(0,0, canvas.width, canvas.height);
}

function loadSong(song) {
    loadTrackList(song);
}

function playAllTracks(startTime) {

    buildGraph(buffers);

    playFrom(startTime);

}

// Same as previous one except that we not rebuild the graph. Useful for jumping from one
// part of the song to another one, i.e. when we click the mouse on the sample graph
function playFrom(startTime) {
  // Read current master volume slider position and set the volume
  setMasterVolume()
  
	samples.forEach(function(s) {
		// First parameter is the delay before playing the sample
		// second one is the offset in the song, in seconds, can be 2.3456
		// very high precision !
        s.start(0, startTime);
    })
	
	/**
	 *
	 * Auteur: Benjamin
	 * SI ON DETECTE UN SON, ON DESSINE
	 *
	**/
	javascriptNode.onaudioprocess = function () {
	
		draw(analyser);

	}
	
	
    buttonPlay.disabled = true;
    buttonStop.disabled = false;
    buttonPause.disabled = false;
	buttonDistortion.disabled = false;
	buttonFilter.disabled = false;

    // Note : we memorise the current time, context.currentTime always
    // goes forward, it's a high precision timer
    console.log("start all tracks startTime =" + startTime);
    lastTime = context.currentTime;
    paused = false;
		
}

function stopAllTracks() {
    samples.forEach(function(s) {
		// destroy the nodes
        s.stop(0);
    });
	
	//masterVolumeNode.disconect(0);
	//distortion.disconnet(0);
	filter.disconnect(0);
	//analyser.disconnect(0);
	//javascriptNode.disconnect(0);
		
    buttonStop.disabled = true;
    buttonPause.disabled = true;
    buttonPlay.disabled = false;
	buttonDistortion.disabled = true;
	buttonFilter.disabled = true;
    elapsedTimeSinceStart = 0;
    paused = true;
}

function pauseAllTracks() {
    if (!paused) {
        // Then stop playing
        samples.forEach(function(s) {
			// destroy the nodes
            s.stop(0);
        });
		
		//masterVolumeNode.disconect(0);
		//distortion.disconnet(0);
		filter.disconnect(0);
		//analyser.disconnect(0);
		//javascriptNode.disconnect(0);
		
		
		
        paused = true;
        buttonPause.innerHTML = "Resume";
		buttonDistortion.disabled = true;
		buttonFilter.disabled = true;
    } else {
        paused = false;
		// we were in pause, let's start again from where we paused
        playAllTracks(elapsedTimeSinceStart);
        buttonPause.innerHTML = "Pause";
		buttonDistortion.disabled = false;
		buttonFilter.disabled = false;
    }
}

function setMasterVolume() {

   var fraction = parseInt(masterVolumeSlider.value) / parseInt(masterVolumeSlider.max);
    // Let's use an x*x curve (x-squared) since simple linear (x) does not
    // sound as good.
    if( masterVolumeNode != undefined)
        masterVolumeNode.gain.value = fraction * fraction;
}

function changeMasterVolume() {
   setMasterVolume();
}


function muteUnmuteTrack(trackNumber) {
// AThe mute / unmute button
    var b = document.querySelector("#mute" + trackNumber);
    if (trackVolumeNodes[trackNumber].gain.value == 1) {
        trackVolumeNodes[trackNumber].gain.value = 0;
        b.innerHTML = "Unmute";
    } else {
        trackVolumeNodes[trackNumber].gain.value = 1;
        b.innerHTML = "Mute";
    }

}


/* PARTIE FILTER */

function changeFrequency(freq) {
	//alert(parseInt(freq));
	filter.frequency.value = parseInt(freq);
	document.getElementById('valFrequency').innerHTML = freq + " / 3000";
}

function changeQuality(qual) {
	//alert(parseInt(qual));
	filter.Q.value = parseInt(qual);
	document.getElementById('valQuality').innerHTML = qual + " / 100";
}

function changeGain(gainVal) {
	//alert(parseInt(gainVal));
	filter.gain.value = parseInt(gainVal);
	document.getElementById('valGain').innerHTML = gainVal + " / 100";
}

function changeEffect(name) {

	//alert(name);
	document.getElementById('gainRangeTest').style.display = 'none';
	document.getElementById('txtGain').style.display = 'none';
	document.getElementById('valGain').style.display = 'none';
	document.getElementById('qualityRangeTest').style.display = 'inherit';
	document.getElementById('txtQuality').style.display = 'inherit';
	document.getElementById('valQuality').style.display = 'inherit';

    if (name == "lowpass"){
		filter.type = name
		//PAS DE GAIN
	}else if (name == "highpass"){
		filter.type = name
		//PAS DE GAIN
	}else if (name == "bandpass"){
		filter.type = name
		//PAS DE GAIN
	}else if (name == "lowshelf"){
		filter.type = name
		//PAS DE QUALITE
		document.getElementById('qualityRangeTest').style.display = 'none';
		document.getElementById('txtQuality').style.display = 'none';
		document.getElementById('valQuality').style.display = 'none';
		document.getElementById('gainRangeTest').style.display = 'inherit';
		document.getElementById('txtGain').style.display = 'inherit';
		document.getElementById('valGain').style.display = 'inherit';
	}else if (name == "highshelf"){
		filter.type = name
		//PAS DE QUALITE
		document.getElementById('qualityRangeTest').style.display = 'none';
		document.getElementById('txtQuality').style.display = 'none';
		document.getElementById('valQuality').style.display = 'none';
		document.getElementById('gainRangeTest').style.display = 'inherit';
		document.getElementById('txtGain').style.display = 'inherit';
		document.getElementById('valGain').style.display = 'inherit';
	}else if (name == "peaking"){
		filter.type = name
		document.getElementById('gainRangeTest').style.display = 'inherit';
		document.getElementById('txtGain').style.display = 'inherit';
		document.getElementById('valGain').style.display = 'inherit';
	}else if (name == "notch"){
		filter.type = name
		//PAS DE GAIN
	}else if (name == "allpass"){
		filter.type = name
		//PAS DE GAIN
	}

}

function disableFilter(){
	alert('Non Implémenté!');
}



/* PARTIE SPECTRUM */

function draw(analyser) {
    var canvas, context2, width, height, barWidth, barHeight, barSpacing, frequencyData, barCount, loopStep, i, hue;
	
    canvas = $('canvas')[1];
	context2 = canvas.getContext('2d');
	
    width = canvas.width;
    height = canvas.height;
    barWidth = 10;
    barSpacing = 2;
 
    context2.clearRect(0, 0, width, height);
    frequencyData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(frequencyData);
	
    barCount = Math.round(width / (barWidth + barSpacing));
    loopStep = Math.floor(frequencyData.length / barCount);
 
    for (i = 0; i < barCount; i++) {
	
        barHeight = frequencyData[i * loopStep];		
        hue = parseInt(120 * (1 - (barHeight / 255)), 10);
        context2.fillStyle = 'hsl(' + hue + ',75%,50%)';
        context2.fillRect(((barWidth + barSpacing) * i) + (barSpacing / 2), height, barWidth - barSpacing, -barHeight);
    }
}

/* PARTIE DISTORTION */

function makeDistortionCurve(amount) {

	//alert(amount);

  var k = typeof amount === 'number' ? amount : 50,
    n_samples = 44100,
    curve = new Float32Array(n_samples),
    deg = Math.PI / 180,
    i = 0,
    x;
  for ( ; i < n_samples; ++i ) {
    x = i * 2 / n_samples - 1;
    curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) );
  }
  return curve;
}

function makeDistortion(amount,delay,numInstru) {
	
	//alert(amount+":"+delay+":"+numInstru);
	
	//alert(distortion.oversample);

	if(parseInt(delay) == 0){
		
		distortionNodes[parseInt(numInstru)].curve = makeDistortionCurve(parseInt(amount));
		if(amount != 0){
			distortionNodes[parseInt(numInstru)].oversample = '4x';
		}else{
			distortionNodes[parseInt(numInstru)].oversample = 'none';
		}
	}else{
		distortionNodes[parseInt(numInstru)].curve = makeDistortionCurve(parseInt(amount));
		distortionNodes[parseInt(numInstru)].oversample = '4x';

		setTimeout(function(){ 
			makeDistortion(0,0,parseInt(numInstru));
		}, parseInt(delay));
	}
}

function changeDistortion(gainDistortion) {
	//alert(gainDistortion);
	document.getElementById('valDistortion').innerHTML = gainDistortion + " / 2000 (Sur context.destination)";
}
