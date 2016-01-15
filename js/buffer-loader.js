tmpBuffer = "0";

function BufferLoader(context, urlList, callback, callbackDraw) {
    this.context = context;
    this.urlList = urlList;
    this.onload = callback;
    this.bufferList = new Array();
    this.loadCount = 0;
}

BufferLoader.prototype.loadBuffer = function(url, index) {
    // Load buffer asynchronously
    console.log('file : ' + url + "loading and decoding");

    var request = new XMLHttpRequest();
    request.open("GET", url, true);

    request.responseType = "arraybuffer";

    var loader = this;

    request.onload = function() {

        // Asynchronously decode the audio file data in request.response
        loader.context.decodeAudioData(
                request.response,
                function(buffer) {
                    if (!buffer) {
                        alert('error decoding file data: ' + url);
                        return;
                    }
                    loader.bufferList[index] = buffer;
					
					tmpBuffer = buffer;
					
					//alert(buffer);
					//alert(loader.bufferList[index]);
					
                    console.log("In bufferLoader.onload bufferList size is " + loader.bufferList.length + " index =" + index);
                    if (++loader.loadCount == loader.urlList.length){
                        loader.onload(loader.bufferList);
					}
					
					
					
					
					
					/**
					*	POUR DESSINER LES COURBES
					*	@see drawTrack()
					**/
					drawTrack(tmpBuffer,nbInstrumentsMusique,index);
					
					
					
					
                },
                function(error) {
                    console.error('decodeAudioData error', error);
                }
        );
		  

    }

    request.onprogress = function(e) {
        //console.log("loaded : " + e.loaded + " total : " + e.total);

    }
    request.onerror = function() {
        alert('BufferLoader: XHR error');
    }

    request.send();
}





BufferLoader.prototype.load = function() {
    // M.BUFFA added these two lines.
    this.bufferList = new Array();
    this.loadCount = 0;
    console.log("BufferLoader.prototype.load urlList size = " + this.urlList.length);
    for (var i = 0; i < this.urlList.length; ++i){
        this.loadBuffer(this.urlList[i], i);
	}
		
}











/**
*	POUR DESSINER LES COURBES
*	@see loadBuffer()
**/
function drawTrack(decodedBuffer,nb,nbI){	
	//alert("decodedBuffer ="+decodedBuffer);
	//alert("nb ="+nb);
	//alert("nbI ="+nbI);
	
	//var canvas = document.getElementById('canvasFront');
	var canvas = document.getElementById('myCanvas');
	
	waveformDrawer.init(decodedBuffer, canvas, 'green');  
	// First parameter = Y position (top left corner)
	// second = height of the sample drawing
	waveformDrawer.drawWave((((canvas.height/nb)*(nbI))+(canvas.height/nb)*0.2), ((canvas.height/nb)-(canvas.height/nb)*0.4));
	//waveformDrawer.drawWave(0, canvas.height);
}  


