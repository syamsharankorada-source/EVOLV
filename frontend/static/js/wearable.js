/**
 * EVOLV Wearable Module
 * Handles real Bluetooth LE device pairing + live heart-rate streaming, and a
 * manual "type in today's numbers from your watch/app" flow for the metrics
 * (steps, sleep, water) that consumer wearables don't expose over generic BLE.
 */
const Wearable = {
    connectedDevice: null,
    connectedDeviceName: localStorage.getItem('evolv_wearable_name') || null,
    isBluetoothSupported: typeof navigator !== 'undefined' && 'bluetooth' in navigator,
    hrCharacteristic: null,

    init() {
        if (this.connectedDeviceName) {
            this.updateConnectedUI(this.connectedDeviceName);
        }
    },

    openModal() {
        const modal = document.getElementById('wearable-modal');
        if (modal) {
            modal.classList.remove('hidden');
            this.switchTab('bluetooth');
            this.updateStatusDisplay();
        }
    },

    closeModal() {
        const modal = document.getElementById('wearable-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    },

    switchTab(tab) {
        document.querySelectorAll('.wearable-tab-btn').forEach(btn => {
            btn.classList.remove('bg-primary', 'text-dark');
            btn.classList.add('text-gray-400');
        });
        document.querySelectorAll('.wearable-tab-pane').forEach(pane => pane.classList.add('hidden'));

        const activeBtn = document.getElementById(`wearable-tab-btn-${tab}`);
        const activePane = document.getElementById(`wearable-tab-${tab}`);
        if (activeBtn) {
            activeBtn.classList.add('bg-primary', 'text-dark');
            activeBtn.classList.remove('text-gray-400');
        }
        if (activePane) {
            activePane.classList.remove('hidden');
        }

        if (tab === 'qr') {
            this.generateQRCode();
        }
    },

    async scanBluetooth() {
        const statusEl = document.getElementById('bt-status-text');
        const spinner = document.getElementById('bt-spinner');
        const connectBtn = document.getElementById('bt-connect-btn');

        if (!this.isBluetoothSupported) {
            UI.showToast('Web Bluetooth is not supported in this browser. Try Chrome/Edge on desktop or Android, or use manual sync instead.', 'info');
            if (statusEl) statusEl.innerText = 'Web Bluetooth not supported in this browser. Try the "Select Model" tab instead.';
            return;
        }

        try {
            if (spinner) spinner.classList.remove('hidden');
            if (statusEl) statusEl.innerText = 'Scanning for nearby Bluetooth devices...';
            if (connectBtn) connectBtn.disabled = true;

            const device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: ['heart_rate', 'battery_service', 'device_information', 'generic_access', 'generic_attribute']
            });

            if (device) {
                this.connectedDevice = device;
                this.connectedDeviceName = device.name || 'Bluetooth Device';
                localStorage.setItem('evolv_wearable_name', this.connectedDeviceName);

                if (statusEl) statusEl.innerText = `Connecting to ${this.connectedDeviceName}...`;

                device.addEventListener('gattserverdisconnected', () => this.onDeviceDisconnected());

                // Step 1: the actual GATT connection. If THIS fails, we really
                // aren't connected — that error still goes to the outer catch.
                const server = await device.gatt.connect();

                // From here on the device IS connected. Anything that fails past
                // this point (reading the heart-rate service, battery, etc.) must
                // not be allowed to wipe out that fact or skip syncing — a lot of
                // real wearables don't expose live GATT characteristics at all
                // outside their own app, and that's fine; we still record the
                // connection and let manual entry cover the rest.
                UI.showToast(`Paired with ${this.connectedDeviceName}!`, 'success');
                this.updateConnectedUI(this.connectedDeviceName);
                await this.syncDeviceData({ device_name: this.connectedDeviceName });

                // Step 2: try to get live heart-rate data — best effort only.
                try {
                    const hrService = await server.getPrimaryService('heart_rate');
                    this.hrCharacteristic = await hrService.getCharacteristic('heart_rate_measurement');
                    await this.hrCharacteristic.startNotifications();
                    this.hrCharacteristic.addEventListener('characteristicvaluechanged', (e) => this.onHeartRateChanged(e));

                    if (statusEl) statusEl.innerText = `Connected to ${this.connectedDeviceName} — waiting for a live reading...`;
                    const liveBox = document.getElementById('bt-live-reading');
                    if (liveBox) liveBox.classList.remove('hidden');
                } catch (hrErr) {
                    console.log('Heart-rate service unavailable on this device:', hrErr);
                    if (statusEl) {
                        statusEl.innerText = `Connected to ${this.connectedDeviceName}. Enter your past data (steps, sleep, water) under "Select Model" to sync it into your dashboard.`;
                    }
                    UI.showToast(`${this.connectedDeviceName} is connected! Log your data under "Select Model" to see it on your dashboard.`, 'success');
                }

                // Step 3: battery level — also best effort, never fatal.
                try {
                    const battService = await server.getPrimaryService('battery_service');
                    const battChar = await battService.getCharacteristic('battery_level');
                    const battVal = await battChar.readValue();
                    const batteryPct = battVal.getUint8(0);
                    UI.showToast(`${this.connectedDeviceName} battery: ${batteryPct}%`, 'info');
                } catch (battErr) {
                    // Not all devices expose battery_service — that's fine, skip silently.
                }
            }
        } catch (error) {
            console.log('Bluetooth connection cancelled or failed:', error);
            if (error.name !== 'NotFoundError') {
                UI.showToast('Could not pair via Bluetooth. Make sure the device is on, nearby, and in pairing mode — or log your data manually under "Select Model".', 'info');
            }
            if (statusEl) statusEl.innerText = 'Pairing cancelled. You can also log data manually below.';
        } finally {
            if (spinner) spinner.classList.add('hidden');
            if (connectBtn) connectBtn.disabled = false;
        }
    },

    /** Parses a real Heart Rate Measurement characteristic value per the
     * Bluetooth GATT spec (org.bluetooth.characteristic.heart_rate_measurement)
     * and syncs the genuine reading — no randomization. */
    onHeartRateChanged(event) {
        const value = event.target.value; // DataView
        const flags = value.getUint8(0);
        const is16Bit = (flags & 0x1) !== 0;
        const heartRate = is16Bit ? value.getUint16(1, /*littleEndian=*/true) : value.getUint8(1);

        const bpmEl = document.getElementById('bt-live-bpm');
        if (bpmEl) bpmEl.innerText = heartRate;

        // Sync the real reading (throttled to avoid hammering the backend on every beat).
        const now = Date.now();
        if (!this._lastHrSync || now - this._lastHrSync > 4000) {
            this._lastHrSync = now;
            this.syncDeviceData({
                device_name: this.connectedDeviceName,
                heart_rate: heartRate
            });
        }
    },

    onDeviceDisconnected() {
        UI.showToast('Wearable disconnected', 'info');
        const liveBox = document.getElementById('bt-live-reading');
        if (liveBox) liveBox.classList.add('hidden');
        const statusEl = document.getElementById('bt-status-text');
        if (statusEl) statusEl.innerText = 'Device disconnected. Click below to reconnect.';
    },

    /** Manual sync: the person reads today's real steps/sleep/water off their own
     * watch or its companion app and enters them here. This logs their actual
     * numbers — nothing here is generated or guessed by the app. */
    async saveManualSync() {
        const deviceName = document.getElementById('manual-device-select')?.value || 'Wearable Device';
        const steps = document.getElementById('manual-steps-input')?.value;
        const sleepHours = document.getElementById('manual-sleep-input')?.value;
        const waterMl = document.getElementById('manual-water-input')?.value;

        if (!steps && !sleepHours && !waterMl) {
            UI.showToast('Enter at least one value to save', 'info');
            return;
        }

        const payload = { device_name: deviceName };
        if (steps) payload.steps = parseInt(steps, 10);
        if (sleepHours) payload.sleep_hours = parseFloat(sleepHours);
        if (waterMl) payload.water_ml = parseInt(waterMl, 10);

        this.connectedDeviceName = deviceName;
        localStorage.setItem('evolv_wearable_name', deviceName);

        await this.syncDeviceData(payload);
        this.updateConnectedUI(deviceName);
        UI.showToast('Saved today\'s data!', 'success');
        setTimeout(() => this.closeModal(), 900);
    },

    generateQRCode() {
        const qrContainer = document.getElementById('wearable-qr-code');
        if (!qrContainer) return;

        qrContainer.innerHTML = `<div class="py-10 text-slate-400 text-xs"><i class="fas fa-spinner fa-spin mr-2"></i>Generating your pairing link...</div>`;

        APIService.request('/api/wellness/generate-pair-token/', { method: 'POST' })
            .then(res => {
                if (!res || !res.success) throw new Error('no-token');
                const pairUrl = res.data.url;
                qrContainer.innerHTML = `
                    <div class="p-4 bg-white rounded-2xl inline-block">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pairUrl)}&color=0E0E0E&bgcolor=FFFFFF"
                             alt="Pair QR Code" class="w-44 h-44 mx-auto rounded-lg" onerror="Wearable.renderFallbackQR(this)">
                    </div>
                    <p class="text-xs text-slate-400 mt-3">Scan with your phone's camera. It'll open EVOLV, log into this same account, and sync your device data — steps, sleep, and heart rate — straight into this dashboard.</p>
                    <p class="text-[10px] text-slate-500 mt-1">Link expires in ${res.data.expires_in_minutes} minutes and works once.</p>
                `;
            })
            .catch(() => {
                qrContainer.innerHTML = `<div class="py-8 text-red-400 text-xs px-4">Couldn't generate a pairing link — make sure you're logged in (not just browsing as a guest on an expired session), then reopen this tab.</div>`;
            });
    },

    renderFallbackQR(img) {
        if (img && img.parentElement) {
            img.parentElement.innerHTML = `
                <div class="w-44 h-44 bg-slate-900 border-2 border-dashed border-primary flex flex-col items-center justify-center p-3 text-center rounded-xl">
                    <i class="fas fa-qrcode text-primary text-4xl mb-2"></i>
                    <p class="text-[10px] text-white font-bold uppercase">QR image unavailable</p>
                    <p class="text-[8px] text-slate-400 mt-1">Your network may be blocking the QR image service — try again or check your connection.</p>
                </div>
            `;
        }
    },

    async syncDeviceData(payload) {
        try {
            const res = await APIService.request('/api/wellness/sync/', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (res && res.success) {
                if (typeof Dashboard !== 'undefined' && Dashboard.load) Dashboard.load();
                if (typeof Wellness !== 'undefined' && Wellness.loadAssessment) Wellness.loadAssessment();
                if (typeof Progress !== 'undefined' && Progress.load) Progress.load();
            }
        } catch (e) {
            console.error('Device sync error:', e);
        }
    },

    updateConnectedUI(name) {
        const badge = document.getElementById('wearable-connected-badge');
        const nameEl = document.getElementById('wearable-device-name');
        const syncStatusEl = document.getElementById('wearable-sync-status');
        
        if (badge) badge.classList.remove('hidden');
        if (nameEl) nameEl.innerText = name;
        if (syncStatusEl) {
            syncStatusEl.innerHTML = `<span class="inline-flex items-center text-emerald-400 text-xs font-bold"><i class="fas fa-circle text-[8px] mr-1.5 animate-pulse"></i> Connected: ${name}</span>`;
        }
    },

    disconnect() {
        if (this.connectedDevice && this.connectedDevice.gatt && this.connectedDevice.gatt.connected) {
            this.connectedDevice.gatt.disconnect();
        }
        this.connectedDevice = null;
        this.connectedDeviceName = null;
        this.hrCharacteristic = null;
        localStorage.removeItem('evolv_wearable_name');

        const liveBox = document.getElementById('bt-live-reading');
        if (liveBox) liveBox.classList.add('hidden');

        const badge = document.getElementById('wearable-connected-badge');
        const syncStatusEl = document.getElementById('wearable-sync-status');
        if (badge) badge.classList.add('hidden');
        if (syncStatusEl) syncStatusEl.innerHTML = '';
        
        UI.showToast('Wearable disconnected', 'info');
        this.updateStatusDisplay();
    },

    updateStatusDisplay() {
        const statusBox = document.getElementById('wearable-current-status-box');
        if (!statusBox) return;
        
        if (this.connectedDeviceName) {
            statusBox.innerHTML = `
                <div class="flex items-center justify-between bg-blue-950/40 border border-blue-900/60 p-4 rounded-2xl mb-4">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg">
                            <i class="fas fa-satellite-dish"></i>
                        </div>
                        <div>
                            <p class="text-sm font-black text-white">${this.connectedDeviceName}</p>
                            <p class="text-xs text-emerald-400 font-bold flex items-center gap-1"><i class="fas fa-check-circle text-[10px]"></i> Live Sync Active</p>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="Wearable.disconnect()" class="px-3 py-1.5 bg-slate-800 text-slate-400 hover:text-red-400 text-xs font-bold rounded-lg transition-all">Disconnect</button>
                    </div>
                </div>
            `;
        } else {
            statusBox.innerHTML = '';
        }
    }
};

window.Wearable = Wearable;
document.addEventListener('DOMContentLoaded', () => Wearable.init());
