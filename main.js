const APIController = (function() {
    
    const clientId = 'c695b8740ba94cc6b627c5beb47c459e';
    const clientSecret = '326802405c264347a40b73aff2057992';

    // metodos privados
    const _getToken = async () => {

        const result = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type' : 'application/x-www-form-urlencoded', 
                'Authorization' : 'Basic ' + btoa( clientId + ':' + clientSecret)
            },
            body: 'grant_type=client_credentials'
        });

        const data = await result.json();
        return data.access_token;
    }
    
    const _getGenres = async (token) => {

        const result = await fetch(`https://api.spotify.com/v1/browse/categories?locale=sv_MX`, {
            method: 'GET',
            headers: { 'Authorization' : 'Bearer ' + token}
        });

        const data = await result.json();
        return data.categories.items;
    }

    const _getPlaylistByGenre = async (token, genreId) => {

        const limit = 10;
        
        const result = await fetch(`https://api.spotify.com/v1/browse/categories/${genreId}/playlists?limit=${limit}`, {
            method: 'GET',
            headers: { 'Authorization' : 'Bearer ' + token}
        });

        const data = await result.json();
        return data.playlists.items;
    }

    const _getTracks = async (token, tracksEndPoint) => {

        const limit = 10;

        const result = await fetch(`${tracksEndPoint}?limit=${limit}`, {
            method: 'GET',
            headers: { 'Authorization' : 'Bearer ' + token}
        });

        const data = await result.json();
        return data.items;
    }

    const _getTrack = async (token, trackEndPoint) => {

        const result = await fetch(`${trackEndPoint}`, {
            method: 'GET',
            headers: { 'Authorization' : 'Bearer ' + token}
        });

        const data = await result.json();
        return data;
    }

    return {
        getToken() {
            return _getToken();
        },
        getGenres(token) {
            return _getGenres(token);
        },
        getPlaylistByGenre(token, genreId) {
            return _getPlaylistByGenre(token, genreId);
        },
        getTracks(token, tracksEndPoint) {
            return _getTracks(token, tracksEndPoint);
        },
        getTrack(token, trackEndPoint) {
            return _getTrack(token, trackEndPoint);
        }
    }
})();


// Modulo UI
const UIController = (function() {

    // objeto para mantener las referencias a los selectores html
    const DOMElements = {
        selectGenre: '#select_genre',
        selectPlaylist: '#select_playlist',
        buttonSubmit: '#btn_submit',
        divSongDetail: '#song-detail',
        hfToken: '#hidden_token',
        divSonglist: '.song-list'
    }

    // metodos publicos
    return {

        // metodos para obtener los campos de entrada
        inputField() {
            return {
                genre: document.querySelector(DOMElements.selectGenre),
                playlist: document.querySelector(DOMElements.selectPlaylist),
                tracks: document.querySelector(DOMElements.divSonglist),
                submit: document.querySelector(DOMElements.buttonSubmit),
                songDetail: document.querySelector(DOMElements.divSongDetail)
            }
        },

        // metodos para crear un selector
        createGenre(text, value) {
            const html = `<option value="${value}">${text}</option>`;
            document.querySelector(DOMElements.selectGenre).insertAdjacentHTML('beforeend', html);
        }, 

        createPlaylist(text, value) {
            const html = `<option value="${value}">${text}</option>`;
            document.querySelector(DOMElements.selectPlaylist).insertAdjacentHTML('beforeend', html);
        },

        // metodo para crear una lista de canciones 
        createTrack(id, name) {
            const html = `<a href="#" class="list-group-item list-group-item-action list-group-item-light" id="${id}">${name}</a>`;
            document.querySelector(DOMElements.divSonglist).insertAdjacentHTML('beforeend', html);
        },

        // metodo para crear los detalles de las canciones
        createTrackDetail(img, title, artist) {

            const detailDiv = document.querySelector(DOMElements.divSongDetail);
            // cada que el usuario da click en una nueva cancion, se debe limpiar el div de las canciones
            detailDiv.innerHTML = '';
//   width: 130px; height: 130px;    right: -20%; top: -4em;
            const html = 
            `
            <div class="row col-sm-12 px-0">
                <img src="${img}" alt="" style="position: relative; left:7em; top: 3em; width:100px; height:100px;">
            </div>
            <div class="row col-sm-12 px-0">
                <label for="Genre" class="form-label col-sm-12" style="position: relative; left:2em; top: -2em;">${title}:</label>
            </div>
            <div class="row col-sm-12 px-0">
                <label for="artist" class="form-label col-sm-12" style="position: relative; left:2em; top: 0em;">By ${artist}:</label>
            </div>
            `;

            detailDiv.insertAdjacentHTML('beforeend', html)
        },

        resetTrackDetail() {
            this.inputField().songDetail.innerHTML = '';
        },

        resetTracks() {
            this.inputField().tracks.innerHTML = '';
            this.resetTrackDetail();
        },

        resetPlaylist() {
            this.inputField().playlist.innerHTML = '';
            this.resetTracks();
        },
        
        storeToken(value) {
            document.querySelector(DOMElements.hfToken).value = value;
        },

        getStoredToken() {
            return {
                token: document.querySelector(DOMElements.hfToken).value
            }
        }
    }

})();

const APPController = (function(UICtrl, APICtrl) {

    // obtener el campo de entrada del objeto ref
    const DOMInputs = UICtrl.inputField();

    // obtener los generos al cargar la pagina
    const loadGenres = async () => {
        // obtener el token
        const token = await APICtrl.getToken();           
        // guardar el token en la pagina
        UICtrl.storeToken(token);
        // obtener los generos
        const genres = await APICtrl.getGenres(token);
        //poblar los generos del elemento select
        genres.forEach(element => UICtrl.createGenre(element.name, element.id));
    }

    // crear un disparador de eventos para el genero
    DOMInputs.genre.addEventListener('change', async () => {
        // reinicio del playlist
        UICtrl.resetPlaylist();
        // obtener el token que esta almacenado en la pagina
        const token = UICtrl.getStoredToken().token;        
        // obtener el genero del campo seleccionado
        const genreSelect = UICtrl.inputField().genre;       
        // obtener el id del genero asociado con el genero seleccionado
        const genreId = genreSelect.options[genreSelect.selectedIndex].value;             
        // obtener la lista de reproduccion basada en el genero
        const playlist = await APICtrl.getPlaylistByGenre(token, genreId);       
        // crear una lista de items de reproduccion para cada playlist a la que se acceda
        playlist.forEach(p => UICtrl.createPlaylist(p.name, p.tracks.href));
    });
     

    // creamos un boton submit para los eventos
    DOMInputs.submit.addEventListener('click', async (e) => {
        // prevenimos el reset de la pagina
        e.preventDefault();
        // limpiamos los tracks
        UICtrl.resetTracks();
        //get the token
        const token = UICtrl.getStoredToken().token;        
        // obtenemos el campo del playlist
        const playlistSelect = UICtrl.inputField().playlist;
        // obtenemos el punto final del track basado en la lista de reproduccion selecionada
        const tracksEndPoint = playlistSelect.options[playlistSelect.selectedIndex].value;
        // obtenemos la lista de los tracks
        const tracks = await APICtrl.getTracks(token, tracksEndPoint);
        // creamos una lista de los elementos de las canciones
        tracks.forEach(el => UICtrl.createTrack(el.track.href, el.track.name))
        
    });

    // creamos un disparador de eventos al seleccionar una cancion
    DOMInputs.tracks.addEventListener('click', async (e) => {
        // prevenimos el reseteo de la pagina
        e.preventDefault();
        UICtrl.resetTrackDetail();
        // obtenemos el token
        const token = UICtrl.getStoredToken().token;
        // obtener el punto final del track
        const trackEndpoint = e.target.id;
        // obtenemos el objeto del track
        const track = await APICtrl.getTrack(token, trackEndpoint);
        // cargamos los detalles del track
        UICtrl.createTrackDetail(track.album.images[2].url, track.name, track.artists[0].name);
    });    

    return {
        init() {
            console.log('App is starting');
            loadGenres();
        }
    }

})(UIController, APIController);

$('.carousel').carousel({
  interval: 2000
})

// metodo para cargar los generos de la pagina que se esta cargando
APPController.init();