function init() {

	// Object that draws a sample waveform in a canvas  
	waveformDrawer = new WaveformDrawer(); 
	

	//On recupère le context audio
	context = initAudioContext();
	//On crée un noeud pour analyser
	analyser = context.createAnalyser();
	//On crée un noeud pour relier analyser au context.destionation plus tard
	javascriptNode = context.createScriptProcessor(1024, 1, 1);
	
	javascriptNode.onaudioprocess = function () {
			//alert('audioProcess');
			draw(analyser);
	}	

	//On crée un noeud pour appliquer des filtres sur la source
	filter = context.createBiquadFilter();
	
	// Create a gain node
	gainNode = context.createGain();
	
	//Pour convertir la source en buffer
	bufferSource = context.createBufferSource();
	
	buildGraph();
}


function initAudioContext() {
    // Initialise the Audio Context
    // There can be only one!
    var audioContext = window.AudioContext || window.webkitAudioContext;
    var ctx = new audioContext();

    if(ctx === undefined) {
        throw new Error('AudioContext is not supported. :(');
    }

    return ctx;
}

function buildGraph() {

	myAudio = document.getElementById('audioCtx');

	//alert(myAudio);
	
	source = context.createMediaElementSource(myAudio);
	
	var request = new XMLHttpRequest();
	request.open('GET', chemin, true);
	request.responseType = 'arraybuffer';
	
	request.onload = function() {
		//On essaie de convertir la source en buffer
		context.decodeAudioData(request.response, function(buffer) {
				if (!buffer) {
					alert('error decoding file data: ' + chemin);
				}else{
					bufferSource = buffer;
					drawTrack(bufferSource);				
				}
			},function(error) {
				alert('decodeAudioData error');
			}
		);
	}
	
	request.onerror = function() {
        alert('BufferLoader: XMLHttpRequest error');
    }
	
	request.send();
	
	source.connect(gainNode);
	
	gainNode.connect(filter);
	
	filter.connect(analyser);
	
	analyser.connect(javascriptNode);
	
	
	filter.connect(context.destination);
	
	javascriptNode.connect(context.destination);
	
	
		
}


function startAudio(cas){
	
	alert(1);

	if(cas == 1){
		source.start(0,0);
		pause = false;
		
	}else if(cas == 2){
		
		if(pause == true){
			//On repart de là où on en était
			source.start(0,currentTime);
			pause = false;
		}else{
			//On recupère le temps courant
			currentTime = document.getElementById('audioCtx').currentTime;
			//On stoppe
			source.stop(0);
			pause = true;
		}
	}else if(cas == 3){
		//On stoppe
		source.stop(0);
		pause = false;
		currentTime = 0;	
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
	
	
	
    canvas = document.getElementById('spectre');
	context2 = canvas.getContext('2d');
	
    width = canvas.width;
    height = canvas.height;
    barWidth = 10;
    barSpacing = 2;
 
    context2.clearRect(0, 0, width, height);
    frequencyData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(frequencyData);
	//alert(frequencyData);
	
    barCount = Math.round(width / (barWidth + barSpacing));
    loopStep = Math.floor(frequencyData.length / barCount);
 
    for (i = 0; i < barCount; i++) {
		
        barHeight = frequencyData[i * loopStep];		
        //alert(barHeight);
		hue = parseInt(120 * (1 - (barHeight / 255)), 10);
        context2.fillStyle = 'hsl(' + hue + ',75%,50%)';
        context2.fillRect(((barWidth + barSpacing) * i) + (barSpacing / 2), height, barWidth - barSpacing, -barHeight);
    }
}



/**
*	POUR DESSINER LES COURBES
*	@see loadBuffer()
**/
function drawTrack(decodedBuffer){

	//var canvas = document.getElementById('canvasFront');
	var canvas = document.getElementById('spectreLong');
	
	waveformDrawer.init(decodedBuffer, canvas, 'red');  
	// First parameter = Y position (top left corner)
	// second = height of the sample drawing
	waveformDrawer.drawWave(0, canvas.height);
}  
