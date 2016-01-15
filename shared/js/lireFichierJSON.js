//Pour récupérer un paramètre de l'url
function getParamValue(param,url){
	var reg = new RegExp('(\\?|&|^)'+param+'=(.*?)(&|$)');
	matches = url.match(reg);
	return matches[2] != undefined ? decodeURIComponent(matches[2]).replace(/\+/g,' ') : '';
}

// Necessite le nom de l'utilisateur et l'id de la chanson !!!!!
id = parseInt(getParamValue("id",document.location.href));
//auteur = getParamValue("auteur",document.location.href);
//alert("id="+id);

//On met le lien en rouge de la musique courante (on sauvegarde son id)
href = "href"+id;


//On prépare les variables pour stocker les informations de la chanson choisie par les paramètres de l'url
format = "";
titre = "";
duree = "";
genre = "";
dateAjout = "";
titreOriginal = "";
auteurOriginal = "";
auteur = "";

//Pour récupérer les informations de la chanson
function infoChanson(){ 

   if (req.readyState == 4) 
   { 
        doc = eval('(' + req.responseText + ')');
		
		//accès aux données
		format = doc.listSongs[id].format;
		titre = doc.listSongs[id].titre;
		duree = doc.listSongs[id].duree;
		genre = doc.listSongs[id].genre;
		dateAjout = doc.listSongs[id].dateAjout;
		titreOriginal = doc.listSongs[id].titreOriginal;
		auteurOriginal = doc.listSongs[id].auteurOriginal;
		auteur = doc.listSongs[id].auteur;
		
		/**
		alert("format="+format);
		alert("titre="+titre);
		alert("duree="+duree);
		alert("genre="+genre);
		alert("dateAjout="+dateAjout);
		alert("titreOriginal="+titreOriginal);
		alert("auteurOriginal="+auteurOriginal);
		alert("auteur="+auteur);
		**/

		setInformation();
		setOtherSongsOfAuthor();

   }
}


//Pour lire le fichier json concernant les informations des chansons
var req = new XMLHttpRequest();
req.open("GET", "./Songs/song.json", true);
req.onreadystatechange = infoChanson;   // la fonction de prise en charge
req.send(null);

function setInformation(){
		//accès aux données
		
		var res = "<h5>Informations</h5>";
		res = res + "<p> Titre:"+titre+"</p>";
		res = res + "<p> Compose par:"+auteur+"</p>";
		res = res + "<p> Date d'ajout:"+dateAjout+"</p>";
		res = res + "<p> Format:"+format+"</p>";
		res = res + "<p> Duree:"+duree+"</p>";
		res = res + "<p> Genre:"+genre+"</p>";
		res = res + "<p> Titre original:"+titreOriginal+"</p>";
		res = res + "<p> Auteur original:"+auteurOriginal+"</p>";
		
		document.getElementById('infosSong').innerHTML = res;

}

function setOtherSongsOfAuthor(){

	//NB de données( dans le fichier JSON
	sizeJSON = 7;
	
	var res = "<h5>Autres musiques de l'auteur</h5>";
	
	for(var i = 0; i < sizeJSON; i++){
	
	//alert(doc.listSongs[i].auteur);
	
		if((auteur == doc.listSongs[i].auteur)){
		
			authorSongs[i] = doc.listSongs[i].titre;
			res = res + "<a id='href"+i+"' href='"+window.location.href.replace('id='+id,'id='+i)+"'> Titre: "+authorSongs[i]+"</a><br/>";
		}
	
	}

	document.getElementById('otherSongOfUser').innerHTML = res;
	
	document.getElementById(href).style.color = "red";
}
