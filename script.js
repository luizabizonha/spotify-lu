import { database, ref, onValue, set } from './firebase-config.js';

// ==========================================================================
// 1. ESTADO GLOBAL DA APLICAÇÃO
// ==========================================================================
let songs = [];
let recentlyPlayed = []; // Guarda histórico de músicas tocadas
let currentSongIndex = -1;
let isPlaying = false;
let editingIndex = null;

const audio = new Audio();

// Seletores de Navegação
const logoBtn = document.getElementById("logo-btn");
const homeIconBtn = document.getElementById("home-icon-btn");
const searchBarWrapper = document.getElementById("search-bar-wrapper");
const globalSearchInput = document.getElementById("global-search-input");
const creatorTabBtn = document.getElementById("creator-tab-btn");

const homeView = document.getElementById("home-view");
const searchView = document.getElementById("search-view");
const creatorView = document.getElementById("creator-view");

// Seletores do Player
const playPauseBtn = document.getElementById("play-pause-btn");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const progressBar = document.getElementById("progress-bar");
const currentTimeEl = document.getElementById("current-time");
const durationTimeEl = document.getElementById("duration-time");
const volumeBar = document.getElementById("volume-bar");
const playerCover = document.getElementById("player-cover");
const playerTitle = document.getElementById("player-title");
const playerArtist = document.getElementById("player-artist");

// Seletores do Painel do Criador
const addSongForm = document.getElementById("add-song-form");
const songTitleInput = document.getElementById("song-title");
const songArtistInput = document.getElementById("song-artist");
const coverFileInput = document.getElementById("song-cover-file");
const audioFileInput = document.getElementById("song-src-file");
const submitSongBtn = document.getElementById("submit-song-btn");
const cancelEditBtn = document.getElementById("cancel-edit-btn");
const formTitle = document.getElementById("form-title");
const coverStatus = document.getElementById("cover-status");
const audioStatus = document.getElementById("audio-status");
const creatorSongsBody = document.getElementById("creator-songs-body");
const creatorSongsCount = document.getElementById("creator-songs-count");

// Containers
const quickGrid = document.getElementById("quick-grid");
const homeCardsGrid = document.getElementById("home-cards-grid");
const homeSongsBody = document.getElementById("home-songs-body");
const searchCardsGrid = document.getElementById("search-cards-grid");
const searchSongsBody = document.getElementById("search-songs-body");
const searchSectionTitle = document.getElementById("search-section-title");

// ==========================================================================
// 2. NAVEGAÇÃO E MANIPULAÇÃO DE ABAS
// ==========================================================================
function switchTab(viewName) {
  homeView.classList.add("hidden");
  searchView.classList.add("hidden");
  creatorView.classList.add("hidden");

  homeIconBtn.classList.remove("active");

  if (viewName === "home") {
    homeView.classList.remove("hidden");
    homeIconBtn.classList.add("active");
  } else if (viewName === "search") {
    searchView.classList.remove("hidden");
    renderSearchView();
  } else if (viewName === "creator") {
    creatorView.classList.remove("hidden");
  }
}

// Eventos de Navegação
logoBtn.addEventListener("click", () => switchTab("home"));
homeIconBtn.addEventListener("click", () => switchTab("home"));
creatorTabBtn.addEventListener("click", () => switchTab("creator"));

// Ao clicar na barra de busca, muda para a tela "Buscar"
globalSearchInput.addEventListener("focus", () => switchTab("search"));
searchBarWrapper.addEventListener("click", () => switchTab("search"));

globalSearchInput.addEventListener("input", () => {
  if (searchView.classList.contains("hidden")) {
    switchTab("search");
  } else {
    renderSearchView();
  }
});

// ==========================================================================
// 3. UTILITÁRIOS & SINCRONIZAÇÃO FIREBASE
// ==========================================================================
function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

function formatTime(seconds) {
  if (isNaN(seconds) || seconds <= 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Escuta alterações em tempo real no Firebase
const songsRef = ref(database, 'songs');
onValue(songsRef, (snapshot) => {
  const data = snapshot.val();
  songs = data ? (Array.isArray(data) ? data : Object.values(data)) : [];

  renderHomeView();
  renderCreatorSongsList();
  renderSearchView();

  if (songs.length > 0 && !audio.src) {
    loadSong(0, false);
  }
});

// ==========================================================================
// 4. REPRODUÇÃO E PLAYER
// ==========================================================================
function loadSong(index, shouldPlay = true) {
  if (!songs[index]) return;

  currentSongIndex = index;
  const song = songs[currentSongIndex];

  audio.src = song.src;
  playerCover.src = song.cover || "https://via.placeholder.com/56";
  playerTitle.textContent = song.title || "Sem título";
  playerArtist.textContent = song.artist || "Artista desconhecido";

  // Adiciona ao histórico de tocadas recentemente
  addToRecentlyPlayed(song);

  if (shouldPlay) {
    playSong();
  } else {
    pauseSong();
  }

  renderHomeView();
  if (!searchView.classList.contains("hidden")) renderSearchView();
}

function addToRecentlyPlayed(song) {
  recentlyPlayed = recentlyPlayed.filter(s => s.src !== song.src);
  recentlyPlayed.unshift(song);
  if (recentlyPlayed.length > 10) recentlyPlayed.pop();
}

function playSong() {
  if (!audio.src) return;
  isPlaying = true;
  audio.play();
  playPauseBtn.innerHTML = `<i class="fa-solid fa-circle-pause"></i>`;
}

function pauseSong() {
  isPlaying = false;
  audio.pause();
  playPauseBtn.innerHTML = `<i class="fa-solid fa-circle-play"></i>`;
}

function togglePlay() {
  if (songs.length === 0) return;
  if (isPlaying) pauseSong();
  else playSong();
}

function nextSong() {
  if (songs.length === 0) return;
  currentSongIndex = (currentSongIndex + 1) % songs.length;
  loadSong(currentSongIndex, true);
}

function prevSong() {
  if (songs.length === 0) return;
  currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
  loadSong(currentSongIndex, true);
}

// Eventos do Player
audio.addEventListener("timeupdate", () => {
  if (audio.duration) {
    progressBar.value = (audio.currentTime / audio.duration) * 100 || 0;
    currentTimeEl.textContent = formatTime(audio.currentTime);
    durationTimeEl.textContent = formatTime(audio.duration);
  }
});

audio.addEventListener("ended", nextSong);

progressBar.addEventListener("input", (e) => {
  if (audio.duration) audio.currentTime = (e.target.value / 100) * audio.duration;
});

volumeBar.addEventListener("input", (e) => {
  audio.volume = e.target.value / 100;
});

playPauseBtn.addEventListener("click", togglePlay);
nextBtn.addEventListener("click", nextSong);
prevBtn.addEventListener("click", prevSong);

// ==========================================================================
// 5. RENDERIZAÇÃO DA HOME
// ==========================================================================
function renderHomeView() {
  // Quick Grid (Topo da Home)
  quickGrid.innerHTML = "";
  const quickItems = songs.slice(0, 8);
  quickItems.forEach((song) => {
    const actualIndex = songs.indexOf(song);
    const card = document.createElement("div");
    card.classList.add("quick-card");
    card.innerHTML = `
      <img src="${song.cover || 'https://via.placeholder.com/56'}" alt="${song.title}" />
      <span>${song.title}</span>
    `;
    card.addEventListener("click", () => loadSong(actualIndex, true));
    quickGrid.appendChild(card);
  });

  // Cards Grid (Músicas do Firebase)
  homeCardsGrid.innerHTML = "";
  songs.forEach((song, index) => {
    const card = document.createElement("div");
    card.classList.add("spotify-card");
    card.innerHTML = `
      <div class="card-img-wrapper">
        <img src="${song.cover || 'https://via.placeholder.com/180'}" alt="${song.title}" />
        <button class="card-play-btn"><i class="fa-solid fa-play"></i></button>
      </div>
      <div class="card-title">${song.title}</div>
      <div class="card-artist">${song.artist}</div>
    `;
    card.addEventListener("click", () => loadSong(index, true));
    homeCardsGrid.appendChild(card);
  });

  // Tabela Home
  homeSongsBody.innerHTML = "";
  if (songs.length === 0) {
    homeSongsBody.innerHTML = `<tr><td colspan="4" class="empty-message">Nenhuma música cadastrada no Firebase.</td></tr>`;
    return;
  }

  songs.forEach((song, index) => {
    const tr = document.createElement("tr");
    tr.classList.add("track-row");
    if (index === currentSongIndex) tr.style.backgroundColor = "rgba(29, 185, 84, 0.15)";

    tr.innerHTML = `
      <td class="col-num">${index + 1}</td>
      <td class="col-title">
        <img src="${song.cover || 'https://via.placeholder.com/42'}" alt="${song.title}" />
        <div class="title-details">
          <span class="song-title">${song.title}</span>
          <span class="song-artist">${song.artist}</span>
        </div>
      </td>
      <td class="col-album">${song.album || 'Single'}</td>
      <td class="col-duration">${song.duration || '--:--'}</td>
    `;
    tr.addEventListener("click", () => loadSong(index, true));
    homeSongsBody.appendChild(tr);
  });
}

// ==========================================================================
// 6. RENDERIZAÇÃO DA TELA "BUSCAR" (TOCADAS RECENTEMENTE / RESULTADOS)
// ==========================================================================
function renderSearchView() {
  const query = globalSearchInput.value.trim().toLowerCase();
  searchCardsGrid.innerHTML = "";
  searchSongsBody.innerHTML = "";

  if (query === "") {
    searchSectionTitle.textContent = "Tocadas recentemente";
    const listToRender = recentlyPlayed.length > 0 ? recentlyPlayed : songs;

    listToRender.forEach((song) => {
      const actualIndex = songs.indexOf(song);
      
      // Card de Tocadas Recentemente
      const card = document.createElement("div");
      card.classList.add("spotify-card");
      card.innerHTML = `
        <div class="card-img-wrapper">
          <img src="${song.cover || 'https://via.placeholder.com/180'}" alt="${song.title}" />
          <button class="card-play-btn"><i class="fa-solid fa-play"></i></button>
        </div>
        <div class="card-title">${song.title}</div>
        <div class="card-artist">${song.artist}</div>
      `;
      card.addEventListener("click", () => loadSong(actualIndex, true));
      searchCardsGrid.appendChild(card);

      // Tabela de Tocadas Recentemente
      const tr = document.createElement("tr");
      tr.classList.add("track-row");
      tr.innerHTML = `
        <td class="col-num"><i class="fa-solid fa-clock-rotate-left"></i></td>
        <td class="col-title">
          <img src="${song.cover || 'https://via.placeholder.com/42'}" alt="${song.title}" />
          <div class="title-details">
            <span class="song-title">${song.title}</span>
            <span class="song-artist">${song.artist}</span>
          </div>
        </td>
        <td class="col-album">${song.album || 'Single'}</td>
        <td class="col-duration">${song.duration || '--:--'}</td>
      `;
      tr.addEventListener("click", () => loadSong(actualIndex, true));
      searchSongsBody.appendChild(tr);
    });
  } else {
    searchSectionTitle.textContent = `Resultados para "${query}"`;
    const filtered = songs.filter(s => 
      (s.title || "").toLowerCase().includes(query) ||
      (s.artist || "").toLowerCase().includes(query)
    );

    if (filtered.length === 0) {
      searchSongsBody.innerHTML = `<tr><td colspan="4" class="empty-message">Nenhuma música encontrada para sua pesquisa.</td></tr>`;
      return;
    }

    filtered.forEach((song, idx) => {
      const actualIndex = songs.indexOf(song);

      const card = document.createElement("div");
      card.classList.add("spotify-card");
      card.innerHTML = `
        <div class="card-img-wrapper">
          <img src="${song.cover || 'https://via.placeholder.com/180'}" alt="${song.title}" />
          <button class="card-play-btn"><i class="fa-solid fa-play"></i></button>
        </div>
        <div class="card-title">${song.title}</div>
        <div class="card-artist">${song.artist}</div>
      `;
      card.addEventListener("click", () => loadSong(actualIndex, true));
      searchCardsGrid.appendChild(card);

      const tr = document.createElement("tr");
      tr.classList.add("track-row");
      tr.innerHTML = `
        <td class="col-num">${idx + 1}</td>
        <td class="col-title">
          <img src="${song.cover || 'https://via.placeholder.com/42'}" alt="${song.title}" />
          <div class="title-details">
            <span class="song-title">${song.title}</span>
            <span class="song-artist">${song.artist}</span>
          </div>
        </td>
        <td class="col-album">${song.album || 'Single'}</td>
        <td class="col-duration">${song.duration || '--:--'}</td>
      `;
      tr.addEventListener("click", () => loadSong(actualIndex, true));
      searchSongsBody.appendChild(tr);
    });
  }
}

// ==========================================================================
// 7. PAINEL DO CRIADOR (CADASTRAR, EDITAR E EXCLUIR NO FIREBASE)
// ==========================================================================
function renderCreatorSongsList() {
  creatorSongsBody.innerHTML = "";
  creatorSongsCount.textContent = songs.length;

  if (songs.length === 0) {
    creatorSongsBody.innerHTML = `<tr><td colspan="3" class="empty-message">Nenhuma música no Firebase. Adicione uma acima!</td></tr>`;
    return;
  }

  songs.forEach((song, index) => {
    const tr = document.createElement("tr");
    tr.classList.add("track-row");
    tr.innerHTML = `
      <td class="col-num">${index + 1}</td>
      <td class="col-title">
        <img src="${song.cover || 'https://via.placeholder.com/42'}" alt="${song.title}" />
        <div class="title-details">
          <span class="song-title">${song.title}</span>
          <span class="song-artist">${song.artist}</span>
        </div>
      </td>
      <td style="text-align: right; padding-right: 20px;">
        <button class="btn-edit-song"><i class="fa-solid fa-pen-to-square"></i> Editar</button>
        <button class="btn-delete-song"><i class="fa-solid fa-trash-can"></i> Excluir</button>
      </td>
    `;

    tr.querySelector(".btn-edit-song").addEventListener("click", (e) => {
      e.stopPropagation();
      startEditingSong(index);
    });

    tr.querySelector(".btn-delete-song").addEventListener("click", (e) => {
      e.stopPropagation();
      if (confirm(`Excluir "${song.title}" do Firebase?`)) {
        deleteSongFromFirebase(index);
      }
    });

    creatorSongsBody.appendChild(tr);
  });
}

function startEditingSong(index) {
  const song = songs[index];
  if (!song) return;

  editingIndex = index;
  songTitleInput.value = song.title || "";
  songArtistInput.value = song.artist || "";

  coverStatus.textContent = "(Opcional)";
  audioStatus.textContent = "(Opcional)";

  formTitle.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Editar Música`;
  submitSongBtn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Salvar Alterações`;
  cancelEditBtn.classList.remove("hidden");
  document.querySelector(".creator-form-card").scrollIntoView({ behavior: "smooth" });
}

function resetForm() {
  editingIndex = null;
  addSongForm.reset();
  coverStatus.textContent = "*";
  audioStatus.textContent = "*";
  formTitle.innerHTML = `<i class="fa-solid fa-plus-circle"></i> Adicionar Nova Música`;
  submitSongBtn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> Publicar Música`;
  cancelEditBtn.classList.add("hidden");
}

cancelEditBtn.addEventListener("click", resetForm);

addSongForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = songTitleInput.value.trim();
  const artist = songArtistInput.value.trim();
  const coverFile = coverFileInput.files[0];
  const audioFile = audioFileInput.files[0];

  if (editingIndex === null && (!coverFile || !audioFile)) {
    alert("Selecione os ficheiros de imagem e áudio.");
    return;
  }

  submitSongBtn.disabled = true;
  submitSongBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processando...`;

  try {
    let coverUrl = editingIndex !== null ? songs[editingIndex].cover : "";
    let audioUrl = editingIndex !== null ? songs[editingIndex].src : "";

    if (coverFile) coverUrl = await fileToDataURL(coverFile);
    if (audioFile) audioUrl = await fileToDataURL(audioFile);

    if (editingIndex !== null) {
      const updatedSongs = [...songs];
      updatedSongs[editingIndex] = {
        ...songs[editingIndex],
        title,
        artist,
        cover: coverUrl,
        src: audioUrl
      };
      await set(ref(database, 'songs'), updatedSongs);
    } else {
      const newSong = {
        id: songs.length > 0 ? Math.max(...songs.map(s => s.id || 0)) + 1 : 0,
        title,
        artist,
        album: "Single",
        duration: "--:--",
        cover: coverUrl,
        src: audioUrl
      };
      await set(ref(database, 'songs'), [...songs, newSong]);
    }

    resetForm();
    alert("Música salva com sucesso no Firebase!");
  } catch (err) {
    alert("Erro: " + err.message);
  } finally {
    submitSongBtn.disabled = false;
  }
});

function deleteSongFromFirebase(indexToRemove) {
  const updatedSongs = songs.filter((_, idx) => idx !== indexToRemove);
  set(ref(database, 'songs'), updatedSongs).then(() => {
    if (editingIndex === indexToRemove) resetForm();
  });
}