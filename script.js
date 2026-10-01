// MÚSICAS PADRÃO (Usadas caso Firebase esteja vazio)
const defaultSongs = [
  {
    id: 0,
    title: "Acoustic Breeze",
    artist: "Benjamin Tissot",
    album: "Acoustic Dreams",
    duration: "2:37",
    cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300",
    src: "https://www.bensound.com/bensound-music/bensound-acousticbreeze.mp3",
    isLiked: true
  },
  {
    id: 1,
    title: "Creative Minds",
    artist: "Bensound",
    album: "Inspiration Vol. 1",
    duration: "2:27",
    cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300",
    src: "https://www.bensound.com/bensound-music/bensound-creativeminds.mp3",
    isLiked: true
  },
  {
    id: 2,
    title: "Ukulele Sunshine",
    artist: "Royalty Free Band",
    album: "Summer Vibes",
    duration: "2:26",
    cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300",
    src: "https://www.bensound.com/bensound-music/bensound-ukulele.mp3",
    isLiked: false
  },
  {
    id: 3,
    title: "Sunny Day",
    artist: "Chill Hop",
    album: "Relaxation",
    duration: "2:20",
    cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300",
    src: "https://www.bensound.com/bensound-music/bensound-sunny.mp3",
    isLiked: false
  }
];

// Dados dos Gêneros
const genres = [
  { name: "Pop", color: "#e8115b", image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200" },
  { name: "Sertanejo", color: "#27856a", image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200" },
  { name: "Funk", color: "#d84000", image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200" },
  { name: "Rock", color: "#e91429", image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200" },
  { name: "Hip-Hop", color: "#bc5900", image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200" },
  { name: "Eletrônica", color: "#1e3264", image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200" },
  { name: "Indie", color: "#608108", image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200" },
  { name: "MPB", color: "#8d67ab", image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200" }
];

let songs = [];
let currentSongIndex = 0;
let isPlaying = false;

// Elementos DOM
const audioPlayer = document.getElementById("audio-player");
const playPauseBtn = document.getElementById("play-pause-btn");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");

const currentCover = document.getElementById("current-cover");
const currentTitle = document.getElementById("current-title");
const currentArtist = document.getElementById("current-artist");

const progressBar = document.getElementById("progress-bar");
const currentTimeEl = document.getElementById("current-time");
const durationEl = document.getElementById("duration");

const volumeBar = document.getElementById("volume-bar");
const searchInput = document.getElementById("search-input");
const likeBtn = document.querySelector(".like-btn");

// Containers
const quickAccessContainer = document.getElementById("quick-access-container");
const recommendedContainer = document.getElementById("recommended-container");
const missedContainer = document.getElementById("missed-container");

// Navegação
const navHome = document.getElementById("nav-home");
const navSearch = document.getElementById("nav-search");
const navLikedPlaylist = document.getElementById("nav-liked-playlist");
const navCreator = document.getElementById("nav-creator");
const headerHomeBtn = document.getElementById("header-home-btn");

const homeView = document.getElementById("home-view");
const searchView = document.getElementById("search-view");
const likedView = document.getElementById("liked-view");
const creatorView = document.getElementById("creator-view");

const recentSearchContainer = document.getElementById("recent-search-container");
const genreGrid = document.getElementById("genre-grid");
const searchDefaultSection = document.getElementById("search-default-section");
const searchResultsSection = document.getElementById("search-results-section");
const searchResultsContainer = document.getElementById("search-results-container");

const likedTracksBody = document.getElementById("liked-tracks-body");
const likedCountEl = document.getElementById("liked-count");

const creatorSongsBody = document.getElementById("creator-songs-body");
const creatorSongsCount = document.getElementById("creator-songs-count");
const addSongForm = document.getElementById("add-song-form");

// ==========================================================================
// 🔥 SINCRONIZAÇÃO EM TEMPO REAL COM FIREBASE
// ==========================================================================
function setupFirebaseListener() {
  database.ref('songs').on('value', (snapshot) => {
    const data = snapshot.val();
    
    if (data && Array.isArray(data)) {
      songs = data;
    } else if (data && typeof data === 'object') {
      songs = Object.values(data);
    } else {
      // Se tiver totalmente vazio, insere faixas padrão
      database.ref('songs').set(defaultSongs);
      songs = defaultSongs;
    }

    // Atualiza todas as visualizações ativas
    renderQuickAccessGrid();
    renderCardsInto(recommendedContainer, songs);
    renderCardsInto(missedContainer, [...songs].reverse());

    if (!likedView.classList.contains("hidden")) {
      renderLikedSongs();
    }
    if (!creatorView.classList.contains("hidden")) {
      renderCreatorSongsList();
    }
    updateLikeButtonUI();
  });
}

function toggleLikeSong(id) {
  const songIndex = songs.findIndex(s => s.id === id);
  if (songIndex !== -1) {
    const newLikedStatus = !songs[songIndex].isLiked;
    database.ref('songs/' + songIndex).update({
      isLiked: newLikedStatus
    });
  }
}

// ==========================================================================
// 🚀 PAINEL DO CRIADOR (CADASTRAR E EXCLUIR MÚSICAS NO FIREBASE)
// ==========================================================================

// Renderiza a lista de gerenciamento no Painel do Criador
function renderCreatorSongsList() {
  creatorSongsBody.innerHTML = "";
  creatorSongsCount.textContent = songs.length;

  if (songs.length === 0) {
    creatorSongsBody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-message">Nenhuma música cadastrada no Firebase. Adicione uma acima!</td>
      </tr>
    `;
    return;
  }

  songs.forEach((song, index) => {
    const tr = document.createElement("tr");
    tr.classList.add("track-row");

    tr.innerHTML = `
      <td class="col-num">${index + 1}</td>
      <td class="col-title">
        <img src="${song.cover}" alt="${song.title}" />
        <div class="title-details">
          <span class="song-title">${song.title}</span>
          <span class="song-artist">${song.artist}</span>
        </div>
      </td>
      <td class="col-album">${song.album}</td>
      <td class="col-duration">${song.duration}</td>
      <td style="text-align: right; padding-right: 20px;">
        <button class="btn-delete-song" title="Excluir música do Firebase">
          <i class="fa-solid fa-trash-can"></i> Excluir
        </button>
      </td>
    `;

    // Evento de clique para excluir
    const deleteBtn = tr.querySelector(".btn-delete-song");
    deleteBtn.addEventListener("click", () => {
      if (confirm(`Tem certeza que deseja excluir a música "${song.title}" do Firebase?`)) {
        deleteSongFromFirebase(index);
      }
    });

    creatorSongsBody.appendChild(tr);
  });
}

// Cadastra uma nova música
addSongForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const title = document.getElementById("song-title").value.trim();
  const artist = document.getElementById("song-artist").value.trim();
  const album = document.getElementById("song-album").value.trim();
  const duration = document.getElementById("song-duration").value.trim();
  const cover = document.getElementById("song-cover").value.trim();
  const src = document.getElementById("song-src").value.trim();

  // Gera o próximo ID único
  const newId = songs.length > 0 ? Math.max(...songs.map(s => s.id)) + 1 : 0;

  const newSong = {
    id: newId,
    title: title,
    artist: artist,
    album: album,
    duration: duration,
    cover: cover,
    src: src,
    isLiked: false
  };

  // Cria a nova lista atualizada e salva no Firebase
  const updatedSongs = [...songs, newSong];

  database.ref('songs').set(updatedSongs, (error) => {
    if (error) {
      alert("Erro ao salvar música: " + error.message);
    } else {
      alert(`Música "${title}" publicada com sucesso no Firebase!`);
      addSongForm.reset();
    }
  });
});

// Remove uma música do Firebase
function deleteSongFromFirebase(indexToRemove) {
  const updatedSongs = songs.filter((_, index) => index !== indexToRemove);
  
  // Reordena os IDs para manter o vetor limpo
  const reindexedSongs = updatedSongs.map((song, idx) => ({
    ...song,
    id: idx
  }));

  database.ref('songs').set(reindexedSongs, (error) => {
    if (error) {
      alert("Erro ao excluir música: " + error.message);
    }
  });
}

// ==========================================================================
// RENDERIZAÇÃO DA HOME
// ==========================================================================
function renderQuickAccessGrid() {
  quickAccessContainer.innerHTML = "";
  const quickSongs = songs.slice(0, 8);
  
  quickSongs.forEach((song) => {
    const card = document.createElement("div");
    card.classList.add("quick-card");

    card.innerHTML = `
      <img src="${song.cover}" alt="${song.title}" />
      <span>${song.title}</span>
      <button class="play-btn-quick"><i class="fa-solid fa-play"></i></button>
    `;

    card.addEventListener("click", () => {
      const targetIndex = songs.findIndex(s => s.id === song.id);
      loadTrack(targetIndex !== -1 ? targetIndex : 0);
      playSong();
    });

    quickAccessContainer.appendChild(card);
  });
}

function renderCardsInto(container, songList) {
  container.innerHTML = "";
  
  if (!songList || songList.length === 0) {
    container.innerHTML = `<p style="color: #b3b3b3;">Nenhuma música encontrada.</p>`;
    return;
  }

  songList.forEach((song) => {
    const card = document.createElement("div");
    card.classList.add("card");

    card.innerHTML = `
      <div class="cover">
        <img src="${song.cover}" alt="${song.title}" class="card-img" />
        <button class="play-btn-card"><i class="fa-solid fa-play"></i></button>
      </div>
      <h4>${song.title}</h4>
      <p>Com ${song.artist} e outros</p>
    `;

    card.addEventListener("click", () => {
      const targetIndex = songs.findIndex(s => s.id === song.id);
      loadTrack(targetIndex !== -1 ? targetIndex : 0);
      playSong();
    });

    container.appendChild(card);
  });
}

function renderGenres() {
  genreGrid.innerHTML = "";
  genres.forEach((genre) => {
    const card = document.createElement("div");
    card.classList.add("genre-card");
    card.style.backgroundColor = genre.color;

    card.innerHTML = `
      <h3>${genre.name}</h3>
      <img src="${genre.image}" alt="${genre.name}" />
    `;

    genreGrid.appendChild(card);
  });
}

function renderLikedSongs() {
  likedTracksBody.innerHTML = "";
  const likedSongs = songs.filter(song => song.isLiked);
  
  likedCountEl.textContent = `${likedSongs.length} ${likedSongs.length === 1 ? 'música' : 'músicas'}`;

  if (likedSongs.length === 0) {
    likedTracksBody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-message">Você ainda não tem músicas curtidas.</td>
      </tr>
    `;
    return;
  }

  likedSongs.forEach((song, index) => {
    const tr = document.createElement("tr");
    tr.classList.add("track-row");

    tr.innerHTML = `
      <td class="col-num">
        <span class="row-num">${index + 1}</span>
        <i class="fa-solid fa-play play-icon-row"></i>
      </td>
      <td class="col-title">
        <img src="${song.cover}" alt="${song.title}" />
        <div class="title-details">
          <span class="song-title">${song.title}</span>
          <span class="song-artist">${song.artist}</span>
        </div>
      </td>
      <td class="col-album">${song.album}</td>
      <td class="col-like">
        <button class="btn-row-like"><i class="fa-solid fa-heart"></i></button>
      </td>
      <td class="col-duration">${song.duration}</td>
    `;

    tr.addEventListener("click", (e) => {
      if (e.target.closest(".btn-row-like")) return;
      const targetIndex = songs.findIndex(s => s.id === song.id);
      loadTrack(targetIndex !== -1 ? targetIndex : 0);
      playSong();
    });

    const rowLikeBtn = tr.querySelector(".btn-row-like");
    rowLikeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleLikeSong(song.id);
    });

    likedTracksBody.appendChild(tr);
  });
}

// ==========================================================================
// NAVEGAÇÃO ENTRE ABAS
// ==========================================================================
function showHomeView() {
  homeView.classList.remove("hidden");
  searchView.classList.add("hidden");
  likedView.classList.add("hidden");
  creatorView.classList.add("hidden");
  setActiveNav(navHome);
}

function showSearchView() {
  homeView.classList.add("hidden");
  searchView.classList.remove("hidden");
  likedView.classList.add("hidden");
  creatorView.classList.add("hidden");
  setActiveNav(navSearch);
  
  renderCardsInto(recentSearchContainer, songs);
  renderGenres();
  searchInput.focus();
}

function showLikedView() {
  homeView.classList.add("hidden");
  searchView.classList.add("hidden");
  likedView.classList.remove("hidden");
  creatorView.classList.add("hidden");
  setActiveNav(navLikedPlaylist);
  renderLikedSongs();
}

function showCreatorView() {
  homeView.classList.add("hidden");
  searchView.classList.add("hidden");
  likedView.classList.add("hidden");
  creatorView.classList.remove("hidden");
  setActiveNav(navCreator);
  renderCreatorSongsList();
}

function setActiveNav(activeElement) {
  document.querySelectorAll(".nav-menu li, .playlists-list li").forEach(li => li.classList.remove("active"));
  if (activeElement) activeElement.classList.add("active");
}

navHome.addEventListener("click", (e) => { e.preventDefault(); showHomeView(); });
headerHomeBtn.addEventListener("click", showHomeView);
navSearch.addEventListener("click", (e) => { e.preventDefault(); showSearchView(); });
navLikedPlaylist.addEventListener("click", (e) => { e.preventDefault(); showLikedView(); });
navCreator.addEventListener("click", (e) => { e.preventDefault(); showCreatorView(); });

searchInput.addEventListener("focus", () => {
  if (searchView.classList.contains("hidden")) showSearchView();
});

searchInput.addEventListener("input", (e) => {
  const searchTerm = e.target.value.trim().toLowerCase();

  if (searchTerm.length > 0) {
    searchDefaultSection.classList.add("hidden");
    searchResultsSection.classList.remove("hidden");

    const filtered = songs.filter(song => 
      song.title.toLowerCase().includes(searchTerm) || 
      song.artist.toLowerCase().includes(searchTerm) ||
      song.album.toLowerCase().includes(searchTerm)
    );

    renderCardsInto(searchResultsContainer, filtered);
  } else {
    searchDefaultSection.classList.remove("hidden");
    searchResultsSection.classList.add("hidden");
  }
});

// ==========================================================================
// CONTROLES DO PLAYER
// ==========================================================================
function loadTrack(index) {
  if (!songs || songs.length === 0) return;

  currentSongIndex = index;
  const song = songs[currentSongIndex];

  if (!song) return;

  audioPlayer.src = song.src;
  currentCover.src = song.cover;
  currentTitle.textContent = song.title;
  currentArtist.textContent = song.artist;

  updateLikeButtonUI();

  progressBar.value = 0;
  currentTimeEl.textContent = "0:00";
  durationEl.textContent = "0:00";
}

function playSong() {
  isPlaying = true;
  audioPlayer.play();
  playPauseBtn.innerHTML = `<i class="fa-solid fa-circle-pause"></i>`;
}

function pauseSong() {
  isPlaying = false;
  audioPlayer.pause();
  playPauseBtn.innerHTML = `<i class="fa-solid fa-circle-play"></i>`;
}

function togglePlayPause() {
  if (isPlaying) pauseSong();
  else playSong();
}

function nextSong() {
  if (songs.length === 0) return;
  currentSongIndex = (currentSongIndex + 1) % songs.length;
  loadTrack(currentSongIndex);
  playSong();
}

function prevSong() {
  if (songs.length === 0) return;
  currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
  loadTrack(currentSongIndex);
  playSong();
}

function formatTime(seconds) {
  if (isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function updateLikeButtonUI() {
  const currentSong = songs[currentSongIndex];
  if (currentSong && currentSong.isLiked) {
    likeBtn.classList.add("active");
    likeBtn.innerHTML = `<i class="fa-solid fa-heart"></i>`;
  } else {
    likeBtn.classList.remove("active");
    likeBtn.innerHTML = `<i class="fa-regular fa-heart"></i>`;
  }
}

likeBtn.addEventListener("click", () => {
  if (songs[currentSongIndex]) {
    toggleLikeSong(songs[currentSongIndex].id);
  }
});

playPauseBtn.addEventListener("click", togglePlayPause);
nextBtn.addEventListener("click", nextSong);
prevBtn.addEventListener("click", prevSong);

audioPlayer.addEventListener("timeupdate", () => {
  if (audioPlayer.duration) {
    const progressPercent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    progressBar.value = progressPercent;
    currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
  }
});

audioPlayer.addEventListener("loadedmetadata", () => {
  durationEl.textContent = formatTime(audioPlayer.duration);
});

audioPlayer.addEventListener("ended", nextSong);

progressBar.addEventListener("input", () => {
  const seekTime = (progressBar.value / 100) * audioPlayer.duration;
  audioPlayer.currentTime = seekTime;
});

volumeBar.addEventListener("input", (e) => {
  audioPlayer.volume = e.target.value / 100;
});

// INICIALIZAÇÃO
document.addEventListener("DOMContentLoaded", () => {
  setupFirebaseListener();
});