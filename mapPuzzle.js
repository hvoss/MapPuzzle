var zIndex = 0;

function randomJigsaw(width, height) {
	var returnArr = new Array(height);
	var exceptArr = new Array(width * height);
	var i = 0;
	for(var y = 0; y < height; y++) {
		returnArr[y] = new Array(width);
		for(var x = 0; x < width; x++) {
			returnArr[y][x] = randomNumberBetweenButNot(0, width * height - 1, exceptArr);
			exceptArr[i++] = returnArr[y][x];
		}
	}
	return returnArr;
}

function randomNumberBetweenButNot(start, end, exceptArr) {
	var number = -1;

	do {
		number = start + Math.floor((end - start + 1) * Math.random());
	} while (jQuery.inArray(number, exceptArr) > -1);

	return number;
}

function checkJigsaw() {
	var toReturn = true;

	$("#jigsaw .jigsawPiecePlace").each(function(key, place) {
		var pieces = $(place).children(".jigsawPiece");
		if (pieces.length != 1) {
			toReturn = false;
			return;
		}

		if ($(pieces[0]).data('nr') != $(place).data('nr')) {
			toReturn = false;
			return;
		}
	});

	return toReturn;
}





function initOpenLayers() {
    map = new OpenLayers.Map("map");
    layer = new OpenLayers.Layer.Stamen("watercolor");
    map.addLayer(layer);
    
}

function initLayerSelection() {
	var coordinateX = 17185;
	var coordinateY = 10662;
	var layers = new Array(
		new OpenLayers.Layer.Stamen("watercolor"),
		new OpenLayers.Layer.Stamen("toner"),
		new OpenLayers.Layer.OSM()
	);

	var selection = $("#layerSelection");
	$.each(layers, function(key, l) {
		var url = l.url[0]
		        .replace("${z}", 15)
		        .replace("${x}", coordinateX)
		        .replace("${y}", coordinateY)
		$("<img />")
			.attr("src", url)
			.addClass("selection")
			.click(function() {
				map.removeLayer(layer);
				layer = l;
				map.addLayer(layer);
			})
			.appendTo($("<li />").appendTo(selection));

	});

	console.log(layers);
}


function initPOI() {
	var fromProjection = new OpenLayers.Projection("EPSG:4326");   // Transform from WGS 1984
    var toProjection   = new OpenLayers.Projection("EPSG:900913"); // to Spherical Mercator Projection
    var zoom           = 15;

	var pois = {
		"Bremen": new OpenLayers.LonLat(8.80,53.08).transform( fromProjection, toProjection),
		"Berlin": new OpenLayers.LonLat(13.41,52.52).transform( fromProjection, toProjection),
		"Lengerich": new OpenLayers.LonLat(7.86,52.19).transform( fromProjection, toProjection)
	};
	console.log(pois);

	$.each(pois, function(name, position) {
		var poi = $("<li />")
						.text(name)
						.click(function() {
							map.setCenter(position, zoom);
							console.log(map);
						})
						.appendTo('#poiList');
	});

	map.setCenter(pois["Bremen"], zoom);
}

function clipTiles(tiles, factor) {
	var height = tiles.length;
	var width = tiles[0].length;
	
	var newHeight = height * factor;
	var newWidth = width * factor;

	var newTiles = new Array(newHeight);
	for (var newY = 0; newY < newHeight; newY++) {
		newTiles[newY] = new Array(newWidth);
		for (var newX = 0; newX < newWidth; newX++) {
			var x = Math.floor(newX / factor);
			var y = Math.floor(newY / factor);

			var rX = newX - factor * x;
			var rY = newY - factor * y;

			var oldImg = $(tiles[y][x]);
			var oldSize = oldImg.width();
			var newSize = oldSize / factor;

			var clip1 = (rY / factor) * oldSize;
			var clip2 = ((rX + 1) / factor) * oldSize;
			var clip3 = ((rY + 1) / factor) * oldSize;
			var clip4 = (rX / factor) * oldSize;

			var img = newTiles[newY][newX] = $("<img />");
			img.attr("src", oldImg.attr("src"))
			   .css("clip", "rect("+clip1+"px, "+clip2+"px, "+clip3+"px, "+clip4+"px)")
			   .css("position", "absolute")
			   .css("top", "-" + clip1 + "px")
			   .css("left", "-" + clip4 + "px");

		}
	}

	return newTiles;
}

function createJigsaw() {
	var tiles = getTilesFromMap();
	var factor = 3;

	tiles = clipTiles(tiles, factor);


	var height = tiles.length;
	var width = tiles[0].length;
	var jigsaw = randomJigsaw(width, height);

	var pieceSize = 256 / factor;
	var pieceBorder = 1;


	var jigsawWidth = (pieceSize + 2 * pieceBorder) * width;
	var jigsawHeight = (pieceSize + 2 * pieceBorder) * height;

	$("#jigsawPieces").empty();
	$("#jigsaw").empty();

	$("#jigsawPieces").width(jigsawWidth)
					  .height(jigsawHeight)
					  .droppable({
			   			drop: function(event, ui) {
			   				if (ui.draggable.parent().get(0) != this) {
				   				ui.draggable.appendTo(this)
						   					.css("left", ui.offset.left - $(this).offset().left)
						   					.css("top", ui.offset.top - $(this).offset().top);
					   		}
			   			}
			   		});

	$("#jigsaw").width(pieceSize * width);
	$("#jigsaw").height(pieceSize * height);

	for (var y = 0; y < height; y++) {
		for (var x = 0; x < width; x++) {
			var nr = y * height + x;
			var screenX = (pieceSize + 2 * pieceBorder) * (jigsaw[y][x] % width);
			var screenY = (pieceSize + 2 * pieceBorder) * Math.floor(jigsaw[y][x] / width);

		    var piece = $("<div />")
		    	  .appendTo("#jigsawPieces")
		    	  .append(tiles[y][x])
		    	  .width(pieceSize)
		    	  .height(pieceSize)
		    	  .addClass("jigsawPiece")
		    	  .css("top", screenY)
		    	  .css("left", screenX)
		    	  .data('nr', nr)
		    	  .draggable({
		    	  	start: function() {
		    	  			$(this).zIndex(++zIndex);
		    	  		},
		    	  	revert: function() {
		    	  		console.log($(this).cover(".jigsawPiecePlace"));
		    	  		return 	$(this).cover("#jigsawPieces").length == 0 && $(this).cover(".jigsawPiecePlace").length == 0;
		    	  	}
				  });

		   	var place = $("<div />")
		   		.width(pieceSize)
		   		.height(pieceSize)
		   		.addClass("jigsawPiecePlace")
		   		.appendTo("#jigsaw")
		    	.css("top", pieceSize * y)
		    	.css("left", pieceSize * x)
		    	.data('nr', nr)
		   		.droppable({
		   			drop: function(event, ui) {
		   				ui.draggable
		   					.appendTo(this)
		   					.css("left", "0px")
		   					.css("top", "0px");
		   			}
		   		});
		}
	}

	$("#pageJigsaw").toggle();
	$("#pageSelection").toggle();
}

function getTilesFromMap() {
	var tiles = $('#map').overlaps('.olTileImage');
	var sortedTiles = new Array();
	var leftArr = new Array();
	var topArr = new Array();
	var jigsaw;

	$.each(tiles, function(key, tile) {
		if ($(tile).parent('.olBackBuffer').length == 0) {
			var left = $(tile).css('left');
			var top = $(tile).css('top');
			left = parseInt(left.substr(0, left.length - 2));
			top = parseInt(top.substr(0, top.length - 2));

			if ($.inArray(top, topArr) == -1) {
				sortedTiles[top] = new Array();
				topArr.push(top);
			}

			if ($.inArray(left, leftArr) == -1) {
				leftArr.push(left);
			}

			sortedTiles[top][left] = tile;
		}
	});

	leftArr.sort(function(a, b) { return a - b; });
	topArr.sort(function(a, b) { return a - b; });
	jigsaw = new Array(topArr.length);
	for (var y = 0; y < topArr.length; y++) {
		jigsaw[y] = new Array(leftArr.length);
		for (var x = 0; x < leftArr.length; x++) {
			jigsaw[y][x] = sortedTiles[topArr[y]][leftArr[x]];
		}
	}

	return jigsaw;
}

function gotoSelection() {
	$("#pageJigsaw").toggle();
	$("#pageSelection").toggle();
}


$(function() {
	initOpenLayers();
	initPOI();
	initLayerSelection();
});