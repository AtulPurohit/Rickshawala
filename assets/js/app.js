    // ── Playlist: matches PLYErt37hS-BM order exactly ──
    // ytId is populated dynamically from getVideoData() when songs play
    const DEFAULT_COVER = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=80";

    // ── Session persistence (track position + username) ──
    const SESSION_KEY = 'rickshawala_session';
    function saveSession() {
      try { localStorage.setItem(SESSION_KEY, JSON.stringify({ trackIdx: currentTrackIdx })); } catch(_) {}
    }
    function loadSession() {
      try { const s = JSON.parse(localStorage.getItem(SESSION_KEY)); return s || {}; } catch(_) { return {}; }
    }

    const PLAYLIST = [
      { title: "Pehle to Kabhi Kabhi",              artist: "Altaf Raja",                                   duration: "6:19" },
      { title: "Ek Sanam Chahiye Aashiqui Ke Liye",  artist: "Kumar Sanu",                                   duration: "6:13" },
      { title: "Aye Mere Humsafar",                  artist: "Udit Narayan & Alka Yagnik",                   duration: "5:56" },
      { title: "Tu Pyar Hai Kisi Aur Ka",            artist: "Anuradha Paudwal & Kumar Sanu",                duration: "6:49" },
      { title: "Aankhen Hi Na Royee",                artist: "Altaf Raja",                                   duration: "6:01" },
      { title: "Ye Kaali Kaali Aankhen",             artist: "Kumar Sanu & Anu Malik",                       duration: "7:49" },
      { title: "Chaiyya Chaiyya",                    artist: "Sukhwinder Singh & Sapna Awasthi",             duration: "6:47" },
      { title: "Is Pyar Se Meri Taraf Na Dekho",     artist: "Kumar Sanu",                                   duration: "5:19" },
      { title: "Main Duniya Bhula Doonga",           artist: "Anuradha Paudwal & Kumar Sanu",                duration: "5:17" },
      { title: "Is Tarah Aashiqui Ka",               artist: "Kumar Sanu",                                   duration: "7:23" },
      { title: "Chalte Chalte",                      artist: "Udbhav, Manohar Shetty, Ishaan & Shweta",      duration: "7:39" },
      { title: "Jo Bhi Kasmein",                     artist: "Alka Yagnik & Udit Narayan",                   duration: "5:40" },
      { title: "Tum To Thehre Pardesi",              artist: "Altaf Raja",                                   duration: "14:35" },
      { title: "Aankhein Khuli",                     artist: "Lata Mangeshkar, Udit Narayan & Udbhav",       duration: "7:03" },
      { title: "Akeli Na Bazar Jaya Karo",           artist: "Udit Narayan & Anand Raj Anand",               duration: "5:48" },
      { title: "Aashiq Banaya Aapne",                artist: "Himesh Reshammiya & Shreya Ghoshal",           duration: "6:04" },
      { title: "Aap Ki Kashish",                     artist: "Himesh Reshammiya, Krishna & Ahir",            duration: "5:34" },
      { title: "Mujhse Shaadi Karogi",               artist: "Sonu Nigam, Udit Narayan & Sunidhi Chauhan",   duration: "5:27" },
      { title: "Tere Liye (Jhankar)",                artist: "Atif Aslam & Shreya Ghoshal",                  duration: "4:35" },
      { title: "Too Cheez Badi Hain",                artist: "Udit Narayan & Kavita Krishnamurthy",          duration: "6:26" },
      { title: "Dulhe Ka Sehra (Male Version)",      artist: "Nusrat Fateh Ali Khan",                        duration: "8:33" },
      { title: "Barsaat Ke Mausam Mein",             artist: "Kumar Sanu & Roop Kumar Rathod",               duration: "8:45" },
      { title: "Dil Mera Tod Diya",                  artist: "Alka Yagnik",                                  duration: "5:08" },
      { title: "Teri Yaad... Yaad... Yaad",          artist: "Ghulam Ali",                                   duration: "8:09" }
    ];

    // ── State ──
    let currentTrackIdx = 0;
    let isPlaying = false;
    let isMuted = false;
    let isShuffled = false;
    let timerInterval = null;
    let ytPlayer = null;
    let ytReady = false;
    let isPlaylistOpen = false;

    // ── DOM refs ──
    const playIcon       = document.getElementById('playIcon');
    const pauseIcon      = document.getElementById('pauseIcon');
    const vinylDisc      = document.getElementById('vinylDisc');
    const discImg        = document.getElementById('discImg');
    const trackTitle     = document.getElementById('trackTitle');
    const trackArtist    = document.getElementById('trackArtist');
    const currentTimeEl  = document.getElementById('currentTime');
    const durationTimeEl = document.getElementById('durationTime');
    const progressFill   = document.getElementById('progressFill');
    const progressHandle = document.getElementById('progressHandle');
    const volOnIcon      = document.getElementById('volOnIcon');
    const volOffIcon     = document.getElementById('volOffIcon');
    const playlistPopover = document.getElementById('playlistPopover');
    const playlistItems  = document.getElementById('playlistItems');

    // ── YouTube IFrame API callback ──
    function onYouTubeIframeAPIReady() {
      ytPlayer = new YT.Player('ytPlayer', {
        width: '100%', height: '100%',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          listType: 'playlist',
          list: 'PLYErt37hS-BM'
        },
        events: {
          onReady() {
            ytReady = true;
            try {
              // Restore session: resume from last played track
              const session = loadSession();
              const resumeIdx = (session.trackIdx && session.trackIdx > 0) ? session.trackIdx : 0;
              ytPlayer.cuePlaylist({
                listType: 'playlist',
                list: 'PLYErt37hS-BM',
                index: resumeIdx
              });
            } catch(_) {}
            loadTrack(loadSession().trackIdx || 0);

            // Poll & sync live playlist items directly from YouTube API
            let tries = 0;
            const pollIds = setInterval(() => {
              tries++;
              try {
                const ids = ytPlayer.getPlaylist();
                if (ids && ids.length > 0) {
                  clearInterval(pollIds);
                  syncLiveYouTubePlaylist();
                }
              } catch(_) {}
              if (tries > 25) clearInterval(pollIds);
            }, 100);
          },
          onStateChange(e) {
            if (e.data === YT.PlayerState.PLAYING) {
              isPlaying = true;
              setPlayPauseUI(true);
              startScrubberTick();

              // Auto-hire & start meter when song starts playing
              if (!isMeterHired && typeof setMeterHiredState === 'function') {
                setMeterHiredState(true, false);
              }

              // Sync metadata & thumbnail dynamically from YouTube
              try {
                const data = ytPlayer.getVideoData();
                if (data && data.video_id) {
                  const pIdx = ytPlayer.getPlaylistIndex();
                  if (pIdx !== undefined && pIdx >= 0) {
                    currentTrackIdx = pIdx;
                    if (pIdx >= PLAYLIST.length) {
                      // Dynamically create entry if track index exceeds initial array
                      PLAYLIST[pIdx] = { title: data.title || `Track ${pIdx + 1}`, artist: data.author || "90s Special", duration: "5:00", ytId: data.video_id };
                    } else {
                      PLAYLIST[pIdx].ytId = data.video_id;
                      if (data.title && (!PLAYLIST[pIdx].title || PLAYLIST[pIdx].title.startsWith("Track"))) {
                        PLAYLIST[pIdx].title = data.title;
                      }
                    }
                    trackTitle.textContent = PLAYLIST[pIdx].title;
                    trackArtist.textContent = PLAYLIST[pIdx].artist;
                    discImg.src = `https://i.ytimg.com/vi/${data.video_id}/hqdefault.jpg`;
                    renderPlaylist();
                  }
                }
              } catch(_) {}
            } else if (e.data === YT.PlayerState.PAUSED) {
              isPlaying = false;
              setPlayPauseUI(false);
              // Auto-set meter to vacant when song is paused
              if (isMeterHired && typeof setMeterHiredState === 'function') {
                setMeterHiredState(false, false);
              }
            } else if (e.data === YT.PlayerState.ENDED) {
              advanceTrack();
            }
          }
        }
      });
    }

    // ── Dynamic YouTube Playlist Sync ──
    async function syncLiveYouTubePlaylist() {
      if (!ytPlayer || !ytPlayer.getPlaylist) return;
      try {
        const ids = ytPlayer.getPlaylist();
        if (!ids || ids.length === 0) return;

        for (let i = 0; i < ids.length; i++) {
          const vid = ids[i];
          if (i < PLAYLIST.length) {
            PLAYLIST[i].ytId = vid;
          } else {
            // New track detected in live YouTube playlist! Fetch metadata via oEmbed
            try {
              const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${vid}`);
              const json = await res.json();
              const fullTitle = json.title || `Track ${i + 1}`;
              let title = fullTitle;
              let artist = "90s Special";
              if (fullTitle.includes("-")) {
                const parts = fullTitle.split("-");
                artist = parts[0].trim();
                title = parts.slice(1).join("-").trim();
              }
              PLAYLIST[i] = {
                title: title,
                artist: artist,
                duration: "5:00",
                ytId: vid
              };
            } catch (_) {
              PLAYLIST[i] = {
                title: `Track ${i + 1}`,
                artist: "90s Special",
                duration: "5:00",
                ytId: vid
              };
            }
          }
        }
        renderPlaylist();
        if (PLAYLIST[currentTrackIdx] && PLAYLIST[currentTrackIdx].ytId) {
          discImg.src = `https://i.ytimg.com/vi/${PLAYLIST[currentTrackIdx].ytId}/hqdefault.jpg`;
        }
      } catch (_) {}
    }

    // ── UI helpers ──
    function setPlayPauseUI(playing) {
      playIcon.style.display  = playing ? 'none'  : 'block';
      pauseIcon.style.display = playing ? 'block' : 'none';
      if (playing) vinylDisc.classList.add('playing');
      else         vinylDisc.classList.remove('playing');
    }

    function formatTime(secs) {
      secs = Math.floor(secs || 0);
      const m = Math.floor(secs / 60), s = secs % 60;
      return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }

    function startScrubberTick() {
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = setInterval(updateScrubber, 400);
    }

    // ── Track loading ──
    function loadTrack(idx) {
      currentTrackIdx = idx;
      const track = PLAYLIST[idx];
      trackTitle.textContent     = track.title;
      trackArtist.textContent    = track.artist;
      durationTimeEl.textContent = track.duration;
      currentTimeEl.textContent  = '00:00';
      progressFill.style.width   = '0%';
      progressHandle.style.left  = '0%';

      discImg.style.display = 'block';
      discImg.src = track.ytId ? `https://i.ytimg.com/vi/${track.ytId}/hqdefault.jpg` : DEFAULT_COVER;
      discImg.onerror = function() { this.src = DEFAULT_COVER; };

      renderPlaylist();
    }

    // ── Playback controls ──
    function playTrack() {
      if (!ytReady) return;
      ytPlayer.playVideo();
    }

    function pauseTrack() {
      if (!ytReady) return;
      ytPlayer.pauseVideo();
      if (timerInterval) clearInterval(timerInterval);
    }

    function togglePlay() {
      if (isPlaying) pauseTrack(); else playTrack();
    }

    function selectTrackFromList(idx) {
      currentTrackIdx = idx;
      const track = PLAYLIST[idx];
      trackTitle.textContent     = track.title;
      trackArtist.textContent    = track.artist;
      durationTimeEl.textContent = track.duration;
      discImg.src = track.ytId ? `https://i.ytimg.com/vi/${track.ytId}/hqdefault.jpg` : DEFAULT_COVER;
      discImg.onerror = function() { this.src = DEFAULT_COVER; };

      if (ytReady && ytPlayer.playVideoAt) {
        ytPlayer.playVideoAt(idx);
      }
      saveSession(); // persist current track for next visit
      renderPlaylist();
      if (isPlaylistOpen) togglePlaylist();
    }

    function advanceTrack() {
      if (isRepeat) { selectTrackFromList(currentTrackIdx); return; }
      let next;
      if (isShuffled) {
        do { next = Math.floor(Math.random() * PLAYLIST.length); }
        while (next === currentTrackIdx && PLAYLIST.length > 1);
      } else {
        next = (currentTrackIdx + 1) % PLAYLIST.length;
      }
      selectTrackFromList(next);
    }

    function prevTrack() {
      const prev = (currentTrackIdx - 1 + PLAYLIST.length) % PLAYLIST.length;
      selectTrackFromList(prev);
    }

    function nextTrack() { advanceTrack(); }

    function toggleShuffle() {
      isShuffled = !isShuffled;
      const btn = document.getElementById('shuffleBtn');
      btn.style.color   = isShuffled ? 'var(--yellow)' : '';
      btn.style.opacity = isShuffled ? '1' : '0.75';
    }

    let isRepeat = false;
    function toggleRepeat() {
      isRepeat = !isRepeat;
      const btn = document.getElementById('repeatBtn');
      btn.style.color   = isRepeat ? 'var(--yellow)' : '';
      btn.style.opacity = isRepeat ? '1' : '0.75';
      if (ytReady) try { ytPlayer.setLoop(isRepeat); } catch(_) {}
    }

    // ── Mute ──
    function toggleMute() {
      isMuted = !isMuted;
      if (ytReady) isMuted ? ytPlayer.mute() : ytPlayer.unMute();
      volOnIcon.style.display  = isMuted ? 'none'  : 'block';
      volOffIcon.style.display = isMuted ? 'block' : 'none';
    }

    // ── Scrubber Engine ──
    let isDraggingScrubber = false;

    function updateScrubber() {
      if (!ytReady || !isPlaying || isDraggingScrubber) return;
      try {
        const cur = ytPlayer.getCurrentTime() || 0;
        const dur = ytPlayer.getDuration() || 1;
        const pct = Math.min(100, Math.max(0, (cur / dur) * 100));
        progressFill.style.width  = pct + '%';
        progressHandle.style.left = pct + '%';
        progressHandle.classList.remove('face-left');
        currentTimeEl.textContent = formatTime(cur);
        if (dur > 0) durationTimeEl.textContent = formatTime(dur);
      } catch(_) {}
    }

    // Ultra-Smooth 60FPS Draggable Scrubber with Real-Time Direction Flipping
    (() => {
      const bar = document.getElementById('progressBarTrack');
      if (!bar) return;
      let dragPct = 0;
      let lastDragPct = 0;

      function getPctFromEvent(e) {
        const rect = bar.getBoundingClientRect();
        const clientX = (e.touches && e.touches.length > 0) ? e.touches[0].clientX : (e.clientX !== undefined ? e.clientX : rect.left);
        return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      }

      function updateUIForPct(pct) {
        // Real-time direction flip logic
        const diff = pct - lastDragPct;
        if (diff < -0.0005) {
          progressHandle.classList.add('face-left'); // Dragging backward -> face left
        } else if (diff > 0.0005) {
          progressHandle.classList.remove('face-left'); // Dragging forward -> face right
        }
        lastDragPct = pct;
        dragPct = pct;

        const pctString = (pct * 100).toFixed(2) + '%';
        progressFill.style.width = pctString;
        progressHandle.style.left = pctString;
        if (ytReady && ytPlayer.getDuration) {
          const dur = ytPlayer.getDuration() || 0;
          if (dur > 0) currentTimeEl.textContent = formatTime(pct * dur);
        }
      }

      function onDragStart(e) {
        isDraggingScrubber = true;
        bar.classList.add('is-dragging');
        progressHandle.classList.add('is-dragging');
        const initialPct = getPctFromEvent(e);
        lastDragPct = initialPct;
        updateUIForPct(initialPct);
      }

      function onDragMove(e) {
        if (!isDraggingScrubber) return;
        requestAnimationFrame(() => {
          if (isDraggingScrubber) updateUIForPct(getPctFromEvent(e));
        });
      }

      function onDragEnd() {
        if (!isDraggingScrubber) return;
        isDraggingScrubber = false;
        bar.classList.remove('is-dragging');
        progressHandle.classList.remove('is-dragging');
        progressHandle.classList.remove('face-left'); // Reset to face right after drag ends

        // Execute YouTube seek ONCE when user releases handle
        if (ytReady && ytPlayer.getDuration) {
          const dur = ytPlayer.getDuration() || 0;
          try {
            ytPlayer.seekTo(dragPct * dur, true);
          } catch (_) {}
        }
      }

      // Universal Pointer & Touch & Mouse event bindings
      bar.addEventListener('pointerdown', e => {
        try { bar.setPointerCapture(e.pointerId); } catch (_) {}
        onDragStart(e);
      });
      bar.addEventListener('pointermove', onDragMove);
      bar.addEventListener('pointerup', onDragEnd);
      bar.addEventListener('pointercancel', onDragEnd);

      bar.addEventListener('touchstart', e => { onDragStart(e); }, { passive: true });
      window.addEventListener('touchmove', e => { if (isDraggingScrubber) onDragMove(e); }, { passive: true });
      window.addEventListener('touchend', onDragEnd);
    })();

    // ── Playlist filtering ──
    let playlistFilter = '';
    function filterPlaylist(query) {
      playlistFilter = query.toLowerCase().trim();
      renderPlaylist();
    }

    // ── Playlist drawer ──
    function renderPlaylist() {
      playlistItems.innerHTML = '';
      const filtered = playlistFilter
        ? PLAYLIST.filter(t => t.title.toLowerCase().includes(playlistFilter) || t.artist.toLowerCase().includes(playlistFilter))
        : PLAYLIST;

      if (filtered.length === 0) {
        playlistItems.innerHTML = `<div style="text-align:center;padding:1.5rem 0;color:rgba(255,255,255,0.35);font-size:0.78rem;">No songs found</div>`;
        return;
      }

      filtered.forEach((track) => {
        const i = PLAYLIST.indexOf(track);
        const item = document.createElement('div');
        item.className = `playlist-item ${i === currentTrackIdx ? 'active' : ''}`;
        item.onclick = () => selectTrackFromList(i);
        const thumbSrc = track.ytId ? `https://i.ytimg.com/vi/${track.ytId}/hqdefault.jpg` : DEFAULT_COVER;
        item.innerHTML = `
          <div class="item-sr">${i + 1}</div>
          <div class="item-thumb-wrap">
            <img src="${thumbSrc}" onerror="this.src='${DEFAULT_COVER}'" alt="thumb">
          </div>
          <div class="item-info">
            <span class="item-title">${track.title}</span>
            <span class="item-artist">${track.artist}</span>
          </div>
          <span class="item-dur">${track.duration}</span>
        `;
        playlistItems.appendChild(item);
      });
    }

    function togglePlaylist() {
      isPlaylistOpen = !isPlaylistOpen;
      const backdrop = document.getElementById('playlistBackdrop');
      if (isPlaylistOpen) {
        renderPlaylist();
        playlistPopover.classList.add('open');
        if (backdrop) backdrop.style.display = 'block';
        // Focus search input
        setTimeout(() => { const s = document.getElementById('playlistSearchInput'); if (s) s.focus(); }, 50);
      } else {
        playlistPopover.classList.remove('open');
        if (backdrop) backdrop.style.display = 'none';
        // Clear search on close
        playlistFilter = '';
        const s = document.getElementById('playlistSearchInput');
        if (s) s.value = '';
      }
    }

    // ── Horn sound (Web Audio, no change) ──
    let audioCtx = null;
    function triggerHorn() {
      const btn = document.getElementById('hornBtn');
      btn.classList.add('honking');
      setTimeout(() => btn.classList.remove('honking'), 450);
      try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const now = audioCtx.currentTime;
        const o1 = audioCtx.createOscillator(), o2 = audioCtx.createOscillator();
        const g  = audioCtx.createGain();
        o1.type = 'sawtooth'; o2.type = 'square';
        o1.frequency.setValueAtTime(370, now); o1.frequency.exponentialRampToValueAtTime(385, now + 0.35);
        o2.frequency.setValueAtTime(445, now); o2.frequency.exponentialRampToValueAtTime(455, now + 0.35);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.35, now + 0.03);
        g.gain.setValueAtTime(0.35, now + 0.28);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
        o1.connect(g); o2.connect(g); g.connect(audioCtx.destination);
        o1.start(now); o2.start(now); o1.stop(now + 0.4); o2.stop(now + 0.4);
      } catch(e) {}
    }

    // ── Init UI (YT player calls loadTrack(0) via onReady) ──
    if (trackTitle) trackTitle.textContent  = PLAYLIST[0].title;
    if (trackArtist) trackArtist.textContent = PLAYLIST[0].artist;
    if (durationTimeEl) durationTimeEl.textContent = PLAYLIST[0].duration;
    if (discImg) discImg.src = `https://i.ytimg.com/vi/${PLAYLIST[0].ytId}/hqdefault.jpg`;

    // ── Fullscreen Toggle Engine ──
    function toggleFullscreen() {
      if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
        const docEl = document.documentElement;
        if (docEl.requestFullscreen) docEl.requestFullscreen();
        else if (docEl.webkitRequestFullscreen) docEl.webkitRequestFullscreen();
        else if (docEl.msRequestFullscreen) docEl.msRequestFullscreen();
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        else if (document.msExitFullscreen) document.msExitFullscreen();
      }
    }

    function updateFullscreenIcon() {
      const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
      const exp = document.getElementById('fullscreenExpandIcon');
      const comp = document.getElementById('fullscreenCompressIcon');
      if (exp && comp) {
        exp.style.display = isFS ? 'none' : 'block';
        comp.style.display = isFS ? 'block' : 'none';
      }
    }

    document.addEventListener('fullscreenchange', updateFullscreenIcon);
    document.addEventListener('webkitfullscreenchange', updateFullscreenIcon);

    // ── Real-time clock (user's local timezone) ──
    const liveClockEl = document.getElementById('liveClock');
    function tickClock() {
      if (liveClockEl) {
        liveClockEl.textContent = new Date().toLocaleTimeString([], {
          hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
        });
      }
    }
    tickClock();
    setInterval(tickClock, 1000);

    // ── Real-time visitor count via Firebase RTDB presence ──
    function setCount(n) {
      const userCountEl = document.getElementById('userCount');
      const chatUserCountEl = document.getElementById('chatUserCount');
      if (userCountEl) userCountEl.textContent = n;
      if (chatUserCountEl) chatUserCountEl.textContent = n;
    }
    (function loadFirebasePresence() {
      function loadScript(url, cb) {
        const s = document.createElement('script'); s.src = url; s.onload = cb;
        document.head.appendChild(s);
      }
      loadScript('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js', () => {
        loadScript('https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js', () => {
          const firebaseConfig = {
            apiKey: "AIzaSyBoGaTrAZUovsvLgO0UJcQoEGANZQheUY",
            authDomain: "rickshawala-6ec32.firebaseapp.com",
            databaseURL: "https://rickshawala-6ec32-default-rtdb.firebaseio.com",
            projectId: "rickshawala-6ec32",
            storageBucket: "rickshawala-6ec32.firebasestorage.app",
            messagingSenderId: "518402469308",
            appId: "1:518402469308:web:187b4bc2e90b70688d0fb9"
          };
          try {
            if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
            const db = firebase.database();
            const myRef = db.ref('presence').push();
            db.ref('.info/connected').on('value', snap => {
              if (!snap.val()) return;
              myRef.set(true); myRef.onDisconnect().remove();
            });
            db.ref('presence').on('value', snap => {
              setCount(601 + snap.numChildren());
            });

            // Initialize Live Realtime Chat via Firebase RTDB
            initFirebaseChat(db);
          } catch(e) {
            let n = 628;
            setInterval(() => {
              n = Math.max(615, Math.min(650, n + Math.floor(Math.random() * 5) - 2));
              setCount(n);
            }, 4000);
          }
        });
      });
    })();

    // ── Live Chat Engine (Firebase RTDB + 24-Hour Expiry TTL) ──
    let chatUserName = localStorage.getItem('rickshawala_username') || '';
    let isChatOpen = false;
    let chatsRef = null;
    const renderedMsgKeys = new Set();

    const initialFallbackMessages = [
      { user: 'Rohan (Mumbai)', text: 'Altaf Raja ka song sunke purane din yaad aagaye yaar! 🚕', timeStr: '4:21 PM', timestamp: Date.now() - 3600000 },
      { user: 'Priya (Delhi)', text: 'Monsoon rain + 90s Bollywood bangers is top tier vibe 🌧️✨', timeStr: '4:23 PM', timestamp: Date.now() - 2400000 },
      { user: 'Mitul (Lucknow)', text: 'Bhai volume thoda badao, chai ke saath maza aagaya 🔥', timeStr: '4:25 PM', timestamp: Date.now() - 1200000 },
      { user: 'Simran (Jaipur)', text: 'Rickshawala Radio hits different at night! 🛺', timeStr: '4:28 PM', timestamp: Date.now() - 300000 }
    ];

    function initFirebaseChat(db) {
      try {
        chatsRef = db.ref('chats');
        const now = Date.now();
        const cutoff24h = now - (24 * 60 * 60 * 1000);

        // Clean up messages older than 24 hours
        chatsRef.orderByChild('timestamp').endAt(cutoff24h).once('value', snap => {
          snap.forEach(child => { child.ref.remove(); });
        });

        // 24h message count for the chat badge
        chatsRef.orderByChild('timestamp').startAt(cutoff24h).on('value', snap => {
          const count = snap.numChildren();
          const badge = document.getElementById('chatMsgBadge');
          if (badge) {
            if (count > 0 && !isChatOpen) {
              badge.textContent = count > 99 ? '99+' : count;
              badge.classList.add('visible');
            } else {
              badge.classList.remove('visible');
            }
          }
        });

        // Listen for new messages within last 24h
        chatsRef.orderByChild('timestamp').startAt(cutoff24h).on('child_added', snapshot => {
          const msg = snapshot.val();
          if (msg && msg.timestamp >= cutoff24h) {
            renderChatMessage(msg, snapshot.key);
          }
        });
      } catch (_) {}
    }

    // ── 7-Color Vibrancy Palette for Live Chat Users ──
    const CHAT_COLOR_PALETTE = [
      { text: '#f5c518', bg: 'rgba(245, 197, 24, 0.12)', border: '#f5c518' },   // Golden Amber
      { text: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)', border: '#38bdf8' },   // Sky Cyan
      { text: '#4ade80', bg: 'rgba(74, 222, 128, 0.12)', border: '#4ade80' },   // Neon Green
      { text: '#f472b6', bg: 'rgba(244, 114, 182, 0.12)', border: '#f472b6' },   // Hot Pink
      { text: '#c084fc', bg: 'rgba(192, 132, 252, 0.12)', border: '#c084fc' },   // Electric Violet
      { text: '#fb923c', bg: 'rgba(251, 146, 60, 0.12)', border: '#fb923c' },   // Sunset Coral
      { text: '#2dd4bf', bg: 'rgba(45, 212, 191, 0.12)', border: '#2dd4bf' }    // Mint Teal
    ];

    function getUserColor(name) {
      let hash = 0;
      const str = (name || '').trim().toLowerCase();
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      return CHAT_COLOR_PALETTE[Math.abs(hash) % CHAT_COLOR_PALETTE.length];
    }

    function scrollToChatBottom() {
      const box = document.getElementById('chatMessages');
      if (!box) return;
      box.scrollTop = box.scrollHeight;
      setTimeout(() => {
        box.scrollTop = box.scrollHeight;
      }, 50);
    }

    function renderChatMessage(msg, key) {
      if (key && renderedMsgKeys.has(key)) return;
      if (key) renderedMsgKeys.add(key);

      const box = document.getElementById('chatMessages');
      if (!box) return;

      const isSelf = msg.user === chatUserName;
      const col = getUserColor(msg.user);
      const div = document.createElement('div');
      div.className = `chat-msg ${isSelf ? 'self' : 'other'}`;
      div.style.backgroundColor = col.bg;
      if (isSelf) {
        div.style.borderRight = `3px solid ${col.border}`;
      } else {
        div.style.borderLeft = `3px solid ${col.border}`;
      }

      const timeDisplay = msg.timeStr || (msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');
      
      div.innerHTML = `
        <div class="chat-msg-meta">
          <span class="chat-msg-user" style="color:${col.text}">${escapeHtml(msg.user)}${isSelf ? ' (You)' : ''}</span>
          <span>${timeDisplay}</span>
        </div>
        <div class="chat-msg-text">${escapeHtml(msg.text)}</div>
      `;
      box.appendChild(div);

      // Smooth auto-scroll to bottom so old messages move UP automatically
      scrollToChatBottom();
    }

    function escapeHtml(str) {
      return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function renderInitialChat() {
      const box = document.getElementById('chatMessages');
      if (!box || box.children.length > 0) return;
      initialFallbackMessages.forEach(msg => renderChatMessage(msg));
    }

    function onChatBtnClick() {
      if (!chatUserName) {
        document.getElementById('nameModalOverlay').style.display = 'flex';
      } else {
        toggleChat();
      }
    }

    function saveNameAndJoin() {
      const input = document.getElementById('userNameInput');
      const val = (input.value || '').trim();
      if (!val) return;
      chatUserName = val;
      localStorage.setItem('rickshawala_username', chatUserName);
      document.getElementById('nameModalOverlay').style.display = 'none';
      toggleChat();
    }

    function toggleChat() {
      isChatOpen = !isChatOpen;
      const drawer = document.getElementById('chatDrawer');
      const btn = document.getElementById('chatBtn');
      if (isChatOpen) {
        if (!chatsRef) renderInitialChat();
        drawer.classList.add('open');
        btn.style.color = 'var(--yellow)';
        // Hide the float badge when chat is open
        const badge = document.getElementById('chatMsgBadge');
        if (badge) badge.classList.remove('visible');
        setTimeout(scrollToChatBottom, 100);
        if (window.innerWidth <= 768) {
          document.body.style.overflow = 'hidden';
          document.body.style.touchAction = 'none';
        }
      } else {
        drawer.classList.remove('open');
        btn.style.color = '';
        if (window.innerWidth <= 768) {
          document.body.style.overflow = '';
          document.body.style.touchAction = '';
        }
      }
    }

    function sendChatMessage() {
      const input = document.getElementById('chatInput');
      const txt = (input.value || '').trim();
      if (!txt) return;

      const now = Date.now();
      const msgData = {
        user: chatUserName || 'Nostalgic Listener',
        text: txt,
        timestamp: now,
        timeStr: new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      if (chatsRef) {
        chatsRef.push(msgData);
      } else {
        renderChatMessage(msgData);
      }
      input.value = '';
    }

    // Keep window fixed at (0,0) when tapping text inputs on mobile iOS/Android
    document.addEventListener('focusin', (e) => {
      if (e.target && (e.target.id === 'chatInput' || e.target.id === 'userNameInput')) {
        window.scrollTo(0, 0);
        setTimeout(() => {
          window.scrollTo(0, 0);
          const box = document.getElementById('chatMessages');
          if (box) box.scrollTop = box.scrollHeight;
        }, 80);
      }
    });

    // Direct Instagram App Deep Link with Web Fallback
    function openInstagram(e) {
      e.preventDefault();
      const handle = 'atulpurohit';
      const webUrl = `https://instagram.com/${handle}`;
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (isMobile) {
        // App scheme launcher
        const appUrl = /Android/i.test(navigator.userAgent)
          ? `intent://instagram.com/_u/${handle}/#Intent;package=com.instagram.android;scheme=https;end`
          : `instagram://user?username=${handle}`;

        const start = Date.now();
        window.location.href = appUrl;

        setTimeout(() => {
          if (Date.now() - start < 1200) {
            window.open(webUrl, '_blank');
          }
        }, 500);
      } else {
        window.open(webUrl, '_blank');
      }
    }

    // ── Auto-Rickshaw Fare Meter Engine ──
    const METER_STORAGE_KEY = 'rickshawala_meter_session';
    let isMeterHired = false;
    let meterSeconds = 0;
    let meterDistance = 0.00;
    let meterFare = 0.00; // Default 00.00 when vacant
    let meterInterval = null;

    function saveMeterSession() {
      try {
        localStorage.setItem(METER_STORAGE_KEY, JSON.stringify({
          isHired: isMeterHired,
          seconds: meterSeconds,
          distance: meterDistance,
          fare: meterFare
        }));
      } catch(_) {}
    }

    function loadMeterSession() {
      try {
        const data = JSON.parse(localStorage.getItem(METER_STORAGE_KEY));
        if (data) {
          isMeterHired = !!data.isHired;
          meterSeconds = data.seconds || 0;
          meterDistance = data.distance || 0.00;
          meterFare = data.fare || 0.00;
        }
      } catch(_) {}
    }

    function playMeterSound() {
      try {
        const audio = new Audio('/assets/bell.wav');
        audio.volume = 0.85;
        audio.play().catch(() => {});
      } catch(_) {}
    }

    function formatMeterTime(totalSecs) {
      const mins = Math.floor(totalSecs / 60);
      const secs = totalSecs % 60;
      return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    function updateMeterUI() {
      const leverArm = document.getElementById('meterLeverArm');
      const statusBar = document.getElementById('meterStatusBar');
      const statusText = document.getElementById('meterStatusText');
      const fareVal = document.getElementById('meterFareVal');
      const distVal = document.getElementById('meterDistVal');
      const timeVal = document.getElementById('meterTimeVal');
      const flagEn = document.getElementById('meterFlagEn');
      const meterLcd = document.getElementById('meterLcd');

      if (!statusBar || !fareVal) return;

      if (isMeterHired) {
        fareVal.textContent = `₹${meterFare.toFixed(2)}`;
        if (leverArm) leverArm.classList.add('down');
        if (meterLcd) meterLcd.classList.add('hired');
        statusBar.className = 'meter-status-bar hired';
        statusText.textContent = 'HIRED / चालू';
        if (flagEn) flagEn.textContent = 'HIRED';
      } else {
        fareVal.textContent = '₹00.00';
        if (leverArm) leverArm.classList.remove('down');
        if (meterLcd) meterLcd.classList.remove('hired');
        statusBar.className = 'meter-status-bar vacant';
        statusText.textContent = 'FOR HIRE / खाली';
        if (flagEn) flagEn.textContent = 'METER DOWN';
      }

      if (distVal) distVal.textContent = meterDistance.toFixed(2);
      if (timeVal) timeVal.textContent = formatMeterTime(meterSeconds);
    }

    function setMeterHiredState(hired, syncMusic = true) {
      if (isMeterHired === hired) return;
      isMeterHired = hired;
      playMeterSound();

      if (isMeterHired) {
        if (meterFare < 23.00) meterFare = 23.00; // Min fare ₹23.00 upon hiring!
        startMeterTicker();
        if (syncMusic && !isPlaying) {
          togglePlay(); // Start playing song!
        }
      } else {
        stopMeterTicker();
        meterFare = 0.00; // Reset to 00.00 when vacant
        meterSeconds = 0;
        meterDistance = 0.00;
        if (syncMusic && isPlaying) {
          pauseTrack(); // Pause song!
        }
      }

      updateMeterUI();
      saveMeterSession();
    }

    function toggleMeter() {
      setMeterHiredState(!isMeterHired, true);
    }

    function startMeterTicker() {
      if (meterInterval) clearInterval(meterInterval);
      meterInterval = setInterval(() => {
        if (!isMeterHired) return;
        meterSeconds++;
        meterDistance += 0.004; // ~0.24 km per min
        meterFare += 0.08;      // Increases smoothly as ride/music progresses
        updateMeterUI();
        saveMeterSession();
      }, 1000);
    }

    function stopMeterTicker() {
      if (meterInterval) {
        clearInterval(meterInterval);
        meterInterval = null;
      }
    }

    // Init Meter on page load
    (function initMeter() {
      loadMeterSession();
      updateMeterUI();
      if (isMeterHired) {
        startMeterTicker();
      }
    })();
