var OZA = {
    latestImagesStartIndex: 0,
    latestImagesPageSize: 50,
    currentClassification: new Object(),
    currentTaxonName: '',
    currentRank: '',
    exploreGroupWithGalleryStartIndex: 0,
    exploreGroupWithGalleryPageSize: 50,
    isNative: false,
    circle: null,
    marker: null,
    map: null,
    mapInitialised: false,
    currentLatitude: -26,
    currentLongitude: 134,
    defaultZoom: 3,
    currentGroup: null,
    currentGroupStartIndex: 0,
    groupPageSize: 25,
    usingExploreYourArea: true,
    currentLatLongRadius: '',
    recordSent: false,
    useLifeFormExplorer: true,
    noOfImagesToShow: 1,
    showImagesInSearch: false,
    useLargerImages: false,
    photoSwipe: null,
    lastExploreQueryEmpty: false 
}

var DEFAULT_BOUNDS = new google.maps.LatLngBounds(new google.maps.LatLng(-41, 118), new google.maps.LatLng(-14, 148));

var M_URL = 'https://m.ala.org.au';

function setupPhotoSwipe(galleryId){
	if(OZA.photoSwipe != null){
		console.log('Clearing existing photoswipe gallery');
		//window.Code.PhotoSwipe.unsetActivateInstance(OZA.photoSwipe);
		//window.Code.PhotoSwipe.detach(OZA.photoSwipe); 	
		//OZA.photoSwipe.dispose();
	}
    OZA.photoSwipe = $('#' + galleryId +' a').photoSwipe({
        enableMouseWheel: false,
        enableKeyboard: false
    });
//    window.Code.PhotoSwipe.attach(OZA.photoSwipe); 	
    
}

function initialiseFromConfig() {

    //if display large, use better quality images              
    console.log("Window width:" + $(window).width() + ", height: "+ $(window).height());
    if ($(window).width() > 400) {
        console.log("Use large images....");
        OZA.useLargerImages = true;
    }

    if ($(window).width() < 500 ||  $(window).height() < 750) {
        console.log("Use small images for landing background....");
        $('#home').removeClass('largeBackgroundImage');
        $('#home').addClass('smallBackgroundImage');
    }

    console.log("isNative: " + OZA.isNative);
    if (!OZA.isNative) {
        //disable saved list functionality - only available in native apps.
        $('#saveCurrentList').css({
            'display': 'none'
        });
        $('#savedListHomePage').css({
            'display': 'none'
        });
        $('#savedListConfig').css({
            'display': 'none'
        });
    }

    document.getElementById('photofs').addEventListener('change', handleImageSelect, false);

    //get the explore stored preference              
    $('input:radio[name=radio-group-browser-selector]')[0].checked = true;
    var useLifeformForExplore = localStorage.getItem('ala-useLifeFormExplorer');
    console.log('Stored preference for useLifeformForExplore: ' + useLifeformForExplore);

    if (useLifeformForExplore == null || useLifeformForExplore == 'useLifeForm') {
        console.log('Setting radio button to group');
        $('input:radio[name=radio-group-browser-selector]')[0].checked = true;
        OZA.useLifeFormExplorer = true;
    } else {
        console.log('Setting radio button to taxonomy');
        $('input:radio[name=radio-group-browser-selector]')[1].checked = true;
        $('input:radio[name=radio-group-browser-selector]')[0].checked = false;
        OZA.useLifeFormExplorer = false;
    }

    $('#radio-group-browser').bind('click', function () {
        setUseLifeformForExplore(true);
    });
    $('#radio-taxonomy-browser').bind('click', function () {
        setUseLifeformForExplore(false);
    });

    //get the show images stored preference                                            
    var storedShowImagesInSearch = localStorage.getItem('ala-showImagesInSearch');
    console.log('storedShowImagesInSearch: ' + storedShowImagesInSearch);

    if (storedShowImagesInSearch == null || storedShowImagesInSearch == 'true') {
        console.log('Setting radio button show images to ON');
        $('input:radio[name=radio-search-images-toggle]')[0].checked = true;
        OZA.showImagesInSearch = true;
    } else {
        console.log('Setting radio button show images to OFF');
        $('input:radio[name=radio-search-images-toggle]')[1].checked = true;
        $('input:radio[name=radio-search-images-toggle]')[0].checked = false;
        OZA.showImagesInSearch = false;
    }

    //select 3 images by default              
    var storedNumberOfImagesToShow = localStorage.getItem('ala-numberOfImagesToShow');
    if (storedNumberOfImagesToShow != null) {
        $('#numberOfImagesToShow').val(storedNumberOfImagesToShow);
        OZA.noOfImagesToShow = storedNumberOfImagesToShow;
    } else {
        $('#numberOfImagesToShow').val(3);
        OZA.noOfImagesToShow = 3;
    }

    $('#radio-images-on').bind('click', function (e, data) {
        setImagesInSearch(true);
    });
    $('#radio-images-off').bind('click', function (e, data) {
        setImagesInSearch(false);
    });
    $('#numberOfImagesToShow').bind('change', function (e, data) {
        OZA.noOfImagesToShow = $('#numberOfImagesToShow').val();
        localStorage.setItem('ala-numberOfImagesToShow', noOfImagesToShow);
    });
}

function setUseLifeformForExplore(useLF) {
    console.log('Setting useLifeForm to ' + useLF);
    if (useLF) {
        OZA.useLifeFormExplorer = true;
        localStorage.setItem('ala-useLifeFormExplorer', 'useLifeForm');
    } else {
        OZA.useLifeFormExplorer = false;
        localStorage.setItem('ala-useLifeFormExplorer', 'useTaxonomy');
    }
}

function setImagesInSearch(showImages) {
    console.log('Setting show images to ' + showImages);
    if (showImages) {
        OZA.showImagesInSearch = true;
        localStorage.setItem('ala-showImagesInSearch', 'true');
    } else {
        OZA.showImagesInSearch = false;
        localStorage.setItem('ala-showImagesInSearch', 'false');
    }
}

function initializeMap() {

    var mapdiv = document.getElementById("map_canvas");

    console.log('detected window height: ' + $(window).height());

    if ($(window).height() !== "undefined" && $(window).height() != null) {
        console.log('window size: ' + $(window).height());

        if ($(window).height() > 400) {
            mapdiv.style.width = ($(window).width() - 20) + 'px';
            mapdiv.style.height = ($(window).height() - 160) + 'px';
            $(window).resize(function () {
                mapdiv.style.width = ($(window).width() - 20) + 'px';
                mapdiv.style.height = ($(window).height() - 160) + 'px';
            });

        } else {
            mapdiv.style.width = '304px';
            mapdiv.style.height = '260px';
        }

    } else {
        mapdiv.style.width = '304px';
        mapdiv.style.height = '270px';
    }

    var myOptions = {
        zoom: OZA.defaultZoom,
        center: new google.maps.LatLng(OZA.currentLatitude, OZA.currentLongitude),
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        zoomControl: true,
        zoomControlOptions: {
            style: google.maps.ZoomControlStyle.SMALL
        },
        mapTypeControl: true
    };
    OZA.map = new google.maps.Map(document.getElementById('map_canvas'), myOptions);

    var location = new google.maps.LatLng(OZA.currentLatitude, OZA.currentLongitude);
    OZA.marker = new google.maps.Marker({
        map: OZA.map,
        draggable: true,
        animation: google.maps.Animation.DROP,
        position: location,
        title: 'marker Location'
    });
    
    OZA.map.fitBounds(DEFAULT_BOUNDS);    
    
    google.maps.event.addListener(OZA.marker, 'dragend', function () {
        setCurrentLocationToMarkerCoords();
    });

    google.maps.event.addListener(OZA.map, 'zoom_changed', function () {
        //setTimeout(moveToDarwin, 3000);
        if (OZA.usingExploreYourArea) {
            setOverlayMarker(false);
        }
    });
    
    //initialise the OZA.circle
    if (OZA.usingExploreYourArea) {
        setOverlayMarker(false);
    }

    // bind OZA.circle to OZA.marker
    OZA.mapInitialised = true;
}

function searchForPlace() {
    $.mobile.loadingMessage = 'Searching....';
    $.mobile.showPageLoadingMsg();
    var searchUrl = M_URL + '/placeSearch?address=';
    searchUrl = searchUrl + $('#placeSearch').val() + ', Australia';

    $.getJSON(searchUrl, function (data) {
        if (data.results.length > 0) {
            var latitude = data.results[0].geometry.location.lat;
            var longitude = data.results[0].geometry.location.lng;
            var latLng = new google.maps.LatLng(latitude, longitude);
            $('#latitude').val(latitude);
            $('#longitude').val(longitude);
            $('#latitudeDisplay').html(latitude);
            $('#longitudeDisplay').html(longitude);
            OZA.map.setCenter(latLng);
            OZA.currentLatitude = latitude;
            OZA.currentLongitude = longitude;
            OZA.marker.setPosition(latLng);

            var viewport = data.results[0].geometry.viewport;
            OZA.map.fitBounds(new google.maps.LatLngBounds(new google.maps.LatLng(viewport.southwest.lat, viewport.southwest.lng), new google.maps.LatLng(viewport.northeast.lat, viewport.northeast.lng)));

            if (OZA.usingExploreYourArea) {
                setOverlayMarker(true);
            }

            $('#locality').val(data.results[0].formatted_address);
            hidePageLoadingMsg();
        } else {
            hidePageLoadingMsg();
            alert('Unable to locate "' + $('#placeSearch').val() + '". Please try another search.');
        }
    }).error(function () {
        hidePageLoadingMsg();
        alert("There was a problem connecting to the server. Please try again.");
    });
}

function search() {
    $.mobile.loadingMessage = 'Searching...';
    $.mobile.showPageLoadingMsg();
    //alert('Starting search...');
    $('#searchResults').empty();
    var searchUrl = M_URL + '/search.json?fq=idxtype:TAXON&fq=hasImage:true&pageSize=30&q=';
    //alert(searchUrl);
    searchUrl = searchUrl + $('#initialSearch').val();

    //alert('Starting search...'+ searchUrl);
    $.getJSON(searchUrl, function (data) {
        //alert('Starting search...'+ data.searchResults.results.length);
        for (var i = 0; i < data.searchResults.results.length; i++) {

            var imageUrl = null;
            if (data.searchResults.results[i].thumbnail != null) {
                imageUrl = data.searchResults.results[i].thumbnail.replace('/data/bie/', M_URL + '/repo/');
            }

            var result = renderSearchResult(data.searchResults.results[i].guid, data.searchResults.results[i].name, data.searchResults.results[i].commonNameSingle, imageUrl);

            $('#searchResults').append(result);
        }

        if (data.searchResults.results.length == 0) {
            $('#searchResults').append('<li> No taxa found </li>');
        }

        $('#searchResults').listview('refresh');
        hidePageLoadingMsg();
    }).error(function () {
        hidePageLoadingMsg();
        alert("There was a problem connecting to the server. Please try again.");
    });
}

function getRegionCode(regionName) {
    if (regionName == 'South Australia') return 'SA';
    if (regionName == 'New South Wales') return 'NSW';
    if (regionName == 'Victoria') return 'VIC';
    if (regionName == 'Tasmania') return 'TAS';
    if (regionName == 'Northern Territory') return 'NT';
    if (regionName == 'Queensland') return 'QLD';
    if (regionName == 'Western Australia') return 'WA';
    if (regionName == 'Australia') return 'AUS';
    return regionName;
}

function getSciNameHtml(rankId, nameString) {
    if (rankId > 6000) {
        return '<i>' + nameString + '</i>';
    } else {
        return nameString;
    }
}

function showPageLoadingMsg(msg) {
    $.mobile.loadingMessage = msg;
    $.mobile.showPageLoadingMsg();
    $('.ui-loader').css({
        'display': 'block'
    });
}

function openSpeciesPage(guid) {

    showPageLoadingMsg('Loading species details...');
    $.mobile.changePage('#speciesPage');

    //load species data
    $('#taxonDetails').empty();
    $('#commonNames').empty();
    $('#synonyms').empty();
    $('#conservation').empty();
    $('#classification').empty();
    $('#simpleProperties').empty();
    $('#images').empty();
    $('#imageAttribution').empty();
    $('#occurrenceMap').empty();
    $('#nameSources').empty();

    var jsonUrl = M_URL + '/species/' + guid + '.json';

    $.getJSON(jsonUrl, function (data) {

        //set a common name to use
        if (data.commonNames.length > 0) {
            $('#mainTitle').html(data.commonNames[0].nameString);
            $('#commonName').val(data.commonNames[0].nameString);
        } else {
            $('#mainTitle').html(data.taxonConcept.nameString);
        }

        //set state
        $('#currentGuid').val(data.taxonConcept.guid);
        $('#currentScientificName').val(data.taxonConcept.nameString);
        $('#guid').val(data.taxonConcept.guid);
        $('#taxonID').val(data.taxonConcept.guid);
        $('#scientificName').val(data.taxonConcept.nameString);

        if (data.classification != null) {
            $('#taxonDetails').append('<p>Scientific name: ' + data.classification.scientificName + '</p>');
            $('#taxonDetails').append('<p>Family: ' + data.classification.family + '</p>');
            $('#taxonDetails').append('<p>Kingdom: ' + data.classification.kingdom + '</p>');
        }

        $('#family').val(data.classification.family);
        $('#kingdom').val(data.classification.kingdom);

        //display values
        $('#classification').append('<h4>Classification</h4>');
        $('#classification').append('<ul id="classificationList">');
        $('#classificationList').append('<li id="#scientificNameDisplay">Scientific name: ' + getSciNameHtml(data.taxonConcept.rankID, data.taxonConcept.nameString) + '</li>');
        $('#classificationList').append('<li id="#familyDisplay">Family: ' + data.classification.family + '</li>');
        $('#classificationList').append('<li id="#kingdomDisplay">Kingdom: ' + data.classification.kingdom + '</li>');


        addCommonNames(data.commonNames);
        addSynonyms(data.taxonConcept.rankID, data.synonyms);

        for (var i = 0; i < data.conservationStatuses.length && i < 1; i++) {
            //$('#conservationStatuses').append('<p>Conservation status: '+data.conservationStatuses[i].status+'</p>');
            var status = data.conservationStatuses[i];
            var region = "";
            if (status.region != null && status.region != "") {
                region = status.region;
            } else {
                region = "IUCN";
            }

            if (status.status !== "undefined" && status.status != null) {
                if (status.status.indexOf('Extinct') == 0) {
                    $('#conservation').append('<div><span class="iucn red">' + getRegionCode(region) + '</span>' + status.status + '</div>');
                }
                if (status.status.indexOf('Extinct') == 0) {
                    $('#conservation').append('<div><span class="iucn red">' + getRegionCode(region) + '</span>' + status.status + '</div>');
                }
                if (status.status.indexOf('wild') > 0) {
                    $('#conservation').append('<div><span class="iucn red">' + getRegionCode(region) + '</span>' + status.status + '</div>');
                }
                if (status.status.indexOf('Critically') == 0) {
                    $('#conservation').append('<div><span class="iucn red">' + getRegionCode(region) + '</span>' + status.status + '</div>');
                }
                if (status.status.indexOf('Endangered') == 0) {
                    $('#conservation').append('<div><span class="iucn yellow">' + getRegionCode(region) + '</span>' + status.status + '</div>');
                }
                if (status.status.indexOf('Vulnerable') == 0) {
                    $('#conservation').append('<div><span class="iucn yellow">' + getRegionCode(region) + '</span>' + status.status + '</div>');
                }
                if (status.status.indexOf('Near') == 0) {
                    $('#conservation').append('<div><span class="iucn green">' + getRegionCode(region) + '</span>' + status.status + '</div>');
                }
                if (status.status.indexOf('concern') > 0) {
                    $('#conservation').append('<div><span class="iucn green">' + getRegionCode(region) + '</span>' + status.status + '</div>');
                }
            }
        }

        var description = "";
        var distribution = "";
        var ecology = "";
        var morphology = "";

        for (var i = 0; i < data.simpleProperties.length; i++) {

            var fieldName = null;
            if (data.simpleProperties[i].name == "http://ala.org.au/ontology/ALA#hasDescriptiveText") {
                fieldName = "Description";
                if (description.length > 0) {
                    description = description + "<br/>"
                };
                description = description + data.simpleProperties[i].value;
            } else if (data.simpleProperties[i].name == "http://ala.org.au/ontology/ALA#hasEcologicalText") {
                fieldName = "Ecology";
                if (ecology.length > 0) {
                    ecology = ecology + "<br/>"
                };
                ecology = ecology + data.simpleProperties[i].value;
            } else if (data.simpleProperties[i].name == "http://ala.org.au/ontology/ALA#hasMorphologicalText") {
                fieldName = "Morphology";
                if (morphology.length > 0) {
                    morphology = morphology + "<br/>"
                };
                morphology = morphology + data.simpleProperties[i].value;
            } else if (data.simpleProperties[i].name == "http://ala.org.au/ontology/ALA#hasDistributionText") {
                fieldName = "Distribution";
                if (distribution.length > 0) {
                    distribution = distribution + "<br/>"
                };
                distribution = distribution + data.simpleProperties[i].value;
            }
        }

        /* DISABLE SHOWING DESCRIPTIONS FOR TIME BEING - too problematic...
        if (description.length > 0) {
            $('#simpleProperties').append('<h4>Description</h4>');
            $('#simpleProperties').append('<p id="description">' + description + '</p>');
        }
 */

        var imagesAdded = 0;
        $('#images').append('<ul id="imageList">');
        $('#imageAttribution').append('<h4>Image sources</h4>');
        $('#imageAttribution').append('<ol id="imageAttributionList">');
        for (var i = 0; i < data.images.length && imagesAdded < OZA.noOfImagesToShow; i++) {
            if (!data.images[i].isBlackListed) {
                $('#imageList').append('<li>' + getImageHTML(data.images[i]) + '</li>');
                $('#imageAttributionList').append('<li>' + getImageAttributionHTML(data.images[i]) + '</li>');
                imagesAdded = imagesAdded + 1;
            }
        }

        if (OZA.useLargerImages) {
            $('#images').css({
                'margin-right': '30px'
            });
        }


        $('#occurrenceMap').append('<h4>Occurrences map</h4>');
        $('#occurrenceMap').append('<img src="http://m.ala.org.au/ws/density/map?q=lsid:' + data.taxonConcept.guid + '"/>');

        if (OZA.useLargerImages) {
            $('#occurrenceMap img').css({
                'width': '400px'
            });
        } else {
            $('#occurrenceMap img').css({
                'width': '290px'
            });
        }

        $('#nameSources').append('<h4>Taxonomic source</h4>');
        $('#nameSources').append('<ul id="taxonomicList">');

        var link = '';
        var name = '';
        if (data.taxonConcept.guid.indexOf('afd.taxon') > 0) {
            link = 'http://www.environment.gov.au/biodiversity/abrs/online-resources/fauna/afd/taxa/' + data.taxonConcept.nameString;
            name = 'Australian Faunal Directory';
        } else if (data.taxonConcept.guid.indexOf('apni.taxon') > 0) {
            link = 'http://biodiversity.org.au/name/' + data.taxonConcept.nameString + '.html';
            name = 'Australian Plant Names Index';
        }

        if (link != '') {
            $('#taxonomicList').append('<li><a target="_blank" rel="external" href="' + link + '">' + name + '</a></li>');
        }

        $('#alaSpeciesPageLink').attr('href', 'http://bie.ala.org.au/species/' + data.taxonConcept.guid);
        hidePageLoadingMsg();
    }).error(function () {
        hidePageLoadingMsg();
        alert("There was a problem connecting to the server to load this species profile. Please try again.");
    });
}

// create object of url params
function getUrlVars() {
    var vars = [],
        hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for (var i = 0; i < hashes.length; i++) {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}


function getImageAttributionHTML(image) {

    var imageHTML = '<span class="imageInfoSourceNameAttr">Source: ';
    imageHTML = imageHTML + '<a target="_blank" rel="external" href="';
    if (image.isPartOf !== "undefined" && image.isPartOf != null) {
        imageHTML = imageHTML + image.isPartOf;
    } else {
        imageHTML = imageHTML + image.infoSourceURL;
    }
    imageHTML = imageHTML + '">';
    imageHTML = imageHTML + image.infoSourceName
    imageHTML = imageHTML + '</a></span>';

    return imageHTML;
}


function getImageHTML(image) {

    var imageHTML = null;

    if (OZA.useLargerImages) {
        imageHTML = '<img style="max-width:550px;" src="' + image.repoLocation.replace('raw.', 'largeRaw.') + '"/>';
    } else {
        imageHTML = '<img style="max-width:290px;" src="' + image.repoLocation.replace('raw.', 'smallRaw.') + '"/>';
    }

    if (image.creator !== "undefined" && image.creator != null) {
        imageHTML = imageHTML + '<br/><span class="imageCreator">Creator: ' + image.creator + '</span>';
    }
    if (image.rights !== "undefined" && image.rights != null) {
        imageHTML = imageHTML + '<br/><span class="imageRights">Rights:' + image.rights + '</span>';
    }
    return imageHTML;
}


function addCommonNames(commonNames) {

    if (commonNames.length > 0) {

        $('#commonNames').append('<h4>Common names</h4>');
        var list = $('<ul>').attr('id', 'commonNamesList').attr('class', 'namesList');

        $('#commonNames').append(list);

        //set a common name to use
        $('#currentCommonName').val(commonNames[0].nameString);

        //de-dup the names
        var u = {},
            a = [];
        for (var i = 0; i < commonNames.length; ++i) {
            if ($.trim(commonNames[i].nameString) in u) continue;
            a.push($.trim(commonNames[i].nameString));
            u[commonNames[i].nameString] = 1;
        }

        for (var i = 0; i < a.length; i++) {
            $('#commonNamesList').append('<li>' + a[i] + '</li>');
        }
    }
}

function addSynonyms(rankID, synonyms) {

    if (synonyms.length > 0) {

        $('#synonyms').append('<h4>Other names</h4>');
        var list = $('<ul>').attr('id', 'synonymList').attr('class', 'namesList');
        $('#synonyms').append(list);

        for (var i = 0; i < synonyms.length; i++) {
            $('#synonymList').append('<li>' + getSciNameHtml(rankID, synonyms[i].nameString) + '</li>');
        }
    }
}

function renderSearchResult(guid, scientificName, commonName, imageUrl, occurrenceCount) {

    var name = '<a href="javascript:openSpeciesPage(\'' + guid + '\');">';

    if (OZA.showImagesInSearch) {
        if (imageUrl != null) {
            name = name + '<img src="' + imageUrl + '" />';
        } else {
            name = name + '<img src="images/noImage85.jpg" />';
        }
    }

    if (commonName == null || commonName == undefined || commonName == '') {
        name = name + '<h4 class="searchResultHdr"><i>' + scientificName + '</i></h4>';
    } else {
        name = name + '<h4 class="searchResultHdr">' + commonName + '</h4>';
        name = name + '<p><strong><i>' + scientificName + '</i></strong></p>';
    }

    if (occurrenceCount !== 'undefined' && occurrenceCount != null) {
        name = name + '<p>Recorded occurrences: ' + occurrenceCount + '</p>';
    }

    name = name + '</a>';
    return '<li>' + name + '</li>';
}


function startExploreByTaxonomy() {
    OZA.currentRank = '';
    OZA.currentTaxonName = '';
    OZA.currentClassification = new Object();
    $.mobile.changePage('#exploreByTaxonomy');
}

function resetExploreByTaxonomy() {
    OZA.currentRank = '';
    OZA.currentTaxonName = '';
    OZA.currentClassification = new Object();
}


function exploreByTaxonomy(taxonName, rank) {

    $('#exploreByTaxonomyList').empty();

    console.log('Set the taxon name: ' + taxonName);

    if (taxonName !== 'undefined' && taxonName != null) {
        if (OZA.currentRank != '') {
            OZA.currentClassification[OZA.currentRank] = OZA.currentTaxonName;
            console.log('Storing classification ' + OZA.currentRank + ' : ' + OZA.currentClassification[OZA.currentRank]);
        }

        console.log('Setting the taxon name to...... ' + taxonName);
        OZA.currentRank = rank;
        OZA.currentTaxonName = taxonName;
    }

    var nextFacetRank = getNextRank(OZA.currentRank);

    showPageLoadingMsg('Loading ' + getPlural(nextFacetRank) + '...');

    var searchUrl = M_URL + '/occurrenceSearch?lat=' + OZA.currentLatitude + '&lon=' + OZA.currentLongitude + '&radius=' + getCurrentRadius() + '&facets=' + nextFacetRank + '&pageSize=0&start=0';

    if (OZA.currentTaxonName != '') {
        searchUrl = searchUrl + '&q=' + OZA.currentRank + ':' + OZA.currentTaxonName;
    } else {
        searchUrl = searchUrl + '&q=*:*';
    }

    console.log("Searching with: " + searchUrl);

    $.getJSON(searchUrl, function (data) {

        $('#exploreByTaxonomyList').append('<li data-role="list-divider">' + getPlural(nextFacetRank) + '</li>');

        for (var i = 0; i < data.facetResults[0].fieldResult.length; i++) {

            if (data.facetResults[0].fieldName != 'names_and_lsid') {
                var taxonName = data.facetResults[0].fieldResult[i].label;
                $('#exploreByTaxonomyList').append('<li id="' + taxonName + '"><a href="javascript:exploreByTaxonomy(\'' + taxonName + '\',\'' + nextFacetRank + '\', this);">' + taxonName + '</a></li>')
            } else {
                var parts = data.facetResults[0].fieldResult[i].label.split('|');
                var html = '<a href="javascript:openSpeciesPage(\'' + parts[1] + '\')">';
                if (OZA.showImagesInSearch) {
                    html = html + '<img src="' + M_URL + '/species/image/thumbnail/' + parts[1] + '"/>';
                }

                if (parts[2] == '') {
                    html = html + '<h4 class="searchResultHdr"><i>' + parts[0] + '</i></h4>';
                } else {
                    html = html + '<h4 class="searchResultHdr">' + parts[2] + '</h4>';
                    html = html + '<p><strong><i>' + parts[0] + '</strong></i>';
                }

                html = html + '<p class="occurrenceCount">Recorded occurrences: ' + data.facetResults[0].fieldResult[i].count + '</p>';
                html = html + '</a>';

                $('#exploreByTaxonomyList').append('<li>' + html + '</li>')
            }
        }

        //create a link to previous
        if (getPreviousRank(OZA.currentRank) != '') {
            var previousRank = getPreviousRank(OZA.currentRank);
            console.log('Current rank: ' + rank + ', Current facets on: ' + nextFacetRank + ', previous rank: ' + previousRank)
            $('#backUpTheTree').attr('href', 'javascript:exploreByTaxonomy(\'' + OZA.currentClassification[previousRank] + '\',\'' + previousRank + '\');');
            $('#backUpTheTree .ui-btn-text').html('View ' + getPlural(rank) + ' for ' + OZA.currentClassification[previousRank]);
            $('#backUpTheTree').css({
                'display': 'block'
            });
            $('#backUpTheTree').css({
                'margin-bottom': '35px'
            });
            //$('#backUpTheTree').css({'display':'block'});
        } else {
            $('#backUpTheTree').attr('href', 'javascript:resetExploreByTaxonomy();exploreByTaxonomy();');
            $('#backUpTheTree').css({
                'display': 'block'
            });
            $('#backUpTheTree').css({
                'margin-bottom': '35px'
            });
            $('#backUpTheTree .ui-btn-text').html('View all kingdoms');
            $('#backUpTheTree').attr({
                'data-icon': ''
            });
        }

        $('#exploreByTaxonomyList').listview('refresh');

        hidePageLoadingMsg();
    }).error(function () {
        hidePageLoadingMsg();
        alert('There was a problem loading the taxonomic tree. Please try again.');
    });
}


function getPlural(rank) {
    if (rank == 'kingdom') return 'Kingdoms';
    if (rank == 'phylum') return 'Phyla';
    if (rank == 'class') return 'Classes';
    if (rank == 'order') return 'Orders';
    // if(rank == 'family') return 'genus';
    if (rank == 'family') return 'Families';
    if (rank == 'names_and_lsid') return 'Species & Subspecies';
    return 'kingdoms';
}

function getNextRank(rank) {
    if (rank == 'kingdom') return 'phylum';
    if (rank == 'phylum') return 'class';
    if (rank == 'class') return 'order';
    if (rank == 'order') return 'family';
    // if(rank == 'family') return 'genus';
    if (rank == 'family') return 'names_and_lsid';
    return 'kingdom';
}

function getPreviousRank(rank) {
    if (rank == 'phylum') return 'kingdom';
    if (rank == 'class') return 'phylum';
    if (rank == 'order') return 'class';
    if (rank == 'family') return 'order';
    // if(rank == 'family') return 'genus';
    if (rank == 'names_and_lsid') return 'family';
    return '';
}

function exploreGroup(speciesGroup) {
    $('#loadMoreForcurrentGroup').css({
        'display': 'none'
    });
    showPageLoadingMsg('Loading group ' + speciesGroup + '...');

    OZA.currentGroup = speciesGroup
    $('#exploreList').empty();
    $('#exploreGroupTitle').html('Explore ' + speciesGroup);
    $.mobile.changePage('#exploreGroup');
    OZA.currentGroupStartIndex = 0;

    var radius = parseFloat(OZA.circle.getRadius()) / 1000;

    var searchUrl = M_URL + '/exploreGroup?common=true&group=' + OZA.currentGroup + '&lat=' + OZA.currentLatitude + '&lon=' + OZA.currentLongitude + '&radius=' + getCurrentRadius() + '&pageSize=' + (OZA.exploreGroupWithGalleryPageSize + 1) + '&start=' + OZA.currentGroupStartIndex;

    $.getJSON(searchUrl, function (data) {
        for (var i = 0; i < data.length && i < OZA.groupPageSize; i++) {
            var imageUrl = M_URL + '/species/image/thumbnail/' + data[i].guid;
            $('#exploreList').append(renderSearchResult(data[i].guid, data[i].name, data[i].commonName, imageUrl, data[i].count));
            $('#exploreList').listview('refresh');
        }

        //alert(data.length + " : " + OZA.groupPageSize);
        if (data.length > OZA.groupPageSize) {
            $('#loadMoreForCurrentGroup').css({
                'display': 'block'
            });
        } else {
            $('#loadMoreForCurrentGroup').css({
                'display': 'none'
            });
        }
        hidePageLoadingMsg();
    }).error(function () {
        hidePageLoadingMsg();
        alert('There was a problem loading this group. Please try again.');
    });
}

function hidePageLoadingMsg() {
    // the jquery method is buggy    
    $.mobile.hidePageLoadingMsg();
    $('.ui-loader').css({
        'display': 'none'
    });
}

function loadMoreForCurrentGroup() {

    showPageLoadingMsg('Loading more for group ' + OZA.currentGroup + '...');

    var radius = parseFloat(OZA.circle.getRadius()) / 1000;
    OZA.currentGroupStartIndex = OZA.groupPageSize + OZA.currentGroupStartIndex;

    var searchUrl = M_URL + '/exploreGroup?common=true&group=' + OZA.currentGroup + '&lat=' + OZA.currentLatitude + '&lon=' + OZA.currentLongitude + '&radius=' + getCurrentRadius() + '&pageSize=' + (OZA.exploreGroupWithGalleryPageSize + 1) + '&start=' + OZA.currentGroupStartIndex;

    $.getJSON(searchUrl, function (data) {
        for (var i = 0; i < data.length && i < OZA.groupPageSize; i++) {
            var imageUrl = M_URL + '/species/image/thumbnail/' + data[i].guid;
            $('#exploreList').append(renderSearchResult(data[i].guid, data[i].name, data[i].commonName, imageUrl, data[i].count));
            $('#exploreList').listview('refresh');
        }

        if (data.length <= OZA.groupPageSize) {
            $('#loadMoreForCurrentGroup').css({
                'display': 'none'
            });
        }
        hidePageLoadingMsg();
    }).error(function () {
        hidePageLoadingMsg();
        alert('There was a problem loading more images for this group. Please try again.');
    });
}

function clearSavedList() {
    //localStorage.clear();
    //clear currently stored images
    for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key.substring(0, 5) === 'image') {
            localStorage.removeItem(key);
        }
    }
}

function saveCurrentList(speciesGroup) {
    showPageLoadingMsg('Saving your list for offline viewing...');

    $('#savedList').empty();

    //clear currently stored images
    clearSavedList();

    $('#exploreGroupWithGalleryList img').each(function (index) {
        console.log('saving image: ' + this)
        var base64EncodedImg = getBase64Image(this);
        localStorage.setItem("name" + index, $(this).attr('alt'));
        localStorage.setItem("image" + index, base64EncodedImg);

    });
    hidePageLoadingMsg();
}


function getBase64Image(img) {
    // Create an empty canvas element
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;

    // Copy the image contents to the canvas
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    // Get the data-URL formatted image
    // Firefox supports PNG and JPEG. You could check img.src to
    // guess the original format, but be aware the using "image/jpg"
    // will re-encode the image.
    var dataURL = canvas.toDataURL("image/png");

    var base64EncodedImage = dataURL.replace(/^data:image\/(png|jpg);base64,/, "");

    return base64EncodedImage;
}

function loadSavedImage(key) {
    $('#savedImageView').empty();
    $('#savedImageView').append('<img style="width:100%;" alt="' + name + '" src="data:image/jpeg;base64,' + localStorage.getItem(key) + '"/>');
    $.mobile.changePage('#savedImageViewer');
}

function loadSavedList() {
    //var savedList = localStorage.getItem('savedList');
    //$('#savedList').html(savedList);
    showPageLoadingMsg('Retrieving saved list from your device...');

    $('#savedList').empty();
    //$('#savedList').append('<li>Adding items, '+localStorage.length+' to add </li>');
    var loadedImages = 0;

    for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);

        if (key.substring(0, 5) === 'image') {
            //add the image to the list, with base64Decoding....
            //  alert('image found ' + key);
            loadedImages = loadedImages + 1;
            //get the corresponding name
            var index = key.substring(5);
            var name = localStorage.getItem('name' + index);
            //			$('#savedList').append('<li><img alt="' + name + '" src="data:image/jpeg;base64,' + localStorage.getItem(key) + '"/></li>');
            $('#savedList').append('<li><a href="javascript:loadSavedImage(\'' + key + '\');">' + name + '</a></li>');
        }
    }

    $('#savedList').listview('refresh');

    if ($('#savedList').children().length > 0) {
        $('#noSavedListMessage').css({
            'display': 'none'
        });
    } else {
        $('#noSavedListMessage').css({
            'display': 'block'
        });
    }
    hidePageLoadingMsg();
}

function getCurrentRadius() {
    return parseFloat(OZA.circle.getRadius()) / 1000;
}

function renderImageLink(thumbUrl, smallImageUrl, imageUrl, altImage, forwardUrl) {
    var name = '<a href="' + imageUrl + '" rel="external" name="' + forwardUrl + '">';
    if (imageUrl != null) {
        if (OZA.useLargerImages) {
            name = name + "<img src='" + smallImageUrl + "'  alt='" + altImage + " (Tap to view details)'/>"
        } else {
            name = name + "<img src='" + thumbUrl + "'  alt='" + altImage + " (Tap to view details)' />"
        }
    }
    name = name + " </a>"
    return '<li>' + name + '</li>'
}

function renderImageLinkForBIE(imageUrl, thumbnailUrl, altImage) {
    var name = '<a href="' + imageUrl + '" rel="external">';
    if (imageUrl != null) {
        name = name + "<img src='" + thumbnailUrl + "'  alt='" + altImage + "' />"
    }
    name = name + "</a>"
    return '<li>' + name + '</li>'
}

function latestImages() {

    $('#latestImagesLoadMore').css('display', 'none');
    showPageLoadingMsg('Checking for new images...');

    $('#latestImagesList').empty();
    OZA.latestImagesStartIndex = 0;

    //cue the page loader
    var searchUrl = M_URL + '/latestImages?pageSize=' + OZA.latestImagesPageSize;
    $.getJSON(searchUrl, function (data) {
        for (var i = 0; i < data.occurrences.length; i++) {
            var altImage = constructImageLabel(data.occurrences[i]);
            var forwardUrl = 'http://biocache.ala.org.au/occurrences/' + data.occurrences[i].uuid;
            $('#latestImagesList').append(renderImageLink(data.occurrences[i].thumbnailUrl, data.occurrences[i].smallImageUrl, data.occurrences[i].largeImageUrl, altImage, forwardUrl));
        }
		
		setupPhotoSwipe('latestImagesList');

        // onDisplayImage
        OZA.photoSwipe.addEventHandler(Code.PhotoSwipe.EventTypes.onDisplayImage, function (e) {
            var forwardLink = e.target.originalImages[e.target.currentIndex].name;
            console.log('image metadata:' + forwardLink);
            //remove the existing event handler
            $('.ps-caption-content').unbind('click');
            $('.ps-caption-content').bind('click', function () {
                window.open(forwardLink);
            });
            return true;
        });

        //hide the page loader
        hidePageLoadingMsg();
        if (data.occurrences.length > 0) {
            $('#latestImagesLoadMore').css('display', 'block');
        }
    }).error(function () {
        hidePageLoadingMsg();
        alert('There was a problem loading the latest images. Please try again by hitting refresh.');
    });
}

function constructImageLabel(occurrence) {
    var label = occurrence.scientificName;
    if (occurrence.vernacularName !== "undefined" && occurrence.vernacularName != null) {
        label = label + ': ' + occurrence.vernacularName;
    }
    return label;
}


function latestImagesLoadMore() {

    showPageLoadingMsg('Loading more images...');

    OZA.latestImagesStartIndex = OZA.latestImagesStartIndex + OZA.latestImagesPageSize;
    var searchUrl = M_URL + '/latestImages?pageSize=' + OZA.latestImagesPageSize + '&start=' + OZA.latestImagesStartIndex;
    $.getJSON(searchUrl, function (data) {
        for (var i = 0; i < data.occurrences.length; i++) {
            var altImage = constructImageLabel(data.occurrences[i]);
            var forwardUrl = 'http://biocache.ala.org.au/occurrences/' + data.occurrences[i].uuid;
            $('#latestImagesList').append(renderImageLink(data.occurrences[i].thumbnailUrl, data.occurrences[i].smallImageUrl, data.occurrences[i].largeImageUrl, altImage, forwardUrl));
        }
        //var myPhotoSwipe = $(".gallery a").photoSwipe({
          //  enableMouseWheel: false,
            //enableKeyboard: false
//        });
		setupPhotoSwipe('latestImagesList');
        
        hidePageLoadingMsg();
    }).error(function () {
        hidePageLoadingMsg();
        alert('There was a problem loading more images. Please try again.');
    });
}


function exploreGroupWithGallery(reset) {

    console.log('Loading explore gallery...reset : ' + reset);
    if (reset) {
        $('#loadMoreForCurrentGroupGallery').css({
            'display': 'none'
        });
        $.mobile.changePage('#exploreGroupWithGallery');
        OZA.exploreGroupWithGalleryStartIndex = 0;
        //reset this....
        $('#exploreGroupWithGalleryTitle').html(OZA.currentGroup + ' gallery');
        $('#exploreGroupWithGalleryList').empty();
    }

    showPageLoadingMsg('Loading images for gallery for ' + OZA.currentGroup + '...');

    var searchUrl = M_URL + '/exploreGroupWithGallery?common=true&group=' + OZA.currentGroup + '&lat=' + OZA.currentLatitude + '&lon=' + OZA.currentLongitude + '&radius=' + getCurrentRadius() + '&pageSize=' + (OZA.exploreGroupWithGalleryPageSize + 1) + '&start=' + OZA.exploreGroupWithGalleryStartIndex;

    console.log('Sending webservice query....');
    $.getJSON(searchUrl, function (data) {
        console.log('Received  webservice response....');
        for (var i = 0; i < data.searchDTOList.length; i++) {

            if (data.searchDTOList[i].image != null) {
                var imageUrl = data.searchDTOList[i].smallImageUrl;
                var thumbnail = data.searchDTOList[i].thumbnailUrl;
                if (OZA.useLargerImages) {
                    thumbnail = data.searchDTOList[i].smallImageUrl;
                    imageUrl = data.searchDTOList[i].largeImageUrl;
                }
                var altImage = data.searchDTOList[i].name + ": " + data.searchDTOList[i].commonNameSingle;
                $('#exploreGroupWithGalleryList').append(renderImageLinkForBIE(imageUrl, thumbnail, altImage));
            }
        }

        OZA.exploreGroupWithGalleryStartIndex = OZA.exploreGroupWithGalleryStartIndex + OZA.exploreGroupWithGalleryPageSize;

		setupPhotoSwipe('exploreGroupWithGalleryList');

        if (data.searchDTOList.length > OZA.groupPageSize) {
            $('#loadMoreForCurrentGroupGallery').css({
                'display': 'block'
            });
        } else {
            $('#loadMoreForCurrentGroupGallery').css({
                'display': 'none'
            });
        }

        hidePageLoadingMsg();
    }).error(function () {
        hidePageLoadingMsg();
        alert('There was a problem sending your record. Please try again.');
    });
}

function setCurrentLocationToMarkerCoords() {
    console.log('Setting map to current location of user...');
    var latLng = OZA.marker.getPosition();
    OZA.map.setCenter(latLng);
    $('#latitude').val(latLng.lat());
    $('#longitude').val(latLng.lat());
    $('#latitudeDisplay').html(latLng.lat());
    $('#longitudeDisplay').html(latLng.lng());
    OZA.currentLatitude = latLng.lat();
    OZA.currentLongitude = latLng.lng();
    // OZA.map.setZoom(14);
    setLocality(latLng.lat(), latLng.lng());
}

function recordSighting() {

    //initialise
    OZA.recordSent = false;
    $('#postRecord').buttonMarkup({
        theme: "a"
    });
    $('#postRecord .ui-btn-text').text('Record your sighting');
    OZA.usingExploreYourArea = false;
    $('#nextActionFromLocation').attr('href', '#details');
    if (OZA.circle != null) {
        OZA.circle.setMap(null);
    }

    if (typeof FileReader !== "undefined") {
        console.log('File reader is available for this browser....');
        $.mobile.changePage('#photoUpload');
    } else {
        console.log('File reader is NOT available for this browser. Sending to set Location...');
        $.mobile.changePage('#location');
    }
}

function getRadiusForCurrentZoom() {
    var zoom = OZA.map.getZoom();
    //TODO replace this. should be able to get
    //current viewed area and set the radius based on this
    if (zoom > 19) return 10;
    if (zoom == 19) return 25;
    if (zoom == 18) return 50;
    if (zoom == 17) return 100;
    if (zoom == 16) return 250;
    if (zoom == 15) return 500;
    if (zoom == 14) return 1000;
    if (zoom == 13) return 2000;
    if (zoom == 12) return 4000;
    if (zoom == 11) return 7000;
    if (zoom == 10) return 15000;
    if (zoom == 9) return 25000;
    if (zoom == 8) return 50000;
    if (zoom == 7) return 80000;
    if (zoom == 6) return 150000;
    if (zoom == 5) return 300000;
    if (zoom == 4) return 500000;
    return 800000;
}

function removeOverlayMarker() {
    if (OZA.circle != null && OZA.map != null) {
        OZA.circle.setMap(null);
    }
}

function setOverlayMarker(zoomToBounds) {

    if (OZA.circle != null) {
        OZA.circle.setMap(null);
    }
    OZA.circle = new google.maps.Circle({
        map: OZA.map,
        radius: getRadiusForCurrentZoom(),
        strokeWeight: 1,
        strokeColor: 'white',
        strokeOpacity: 0.5,
        fillColor: '#222',
        fillOpacity: 0.2,
        zIndex: -10
    });

    // bind OZA.circle to OZA.marker
    OZA.circle.bindTo('center', OZA.marker, 'position');
    if (zoomToBounds) {
        OZA.map.fitBounds(OZA.circle.getBounds());
    }
}

function setMarkerToCurrentLocation() {
    //  alert('set OZA.marker');
    if (navigator.geolocation) {
        showPageLoadingMsg('Retrieving your location...');

        //alert("getting coords....");
        navigator.geolocation.getCurrentPosition(function (position) {
            var latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            OZA.map.setCenter(latLng);
            OZA.marker.setPosition(latLng);
            OZA.map.setZoom(14);
            $('#latitude').val(position.coords.latitude);
            $('#longitude').val(position.coords.longitude);
            $('#latitudeDisplay').html(position.coords.latitude);
            $('#longitudeDisplay').html(position.coords.longitude);
            OZA.currentLatitude = position.coords.latitude;
            OZA.currentLongitude = position.coords.longitude;

            //get the locality with a webservice
            setLocality(position.coords.latitude, position.coords.longitude);
            if (OZA.usingExploreYourArea) {
                setOverlayMarker(true);
            }
        });
        hidePageLoadingMsg();
    } else {
        hidePageLoadingMsg();
        alert("I'm sorry, but geolocation services are not supported by your browser.");
    }
}

function setLocality(latitude, longitude) {

    $.getJSON(M_URL + '/geocode?latlng=' + latitude + ',' + longitude, function (data) {
        //alert(data.results[0].formatted_address);
        $('#locality').val(data.results[0].formatted_address);
    });
}

function PictureSourceType() {};

PictureSourceType.PHOTO_LIBRARY = 0;
PictureSourceType.CAMERA = 1;

function getPicture(sourceType) {

    console.log('Getting picture, source type (camera=1, library=0) = ' + sourceType);
    var options = {
        quality: 50
    };
    if (sourceType != undefined) {
        options["sourceType"] = sourceType;
        if (sourceType = 1) {
            $.mobile.loadingMessage = 'Loading camera...';
        } else {
            $.mobile.loadingMessage = 'Loading photo library...';
        }
    }
    $.mobile.showPageLoadingMsg();

    options["destinationType"] = Camera.DestinationType.FILE_URI;
    navigator.camera.getPicture(getPicture_Success, getPicture_Fail, options);
};

function getPicture_Fail(msg) {
    hidePageLoadingMsg();
    alert('There was a problem getting the image:\n' + msg);
}

function getPicture_Success(imageURL) {
    //alert("ImageURI: " + imageURL);
    //alert("getpic success");
    document.getElementById("test_img").src = imageURL;
    //$("#test_img_hidden").val(imageData);
    $("#test_img").css('display', 'block');
    hidePageLoadingMsg();
    //alert("You should be able to see an image");
}

function getPictureFromFS() {
    $("#photofs").trigger('click');
}

function handleImageSelect(evt) {
    var files = evt.target.files;
    if (files.length > 0) {
        var file = files[0];
        var imageType = /image.*/;
        if (!file.type.match(imageType)) {
            alert("Only images supported");
        } else {
            var reader = new FileReader();
            reader.onerror = function (e) {
                alert('Error code: ' + e.target.error.code);
            };
            // Create a closure to capture the file information.
            reader.onload = (function (aFile) {
                return function (e) {
                    var data = {
                        'file': {
                            'name': aFile.name,
                            'src': e.target.result,
                            'fileSize': aFile.fileSize,
                            'type': aFile.type
                        }
                    };

                    // Render thumbnail with the file info (data object).
                    displayImageForUser(data);
                };
            })(file);

            // Read in the image file as a data url.
            reader.readAsDataURL(file);
        }
    }
}

function displayImageForUser(data) {
    document.getElementById("test_img").src = data.file.src;
    $("#test_img_hidden").val(data.file.src);
    $("#test_img").css('display', 'block');
}

function removeCurrentImage() {
    document.getElementById("test_img").src = "";
    //$("#test_img_hidden").val('');
    $("#test_img").css('display', 'none');
}

function displayImageFromFS(evt) {
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        var files = evt.target.files;
        // FileList object
        for (var i = 0, f; f = files[i]; i++) {
            alert("f.name: " + f.name);
        }
    } else {
        alert('The File APIs are not fully supported in this browser.');
    }
}

/**
 * Retrieve auth details from local storage.
 */
function postRecord() {
    var userName = localStorage.getItem('ala-userName');
    console.log('Localstorage retrieved user name: ' + userName);
    var authKey = localStorage.getItem('ala-authKey');
    postRecord(userName, authKey);
}

function postRecord(userName, authKey) {

    if (OZA.recordSent) {
        alert('Thanks. Record has already been submitted.')
        return;
    }

    $('#postRecord .ui-btn-text').text('Sending record...');
    var imageUrl = $('#test_img').attr('src');

    if (OZA.isNative) {
        if (imageUrl != null && imageUrl != '') {
            nativePostRecordWithImage(userName, authKey);
        } else {
            webPostRecord(userName, authKey);
        }
    } else {
        if (imageUrl != null && imageUrl != '') {
            webPostRecordWithImage(userName, authKey);
        } else {
            webPostRecord(userName, authKey);
        }
    }
}

/**
 * Do a web form friendly post.
 */
function webPostRecord(userName, authKey) {
    console.log('Doing a web post of the record WITHOUT IMAGE to the BDRS...');
    showPageLoadingMsg('Sending record...');

    $.post(M_URL + '/submit/record', getRecordData(userName, authKey), function (data) {
        OZA.recordSent = true;
        $('#postRecord .ui-btn-text').text('Record sent!');
        console.log('Record sent - success !');
        hidePageLoadingMsg();
    }).error(function () {
        hidePageLoadingMsg();
        alert('There was a problem sending your record. Please try again.');
    });
}

/**
 * Post to the BDRS...
 */
function webPostRecordWithImage(userName, authKey) {

    console.log('Doing a web post WITH IMAGE of the record to the BDRS...');

    //var imageData = $('#test_img').attr('src');
    var imageData = $('#test_img').attr('src').replace(/^data:image\/(png|jpeg|jpg);base64,/, "");
    //var imageData = getBase64Image($('#test_img').attr('src'));
    //add image data to the request
    var recordData = getRecordData(userName, authKey);
    recordData.imageBase64 = imageData;
    recordData.imageFileName = 'testFileName.jpg';
    recordData.imageContentType = 'image/jpeg';
    console.log(imageData);

    $.ajax({
        type: 'POST',
        url: M_URL + '/submit/record',
        data: recordData,
        success: function (data) {
            OZA.recordSent = true;
            $('#postRecord .ui-btn-text').text('Record sent!');
            console.log('Record sent - success !');
        },
        error: function (xhr, desc, err) {
            console.log('There was a problem sending the record....' + err);
            console.log('Error description....' + desc);
            alert('Record submission has failed....' + desc);
        }
    });
}

function getRecordData(userName, authKey) {
    console.log('Constructing data object for POST...');
    var params = new Object();
    params.surveyId = 1;
    params.kingdom = $('#kingdom').val();
    console.log('Kingdom: ' + params.kingdom);
    params.family = $('#family').val();
    console.log('Family: ' + params.family);
    params.taxonID = $('#taxonID').val();
    console.log('TaxonID: ' + params.taxonID);
    params.scientificName = $('#scientificName').val();
    console.log('Scientific name: ' + params.scientificName);
    params.survey_species_search = $('#scientificName').val();
    console.log('survey_species_search: ' + params.survey_species_search);
    params.commonName = $('#commonName').val();
    console.log('common name: ' + params.commonName);
    params.locationName = $('#locality').val();
    console.log('locationName: ' + params.locationName);
    params.latitude = OZA.currentLatitude;
    console.log('latitude: ' + params.latitude);
    params.longitude = OZA.currentLongitude;
    console.log('longitude: ' + params.longitude);
    params.deviceName = device.name;
    console.log('device name: ' + params.deviceName);
    params.deviceId = device.uuid;
    params.devicePlatform = device.platform;
    params.deviceVersion = device.version;
    params.user = userName.toLowerCase();
    params.userName = userName.toLowerCase();
    console.log('user: ' + params.user);
    params.authenticationKey = authKey;
    console.log('auth key: ' + params.authenticationKey);
    params.date = $('#occurrenceDate').val();
    params.time = '12:00';
    params.notes = $('#notes').val();
    console.log('notes: ' + params.notes);
    params.attribute_1 = '';
    params.number = $('#individualCount').val();
    params.coordinatePrecision = 1.0; //TODO fix this
    params.accuracyInMeters = 100; //TODO fix this
    return params;
}

/**
 * Do a post using PhoneGap APIs - hence this is suitable for native deployments only.
 */
function nativePostRecordWithImage(userName, authKey) {

    var win = function (r) {
            hidePageLoadingMsg();
            console.log("Multipart message successfully sent!!");
            console.log("Code = " + r.responseCode);
            console.log("Response = " + r.response);
            console.log("Sent = " + r.bytesSent);
            OZA.recordSent = true;
            $('#postRecord .ui-btn-text').text('Record sent!');
        }
    var fail = function (error) {
            hidePageLoadingMsg();
            //alert("An error has occurred: Code = " + error.code);
            if (FileTransferError.FILE_NOT_FOUND_ERR == error.code) {
                errmsg = "Image not found";
            } else if (FileTransferError.INVALID_URL_ERR == error.code) {
                errmsg = "Invalid URL";
            } else if (FileTransferError.CONNECTION_ERR == error.code) {
                errmsg = "Connection error";
            } else {
                errmsg = "Unknown error";
            }
            alert("An error has occurred: " + errmsg + "\nPlease try again.");
        }

    showPageLoadingMsg('Sending record with images...');

    console.log('Native post of record with image - using Phonegap API...');
    var fileURI = $('#test_img').attr('src');

    var options = new FileUploadOptions();
    options.fileKey = "attribute_file_1";
    options.fileName = fileURI.substr(fileURI.lastIndexOf('/') + 1);
    options.mimeType = "image/jpeg";
    options.chunkedMode = true;

    var params = getRecordData(userName, authKey);
    options.params = params;

    var ft = new FileTransfer();
    ft.upload(fileURI, M_URL + '/submit/recordMultiPart', win, fail, options);
}


function authenticateOrSend() {

    var userName = localStorage.getItem('ala-userName');
    var authKey = localStorage.getItem('ala-authKey');

    if (authKey != null && authKey != '') {
        //already authenticated, so send the record
        var success = checkAuthentication(userName, authKey);
        if (success) {
            console.log('Authentication key is good....sending record now....');
            //alert('Authenticated, so sending record now......')
            postRecord(userName, authKey);
            console.log('Record sent!!!');
        } else {
            console.log('Authentication key is NOT good....user must re-authenticate....');
            $.mobile.changePage('#authenticateAndRecord');
        }
        //postRecordMultiPart();
        //alert('Record sent. Thank you.')
    } else {
        //alert('Need to authenticate....')
        $.mobile.changePage('#authenticateAndRecord');
    }
}

function openLocationForExplore() {
    OZA.usingExploreYourArea = true;
    if (OZA.useLifeFormExplorer) {
        $('#nextActionFromLocation').attr('href', '#exploreYourArea');
    } else {
        //reset taxonomy browser
        $('#nextActionFromLocation').attr('href', 'javascript:startExploreByTaxonomy();');
    }

    if (OZA.map != null) {
        setOverlayMarker(false);
    }
    $('.exploreYourAreaHelp').css({'display': 'block'});
    $.mobile.changePage('#location');
}

function openLocationForRecording() {
    OZA.usingExploreYourArea = false;
    //remove the overlay if its there
    removeOverlayMarker();
    $('.exploreYourAreaHelp').css({'display': 'none'});
    $('#nextActionFromLocation').attr('href', '#details');
    $.mobile.changePage('#location');
}

function toggleBounce() {
    if (OZA.marker.getAnimation() != null) {
        OZA.marker.setAnimation(null);
    } else {
        OZA.marker.setAnimation(google.maps.Animation.BOUNCE);
    }
}

function logout() {
    //clear local storage
    $('.loginStatus').val('Not Logged in.');
    localStorage.setItem('ala-authKey', '');

    $('#yourDetailsLogin').attr('href', 'javascript:loginWithDetails();');
    $('#yourDetailsLogin  .ui-btn-text').text('Login');
}

// Login from the Your Details page
function loginWithDetails() {

    var userName = $('#detailsUserName').val();
    var password = $('#detailsPassword').val();

    //persist this
    localStorage.setItem('ala-userName', userName);
    localStorage.setItem('ala-password', password);
    localStorage.setItem('ala-authKey', '');

    authenticate(userName, password);
    var authKey = localStorage.getItem('ala-authKey');

    //get the stored key
    if (authKey != null) {
        localStorage.setItem('ala-authKey', authKey);
        $('.loginStatus').val('You are logged in.').css({
            'color': 'blue',
            'font-weight': 'normal'
        });
        $('#yourDetailsLogin').attr('href', 'javascript:logout();');
        $('#yourDetailsLogin  .ui-btn-text').text('Logout');
    } else {
        $('.loginStatus').val('Login failed').css({
            'color': 'red',
            'font-weight': 'bold'
        });
    }

    updateAuthSettings();
}

function authenticateFromDialogAndRecord() {
    var userName = $('#authRecordDialogUserName').val();
    var password = $('#authRecordDialogPassword').val();
    var authKey = authenticate(userName, password);

    //get the stored key
    if (authKey != null) {
        $('#authRecordDialogStatus').html('You are logged in....sending record...');
        $('#authRecordDialogStatus').css({
            'color': 'blue'
        });
        $('#authenticateAndRecord').dialog('close');
        postRecord(userName, authKey);
    } else {
        $('#authRecordDialogStatus').html('Login failed').css({
            'color': 'red'
        });
    }
}

function updateAuthSettings() {
    //alert('your details')
    $('#detailsUserName').val(localStorage.getItem('ala-userName'));
    $('#detailsPassword').val(localStorage.getItem('ala-password'));
    var authKey = localStorage.getItem('ala-authKey');
    if (authKey != null && authKey != '') {
        $('.loginStatus').val('Logged in').css({
            'color': 'blue'
        });
        $('#yourDetailsLogin').attr('href', 'javascript:logout();');
        $('#yourDetailsLogin  .ui-btn-text').text('Logout');

    } else {
        $('.loginStatus').val('Not Logged in.');
        $('#yourDetailsLogin').attr('href', 'javascript:loginWithDetails();');
        $('#yourDetailsLogin  .ui-btn-text').text('Login');
    }
}

function checkAuthentication(userName, authKey) {
    console.log('Authenticating with userName: ' + userName);
    var result = false;
    $.ajax({
        type: 'POST',
        url: M_URL + '/mobileauth/mobileKey/checkKey',
        data: {
            'userName': userName,
            'authKey': authKey
        },
        async: false,
        success: function (data, status) {
            console.log('Check key success. Using key: ' + authKey);
            result = true;
        },
        error: function (xhr, desc, err) {
            result = false;
            console.log('Check key failed: ' + err);
        }
    });
    return result;
}


function authenticate(userName, password) {
    console.log('Authenticating with userName: ' + userName);
    var result = null;
    $.ajax({
        type: 'POST',
        url: M_URL + '/mobileauth/mobileKey/generateKey',
        data: {
            'userName': userName,
            'password': password
        },
        async: false,
        success: function (data, status) {
            result = data.authKey;
            try {
                localStorage.setItem('ala-userName', userName);
                localStorage.setItem('ala-password', password);
                localStorage.setItem('ala-authKey', data.authKey);
                console.log('Authentication success. Using key: ' + localStorage.getItem('ala-authKey'));
            } catch (error) {
                console.log('Problem storing auth details - privat browsing may be in use');
            }
        },
        error: function (xhr, desc, err) {
            localStorage.setItem('ala-authKey', '');
            result = null;
            console.log('Authentication failed: ' + err);
        }
    });
    return result;
}

function loadExploreYourAreaGroups() {

    console.log('Loading explore your area with counts...');

    //alert(searchUrl);
    showPageLoadingMsg('Loading groups...');

    //TODO - dont reload the counts if the lat/long/radius hasnt changed
    var latLongRadius = OZA.currentLatitude + '|' + OZA.currentLongitude + '|' + getCurrentRadius();

    if (latLongRadius != OZA.currentLatLongRadius || OZA.lastExploreQueryEmpty) {
    
    	OZA.lastExploreQueryEmpty = true;	
        OZA.currentLatLongRadius = latLongRadius;
        //get the counts
        console.log('Retrieve species group counts...');
        $('#speciesGroupsList').empty();

        var searchUrl = M_URL + '/exploreGroups?lat=' + OZA.currentLatitude + '&lon=' + OZA.currentLongitude + '&radius=' + getCurrentRadius();

        $.getJSON(searchUrl, function (data) {

            var emptyResultList = true;

            for (var i = 0; i < data.length; i++) {
                console.log(data[i].name + ' : ' + data[i].speciesCount);
                if (data[i].speciesCount > 0 && data[i].name != "Arthropods" && data[i].name != "Animals" && data[i].name != "ALL_SPECIES" && data[i].name != "Chromista" && data[i].name != "Protozoa" && data[i].name != "Bacteria") {

                    var javascriptLink = "\"javascript:exploreGroup('" + data[i].name + "');\"";

                    $('#speciesGroupsList').append('<li><a href=' + javascriptLink + '><img src=\'images/' + data[i].name + '.jpg\'/><h3>' + data[i].name + '</h3><span class="ui-li-count">' + data[i].speciesCount + '</span><p><span class="currentLocation"></span></p></a></li>');
                    emptyResultList = false;
                }
            }

            if (emptyResultList) {
                $('#speciesGroupsList').append('<li>No taxa found for <span class="currentLocation"></span>. Please refine your area by zooming out to increase the search radius, or search for another location.</li>');
            } else {
	            OZA.lastExploreQueryEmpty = false;
            }

            $('.currentLocation').each(function () {

                var retrievedLocality = $('#locality').val();
                if (retrievedLocality == null || retrievedLocality == '') {
                    retrievedLocality = OZA.currentLatitude + '&deg;, ' + OZA.currentLongitude + '&deg;';
                }

                if (OZA.circle.getRadius() > 1000) {
                    $(this).html((OZA.circle.getRadius() / 1000) + ' km around ' + retrievedLocality);
                } else {
                    $(this).html(OZA.circle.getRadius() + ' metres around ' + retrievedLocality);
                }
            });

            $('#speciesGroupsList').listview('refresh');
            hidePageLoadingMsg();
            //$('body').removeClass('ui-loading');
            console.log('Finished - Retrieve species group counts');
        }).error(function () {
            hidePageLoadingMsg();
            alert('There was a problem loading these groups. Please try again.');
        });
    } else {
        hidePageLoadingMsg();
        console.log('Lat/Long/Radius unchanged - avoiding WS call....OZA.lastExploreQueryEmpty: ' + OZA.lastExploreQueryEmpty);
    }
}