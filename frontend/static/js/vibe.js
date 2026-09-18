/**
 * EVOLV Vibe — Real Embedded Music Platforms & Bluetooth Earbuds
 * - Real embedded players for Spotify, YouTube Music, JioSaavn, Gaana, Apple Music, Amazon Music
 * - Each platform opens inside a small, fixed-size "cabin" docked inside the app
 * - Curated workout playlists per platform with genre switching
 * - Real Web Bluetooth Battery Service API for connected earbuds — no simulated/random battery values
 */
const Vibe = {
    selectedPlatform: 'spotify',
    // No genre is auto-selected — the user must actively choose a vibe or
    // search for a song. Nothing plays by default.
    selectedGenre: null,
    searchQuery: '',
    embedVisible: true,

    // Bluetooth Earbuds State (real devices only — no simulated/demo battery)
    earbuds: {
        name: 'Not Connected',
        battery: null,          // Real battery % from BLE Battery Service (null = not read)
        connected: false,
        device: null,
        characteristic: null,
    },

    // Platform definitions with curated workout playlists per genre
    platforms: [
        {
            id: 'spotify',
            name: 'Spotify',
            icon: 'fab fa-spotify',
            color: '#1DB954',
            playlists: {
                beast:  { name: 'Beast Mode',       embedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX76Wlfdnj7AP?utm_source=generator&theme=0' },
                cardio: { name: 'Cardio Workout',   embedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DWSJHnPb1f0X3?utm_source=generator&theme=0' },
                telugu: { name: 'Telugu Energy',     embedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX4H5837Y8I1n?utm_source=generator&theme=0' },
                hype:   { name: 'Gym Motivation',   embedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX4eRPd9frC1m?utm_source=generator&theme=0' },
            },
            embedHeight: 380,
        },
        {
            id: 'youtube',
            name: 'YouTube Music',
            icon: 'fab fa-youtube',
            color: '#FF0000',
            playlists: {
                beast:  { name: 'Gym Beast Mode',     embedUrl: 'https://www.youtube.com/embed/videoseries?list=PLgzTt0k8mXzEk586ze4BjvDXR7c-TUSnx&autoplay=0' },
                cardio: { name: 'Cardio Running',     embedUrl: 'https://www.youtube.com/embed/videoseries?list=PLChOO_ZAB22WuyDODJ3kjJiU0oQzWOTyb&autoplay=0' },
                telugu: { name: 'Telugu Mass Hits',    embedUrl: 'https://www.youtube.com/embed/videoseries?list=PLiMx-gRFL9S1qx1tZkzxGqxVL_Pwe0JF1&autoplay=0' },
                hype:   { name: 'Workout Hype',       embedUrl: 'https://www.youtube.com/embed/videoseries?list=PLRqwX-V8eTGQ4hLIjhyFFYfPdg7-7eFCN&autoplay=0' },
            },
            embedHeight: 380,
        },
        {
            id: 'jiosaavn',
            name: 'JioSaavn',
            icon: 'fas fa-music',
            color: '#2196F3',
            playlists: {
                beast:  { name: 'Workout Beats',     embedUrl: 'https://www.jiosaavn.com/featured/workout-motivation/Nq1bFgRpC4c_' },
                cardio: { name: 'Running Mix',       embedUrl: 'https://www.jiosaavn.com/featured/running-playlist/aYoMRQZpmLFuOxiEGmm6lQ__' },
                telugu: { name: 'Telugu Mass',        embedUrl: 'https://www.jiosaavn.com/featured/telugu-mass-hits/XqeSi1JF1Xc_' },
                hype:   { name: 'Gym Hits',          embedUrl: 'https://www.jiosaavn.com/featured/gym-hits/Mu9V-XOZbNNieSJqt9HmOQ__' },
            },
            embedHeight: 500,
        },
        {
            id: 'gaana',
            name: 'Gaana',
            icon: 'fas fa-headphones',
            color: '#E72C30',
            playlists: {
                beast:  { name: 'Beast Mode',       embedUrl: 'https://gaana.com/playlist/gaana-dj-workout-gujarati-1' },
                cardio: { name: 'Cardio Beats',     embedUrl: 'https://gaana.com/playlist/gaana-dj-gym-workout' },
                telugu: { name: 'Telugu Workout',    embedUrl: 'https://gaana.com/playlist/gaana-dj-telugu-mass-hits' },
                hype:   { name: 'Gym Hype',         embedUrl: 'https://gaana.com/playlist/gaana-dj-workout-motivation' },
            },
            embedHeight: 500,
        },
        {
            id: 'apple',
            name: 'Apple Music',
            icon: 'fab fa-apple',
            color: '#fc3c44',
            playlists: {
                beast:  { name: 'Pure Motivation',   embedUrl: 'https://embed.music.apple.com/in/playlist/pure-motivation/pl.3450c608032e4cca8b15032ec88d6bf1?theme=dark' },
                cardio: { name: 'Pure Running',      embedUrl: 'https://embed.music.apple.com/in/playlist/pure-running/pl.08c2a62fef45474fa78cfaf4bb55ca28?theme=dark' },
                telugu: { name: 'Telugu Hits',        embedUrl: 'https://embed.music.apple.com/in/playlist/telugu-hits/pl.d93fbb2a8a454c2db0cd30b6e893cdf0?theme=dark' },
                hype:   { name: 'Workout Hype',      embedUrl: 'https://embed.music.apple.com/in/playlist/pure-workout/pl.82683ab272e94f8f8cd4f82a2f0c4d5b?theme=dark' },
            },
            embedHeight: 450,
        },
        {
            id: 'amazon',
            name: 'Amazon Music',
            icon: 'fab fa-amazon',
            color: '#1a9cdd',
            playlists: {
                beast:  { name: 'Beast Mode',       embedUrl: 'https://music.amazon.in/playlists/B07MFDNMKK' },
                cardio: { name: 'Cardio Sprint',    embedUrl: 'https://music.amazon.in/playlists/B07CK5QH5Q' },
                telugu: { name: 'Telugu Energy',     embedUrl: 'https://music.amazon.in/playlists/B09WQ4MPCL' },
                hype:   { name: 'Gym Motivation',   embedUrl: 'https://music.amazon.in/playlists/B07MFDNMKK' },
            },
            embedHeight: 500,
        }
    ],

    genres: [
        { id: 'beast',  name: '🥊 Beast Mode',    desc: 'Heavy, aggressive, powerlifting beats' },
        { id: 'cardio', name: '🏃 Cardio & HIIT',  desc: 'High-tempo running & sprint tracks' },
        { id: 'telugu', name: '🇮🇳 Telugu Mass',    desc: 'Telugu gym energy & mass hits' },
        { id: 'hype',   name: '🔥 Gym Motivation', desc: 'Motivational hype & workout anthems' },
    ],

    /* ── Lifecycle ─────────────────────────────────────────────── */
    load() {
        this._renderAll();
    },

    _renderAll() {
        this._renderPlatformTabs();
        this._renderGenreTabs();
        this._renderEmbedPlayer();
        this._renderEarbuds();
    },

    /* ── Platform & Genre Selection ────────────────────────────── */
    selectPlatform(pId) {
        this.selectedPlatform = pId;
        this.searchQuery = ''; // switching platform exits search mode
        this._renderPlatformTabs();
        this._renderGenreTabs();
        this._renderEmbedPlayer();
        // Only load a playlist automatically if the user had already picked a vibe;
        // otherwise keep showing the "choose your vibe" placeholder.
        if (this.selectedGenre) {
            const p = this.platforms.find(pl => pl.id === pId);
            if (window.UI && p) UI.showToast(`Loading ${p.name} workout music`, 'info');
        }
    },

    selectGenre(gId) {
        this.selectedGenre = gId;
        this.searchQuery = ''; // picking a curated vibe exits search mode
        this._renderGenreTabs();
        this._renderEmbedPlayer();
    },

    /* ── Search: play any song/artist the user asks for, on demand ──── */
    search(query) {
        query = (query || '').trim();
        if (!query) {
            if (window.UI) UI.showToast('Type something to search for', 'info');
            return;
        }
        this.searchQuery = query;
        this._renderGenreTabs();
        this._renderEmbedPlayer();
        if (window.UI) UI.showToast(`Searching & playing "${query}"…`, 'info');
    },

    clearSearch() {
        this.searchQuery = '';
        const input = document.getElementById('vibe-search-input');
        if (input) input.value = '';
        this._renderGenreTabs();
        this._renderEmbedPlayer();
    },

    /* ── Bluetooth Earbuds (Real Battery Service) ──────────────── */
    async connectBluetooth() {
        // Check if Web Bluetooth is available
        if (!navigator.bluetooth) {
            if (window.UI) UI.showToast('Bluetooth is not supported in this browser. Try Chrome or Edge on desktop/Android.', 'error');
            return;
        }

        try {
            // Request device with Battery Service
            const device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: ['battery_service']
            });

            this.earbuds.device = device;
            this.earbuds.name = device.name || 'Bluetooth Device';
            this.earbuds.connected = true;

            if (window.UI) UI.showToast(`Connecting to ${this.earbuds.name}…`, 'info');
            this._renderEarbuds();

            // Connect to GATT server
            const server = await device.gatt.connect();

            try {
                // Try to access Battery Service
                const service = await server.getPrimaryService('battery_service');
                const characteristic = await service.getCharacteristic('battery_level');
                this.earbuds.characteristic = characteristic;

                // Read initial battery level
                const value = await characteristic.readValue();
                this.earbuds.battery = value.getUint8(0);
                this._renderEarbuds();

                if (window.UI) UI.showToast(`${this.earbuds.name} connected — Battery: ${this.earbuds.battery}%`, 'success');

                // Subscribe to battery level changes
                await characteristic.startNotifications();
                characteristic.addEventListener('characteristicvaluechanged', (event) => {
                    this.earbuds.battery = event.target.value.getUint8(0);
                    this._renderEarbuds();
                });

            } catch (batteryErr) {
                // Device connected but doesn't expose Battery Service
                console.warn('Battery Service not available on this device:', batteryErr);
                this.earbuds.battery = null;
                this._renderEarbuds();
                if (window.UI) UI.showToast(`${this.earbuds.name} connected — battery info not available for this device`, 'info');
            }

            // Listen for disconnection
            device.addEventListener('gattserverdisconnected', () => {
                this.earbuds.connected = false;
                this.earbuds.battery = null;
                this.earbuds.name = 'Disconnected';
                this._renderEarbuds();
                if (window.UI) UI.showToast('Earbuds disconnected', 'info');
            });

        } catch (err) {
            console.warn('Bluetooth connection failed or cancelled:', err);
            if (err.name !== 'NotFoundError') {
                if (window.UI) UI.showToast('Bluetooth connection failed. Please try again.', 'error');
            }
        }
    },

    disconnectBluetooth() {
        if (this.earbuds.device && this.earbuds.device.gatt && this.earbuds.device.gatt.connected) {
            this.earbuds.device.gatt.disconnect();
        }
        this.earbuds.connected = false;
        this.earbuds.battery = null;
        this.earbuds.name = 'Not Connected';
        this.earbuds.device = null;
        this.earbuds.characteristic = null;
        this._renderEarbuds();
        if (window.UI) UI.showToast('Earbuds disconnected', 'info');
    },

    /* ── Render Methods ────────────────────────────────────────── */
    _renderPlatformTabs() {
        const container = document.getElementById('vibe-platform-tabs');
        if (!container) return;

        container.innerHTML = this.platforms.map(p => {
            const active = this.selectedPlatform === p.id;
            return `
                <button onclick="Vibe.selectPlatform('${p.id}')"
                    class="px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${active ? 'text-dark shadow-lg scale-105' : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800'}"
                    style="${active ? `background:${p.color}; box-shadow:0 4px 20px ${p.color}40` : ''}">
                    <i class="${p.icon}" style="color:${active ? '#fff' : p.color}"></i>
                    <span>${p.name}</span>
                </button>`;
        }).join('');
    },

    _renderGenreTabs() {
        const container = document.getElementById('vibe-genre-tabs');
        if (!container) return;

        const searching = !!this.searchQuery;

        container.innerHTML = this.genres.map(g => {
            const active = !searching && this.selectedGenre === g.id;
            return `
                <button onclick="Vibe.selectGenre('${g.id}')"
                    class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${active ? 'bg-white/20 text-white border border-white/40 font-black' : 'bg-gray-900/80 border border-gray-800 text-gray-400 hover:text-white'}"
                    title="${g.desc}">
                    ${g.name}
                </button>`;
        }).join('') + (searching ? `
                <button onclick="Vibe.clearSearch()"
                    class="px-3.5 py-1.5 rounded-xl text-xs font-black transition-all bg-white/20 text-white border border-white/40 flex items-center gap-1.5">
                    <i class="fas fa-search"></i> "${this.searchQuery}"
                    <i class="fas fa-times ml-1 opacity-70"></i>
                </button>` : '');
    },

    _renderEmbedPlayer() {
        const container = document.getElementById('vibe-embed-player');
        if (!container) return;

        // ── State 1: user searched for a specific song/artist — plays for real,
        // regardless of platform tab, no gym playlist is forced on them.
        if (this.searchQuery) {
            const q = this.searchQuery;
            const embedUrl = `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(q)}&autoplay=1`;
            container.innerHTML = `
                <div class="space-y-3">
                    <div class="flex items-center justify-between gap-2">
                        <div class="flex items-center gap-2.5 min-w-0">
                            <i class="fas fa-search text-lg text-primary shrink-0"></i>
                            <div class="min-w-0">
                                <p class="text-sm font-black text-white truncate">Search results — "${q}"</p>
                                <p class="text-[10px] text-gray-400">Playing the top match now</p>
                            </div>
                        </div>
                        <button onclick="Vibe.clearSearch()" class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-all shrink-0">
                            <i class="fas fa-times mr-1"></i> Clear
                        </button>
                    </div>
                    <div class="w-full rounded-2xl overflow-hidden bg-gray-950 border border-gray-800 shadow-2xl">
                        <iframe
                            src="${embedUrl}"
                            width="100%" height="352"
                            style="display:block"
                            frameBorder="0"
                            allowfullscreen
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            loading="lazy">
                        </iframe>
                    </div>
                </div>`;
            return;
        }

        const platform = this.platforms.find(p => p.id === this.selectedPlatform);
        if (!platform) return;

        // ── State 2: nothing chosen yet — never auto-load a "gym playlist".
        // The user decides what they want to hear.
        if (!this.selectedGenre) {
            container.innerHTML = `
                <div class="w-full rounded-2xl bg-gray-950 border border-dashed border-gray-800 py-14 px-6 text-center">
                    <i class="${platform.icon} text-3xl mb-3" style="color:${platform.color}"></i>
                    <p class="text-sm font-black text-white">Nothing playing yet</p>
                    <p class="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                        Pick a workout vibe above, or search for the exact song, artist, or track you want — you're always in control of what plays.
                    </p>
                </div>`;
            return;
        }

        const playlist = platform.playlists[this.selectedGenre];
        // Full-width "cabin" — the player fills the column it's given instead of
        // being boxed into a narrow fixed width that clips its own content.
        const CABIN_HEIGHT = 352;
        const height = CABIN_HEIGHT;

        // Platform-specific embed rendering
        let embedHtml = '';

        if (platform.id === 'spotify') {
            embedHtml = `
                <iframe
                    style="border-radius:16px"
                    src="${playlist.embedUrl}"
                    width="100%" height="${height}"
                    frameBorder="0"
                    allowfullscreen=""
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy">
                </iframe>`;
        } else if (platform.id === 'youtube') {
            embedHtml = `
                <iframe
                    style="border-radius:16px"
                    src="${playlist.embedUrl}"
                    width="100%" height="${height}"
                    frameBorder="0"
                    allowfullscreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    loading="lazy">
                </iframe>`;
        } else if (platform.id === 'apple') {
            embedHtml = `
                <iframe
                    style="border-radius:16px; overflow:hidden; background:transparent"
                    src="${playlist.embedUrl}"
                    width="100%" height="${height}"
                    frameBorder="0"
                    allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
                    sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
                    loading="lazy">
                </iframe>`;
        } else {
            // JioSaavn, Gaana, Amazon Music — load website in cabin iframe
            embedHtml = `
                <iframe
                    style="border-radius:16px; border:1px solid #333"
                    src="${playlist.embedUrl}"
                    width="100%" height="${height}"
                    frameBorder="0"
                    allow="autoplay; encrypted-media"
                    sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation allow-popups-to-escape-sandbox"
                    loading="lazy">
                </iframe>
                <p class="text-[10px] text-gray-500 mt-2 text-center">
                    <i class="fas fa-info-circle mr-1"></i>
                    If the player doesn't load, some platforms may block iframe embedding. You can
                    <a href="${playlist.embedUrl}" target="_blank" rel="noopener" class="text-primary hover:underline">open directly</a>.
                </p>`;
        }

        container.innerHTML = `
            <div class="space-y-3">
                <!-- Playlist Info -->
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2.5">
                        <i class="${platform.icon} text-lg" style="color:${platform.color}"></i>
                        <div>
                            <p class="text-sm font-black text-white">${platform.name} — ${playlist.name}</p>
                            <p class="text-[10px] text-gray-400">Real music streaming inside EVOLV</p>
                        </div>
                    </div>
                    <span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border"
                          style="color:${platform.color}; border-color:${platform.color}40; background:${platform.color}15">
                        <i class="fas fa-play mr-1"></i> LIVE
                    </span>
                </div>

                <!-- Embedded Player Cabin — fills the full width of its column, no clipping -->
                <div class="w-full rounded-2xl overflow-hidden bg-gray-950 border border-gray-800 shadow-2xl">
                    ${embedHtml}
                </div>
            </div>`;
    },

    _renderEarbuds() {
        const container = document.getElementById('vibe-earbuds-container');
        if (!container) return;
        const e = this.earbuds;

        const batColor = (pct) => pct > 60 ? 'text-emerald-400' : pct > 25 ? 'text-amber-400' : 'text-red-400';
        const barBg = (pct) => pct > 60 ? '#34d399' : pct > 25 ? '#fbbf24' : '#ef4444';

        let batteryHtml = '';

        if (e.connected && e.battery !== null) {
            // Real Bluetooth battery — live value only, no simulated/random data
            batteryHtml = `
                <div class="p-5 bg-gray-950 rounded-2xl border border-gray-800 text-center">
                    <span class="text-[10px] font-bold text-gray-500 uppercase">Battery Level</span>
                    <div class="text-4xl font-black ${batColor(e.battery)} my-2">${e.battery}%</div>
                    <div class="w-full h-2 bg-gray-800 rounded-full overflow-hidden mt-2 max-w-48 mx-auto">
                        <div class="h-full rounded-full transition-all" style="width:${e.battery}%; background:${barBg(e.battery)}"></div>
                    </div>
                    <p class="text-[10px] text-emerald-400 font-bold mt-2">
                        <i class="fas fa-bluetooth-b mr-1"></i> Live reading from ${e.name}
                    </p>
                </div>`;
        } else if (e.connected && e.battery === null) {
            // Connected but no battery service
            batteryHtml = `
                <div class="p-5 bg-gray-950 rounded-2xl border border-gray-800 text-center">
                    <i class="fas fa-battery-half text-3xl text-gray-600 mb-2"></i>
                    <p class="text-xs font-bold text-gray-400">Battery info not available</p>
                    <p class="text-[10px] text-gray-500 mt-1">${e.name} doesn't expose BLE Battery Service</p>
                </div>`;
        } else {
            // Not connected
            batteryHtml = `
                <div class="p-5 bg-gray-950 rounded-2xl border border-gray-800 text-center">
                    <i class="fas fa-headset text-3xl text-gray-600 mb-2"></i>
                    <p class="text-xs font-bold text-gray-400">No earbuds connected</p>
                    <p class="text-[10px] text-gray-500 mt-1">Tap "Connect" to pair your wireless earbuds</p>
                </div>`;
        }

        container.innerHTML = `
            <div class="p-6 bg-gray-900/90 backdrop-blur-md rounded-3xl border border-gray-800 shadow-xl flex flex-col gap-4 text-white">
                <!-- Top: Device info -->
                <div class="flex items-center justify-between border-b border-gray-800 pb-4">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center text-primary text-lg">
                            <i class="fas fa-headset"></i>
                        </div>
                        <div>
                            <h4 class="font-black text-white text-sm truncate">${e.name}</h4>
                            <p class="text-[10px] font-bold flex items-center gap-1 ${e.connected ? 'text-emerald-400' : 'text-gray-500'}">
                                <span class="w-1.5 h-1.5 rounded-full ${e.connected ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'}"></span>
                                ${e.connected ? 'Connected via Bluetooth' : 'Not Connected'}
                            </p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        ${e.connected
                            ? `<button onclick="Vibe.disconnectBluetooth()" class="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 rounded-xl text-xs font-bold transition flex items-center gap-1.5">
                                    <i class="fas fa-times"></i> Disconnect
                               </button>`
                            : `<button onclick="Vibe.connectBluetooth()" class="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5">
                                    <i class="fas fa-bluetooth-b text-blue-400"></i> Connect
                               </button>`
                        }
                    </div>
                </div>

                <!-- Battery Display -->
                ${batteryHtml}
            </div>`;
    }
};

window.Vibe = Vibe;
