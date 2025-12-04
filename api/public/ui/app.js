// PASIKEISK, jei pas tave kitas hostas/URL:
const API_BASE_URL = 'http://localhost:8000/api/v1';

let accessToken = localStorage.getItem('access_token') || null;
let refreshToken = localStorage.getItem('refresh_token') || null;
let currentUser = null;

// Bendra API funkcija
async function apiRequest(endpoint, options = {}) {
    const headers = options.headers || {};

    if (!headers['Content-Type'] && options.body) {
        headers['Content-Type'] = 'application/json';
    }

    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const doFetch = async () => {
        return fetch(API_BASE_URL + endpoint, {
            ...options,
            headers,
        });
    };

    let response = await doFetch();

    // pasiimam refresh tokeną iš atminties ARBA iš localStorage
    let rt = refreshToken || localStorage.getItem('refresh_token');

    // jei yra klaida – pasiimam tekstą, kad patikrintume pranešimą
    let text = null;
    if (!response.ok) {
        text = await response.text();
    }

    const tokenExpired =
        (response.status === 401 || response.status === 500) &&
        text &&
        text.includes('Token has expired');

    if (tokenExpired && rt) {
        console.warn('Access token expired. Attempting refresh...');

        const refreshed = await refreshAccessToken(rt);
        if (refreshed) {
            // atnaujintas accessToken – perbandom requestą
            headers['Authorization'] = `Bearer ${accessToken}`;
            response = await doFetch();

            if (!response.ok) {
                const retryText = await response.text();
                throw new Error(retryText || `HTTP error ${response.status}`);
            }

            try {
                return await response.json();
            } catch {
                return null;
            }
        } else {
            console.error('Refresh failed → logging out');
            logoutUser();
            throw new Error('Session expired');
        }
    }

    // jei čia atėjom – tokeno neatnaujinam, tiesiog tvarkom atsakymą
    if (!response.ok) {
        throw new Error(text || `HTTP error ${response.status}`);
    }

    try {
        return await response.json();
    } catch {
        return null;
    }
}


async function refreshAccessToken(rt) {
    try {
        const res = await fetch(API_BASE_URL + "/auth/refresh", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                refresh_token: rt,
            }),
        });

        if (!res.ok) {
            console.warn('Refresh endpoint returned', res.status);
            return false;
        }

        const data = await res.json();

        if (!data.access_token) {
            console.warn('No access_token in refresh response');
            return false;
        }

        // atnaujinam access token
        accessToken = data.access_token;
        localStorage.setItem("access_token", accessToken);

        // jei backend grąžina naują refresh_token – atnaujinam ir jį
        if (data.refresh_token) {
            refreshToken = data.refresh_token;
            localStorage.setItem("refresh_token", refreshToken);
        } else {
            refreshToken = rt;
            localStorage.setItem("refresh_token", rt);
        }

        return true;
    } catch (err) {
        console.error('refreshAccessToken error', err);
        return false;
    }
}



/* VIEW SWITCHING */

function showView(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
}

function initNavigation() {
    document.querySelectorAll('[data-view]').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            const targetView = el.getAttribute('data-view');
            showView(targetView);

            if (targetView === 'view-dashboard') {
                loadDashboardStats();
            } else if (targetView === 'view-warehouses') {
                loadWarehouses();
            } else if (targetView === 'view-shipments') {
                loadShipments();
            } else if (targetView === 'view-packages') {
                loadPackages();
            } else if (targetView === 'view-account') {
                loadAccountInfo();
            } else if (targetView === 'view-create-shipment') {
                loadWarehousesForSelect();
            }

            mobileNavClose();
        });
    });
}

/* HAMBURGER MENIU */

const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobile-nav');

function mobileNavClose() {
    if (!hamburger || !mobileNav) return;
    hamburger.classList.remove('open');
    mobileNav.classList.remove('open');
}

if (hamburger) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('open');
        mobileNav.classList.toggle('open');
    });
}

/* MODAL */

const modal = document.getElementById('modal');
const modalBackdrop = document.getElementById('modal-backdrop');
const modalCloseBtn = document.getElementById('modal-close');
const modalFooterCloseBtn = document.getElementById('modal-footer-close');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');

function openModal(title, html) {
    if (!modal || !modalBackdrop) return;
    modalTitle.textContent = title;
    modalBody.innerHTML = html;
    modal.classList.add('open');
    modalBackdrop.classList.add('open');
}

function closeModal() {
    if (!modal || !modalBackdrop) return;
    modal.classList.remove('open');
    modalBackdrop.classList.remove('open');
}

if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);
if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
if (modalFooterCloseBtn) modalFooterCloseBtn.addEventListener('click', closeModal);

/* AUTH STATE */

formLogin = document.getElementById('form-login');
const formRegister = document.getElementById('form-register');
const btnNavLogout = document.getElementById('btn-nav-logout');
const btnNavLogin = document.getElementById('btn-nav-login');
const btnOpenCreateWarehouse = document.getElementById('btn-open-create-warehouse');

function setAuthState(isLoggedIn) {
    if (isLoggedIn) {
        if (btnNavLogout) btnNavLogout.style.display = 'inline-flex';
        if (btnNavLogin) btnNavLogin.style.display = 'none';
        showView('view-dashboard');
        loadDashboardStats();
        loadAccountInfo();
    } else {
        if (btnNavLogout) btnNavLogout.style.display = 'none';
        if (btnNavLogin) btnNavLogin.style.display = 'inline-flex';
        showView('view-login');
    }
}

/* LOGIN */

if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        try {
            const data = await apiRequest('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            accessToken = data.access_token || data.token || null;
            refreshToken = data.refresh_token || null;

            if (!accessToken) {
                throw new Error('No access token in response');
            }

            localStorage.setItem('access_token', accessToken);
            if (refreshToken) {
                localStorage.setItem('refresh_token', refreshToken);
            }

            await loadAccountInfo();
            setAuthState(true);
        } catch (err) {
            console.error(err);
            alert('Prisijungti nepavyko. Patikrink prisijungimo duomenis.');
        }
    });
}

/* REGISTER */

if (formRegister) {
    formRegister.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const role = document.getElementById('reg-role').value;
        const password = document.getElementById('reg-password').value;
        const password_confirmation = document.getElementById('reg-password-confirm').value;

        try {
            await apiRequest('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ name, email, role, password, password_confirmation })
            });

            alert('Registracija sėkminga. Dabar prisijunk.');
            showView('view-login');
        } catch (err) {
            console.error(err);
            alert('Registracija nepavyko. Patikrink laukus.');
        }
    });
}

/* LOGOUT */

if (btnNavLogout) {
    btnNavLogout.addEventListener('click', async () => {
        try {
            await apiRequest('/auth/logout', { method: 'POST' });
        } catch (e) {
            console.warn('Logout error (gal jau atjungtas):', e);
        }
        accessToken = null;
        refreshToken = null;
        currentUser = null;
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setAuthState(false);
    });
}
if (btnOpenCreateWarehouse) {
    btnOpenCreateWarehouse.addEventListener('click', () => {
        openCreateWarehouseModal();
    });
}


/* ACCOUNT INFO */

async function loadAccountInfo() {
    if (!accessToken) return;
    try {
        const me = await apiRequest('/auth/me', { method: 'GET' });
        currentUser = me;

        const nameEl = document.getElementById('acc-name');
        const emailEl = document.getElementById('acc-email');
        const roleEl = document.getElementById('acc-role');

        if (nameEl) nameEl.textContent = me.name || '–';
        if (emailEl) emailEl.textContent = me.email || '–';
        if (roleEl) roleEl.textContent = me.role || '–';
    } catch (e) {
        console.error('loadAccountInfo', e);
    }
}

/* DASHBOARD STATS */

async function loadDashboardStats() {
    try {
        const [warehouses, shipments, packages] = await Promise.all([
            apiRequest('/warehouses', { method: 'GET' }),
            apiRequest('/shipments', { method: 'GET' }),
            apiRequest('/packages', { method: 'GET' }),
        ]);

        const whEl = document.getElementById('stat-warehouses');
        const shEl = document.getElementById('stat-shipments');
        const pkEl = document.getElementById('stat-packages');

        if (whEl) whEl.textContent = warehouses.length || 0;
        if (shEl) shEl.textContent = shipments.length || 0;
        if (pkEl) pkEl.textContent = packages.length || 0;
    } catch (e) {
        console.error('loadDashboardStats', e);
    }
}

/* WAREHOUSES LIST */

const warehousesTableBody = document.getElementById('warehouses-table-body');

async function loadWarehouses() {
    if (!warehousesTableBody) return;

    warehousesTableBody.innerHTML = '<tr><td colspan="4">Kraunama...</td></tr>';

    try {
        const warehouses = await apiRequest('/warehouses', { method: 'GET' });

        if (!warehouses.length) {
            warehousesTableBody.innerHTML = '<tr><td colspan="4">Sandėlių nerasta.</td></tr>';
            return;
        }

        warehousesTableBody.innerHTML = '';

        warehouses.forEach(wh => {
            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td>${wh.id}</td>
                <td>${wh.name}</td>
                <td>${wh.address || '-'}</td>
                <td>
                    <button class="btn btn-primary btn-sm"
                            data-action="wh-shipments"
                            data-id="${wh.id}">
                        <i class="fa-solid fa-boxes-stacked"></i> Siuntos
                    </button>
                </td>
            `;

            warehousesTableBody.appendChild(tr);
        });

        warehousesTableBody.querySelectorAll('[data-action="wh-shipments"]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = parseInt(btn.getAttribute('data-id'), 10);
                await showWarehouseShipments(id);
            });
        });

    } catch (e) {
        console.error(e);
        warehousesTableBody.innerHTML = '<tr><td colspan="4">Įvyko klaida kraunant sandėlius.</td></tr>';
    }
}
function openCreateWarehouseModal() {
    if (!accessToken) {
        openModal('Reikia prisijungti', '<p>Norėdami sukurti sandėlį, prisijunkite prie sistemos.</p>');
        return;
    }

    const html = `
        <p>Sukurti naują sandėlį sistemoje.</p>

        <form id="form-create-warehouse" class="form-grid">
            <div class="form-group">
                <label for="wh-name">Pavadinimas</label>
                <input type="text" id="wh-name" name="name" required placeholder="Pvz. Kaunas DC" />
            </div>

            <div class="form-group">
                <label for="wh-address">Adresas</label>
                <input type="text" id="wh-address" name="address" placeholder="Pvz. Raudondvario pl. 100, Kaunas" />
            </div>

            <div class="form-group">
                <button type="submit" class="btn btn-primary">
                    <i class="fa-solid fa-warehouse"></i> Sukurti sandėlį
                </button>
            </div>
        </form>
    `;

    openModal('Naujas sandėlis', html);

    const form = document.getElementById('form-create-warehouse');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('wh-name').value.trim();
        const address = document.getElementById('wh-address').value.trim();

        if (!name) {
            alert('Pavadinimas yra privalomas.');
            return;
        }

        try {
            await apiRequest('/warehouses', {
                method: 'POST',
                body: JSON.stringify({ name, address }),
            });

            alert('Sandėlis sėkmingai sukurtas.');
            closeModal();
            loadWarehouses();
            loadDashboardStats?.();
        } catch (err) {
            console.error(err);
            openModal(
                'Klaida',
                '<p>Nepavyko sukurti sandėlio. Greičiausiai neturi admin rolės arba duomenys neteisingi.</p>'
            );
        }
    });
}


// Sandėlio siuntos (naudojam /shipments ir filtruojam front-end pagal warehouse_id)
async function showWarehouseShipments(warehouseId) {
    try {
        const shipments = await apiRequest('/shipments', { method: 'GET' });

        const filtered = shipments.filter(sh => {
            if (typeof sh.warehouse_id !== 'undefined') {
                return sh.warehouse_id === warehouseId;
            }
            if (sh.warehouse && typeof sh.warehouse.id !== 'undefined') {
                return sh.warehouse.id === warehouseId;
            }
            return false;
        });

        if (!filtered.length) {
            openModal(`Sandėlis #${warehouseId}`, '<p>Šiame sandėlyje siuntų nėra.</p>');
            return;
        }

        const rows = filtered.map(sh => `
            <tr>
                <td>${sh.id}</td>
                <td>${sh.code || '-'}</td>
                <td>${sh.status || '-'}</td>
            </tr>
        `).join('');

        const html = `
            <p><strong>Siuntos sandėlyje #${warehouseId}:</strong></p>
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Kodas</th>
                            <th>Statusas</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;

        openModal(`Sandėlis #${warehouseId} – siuntos`, html);
    } catch (e) {
        console.error(e);
        openModal('Klaida', '<p>Nepavyko gauti sandėlio siuntų.</p>');
    }
}

/* SHIPMENTS LIST */

const shipmentsTableBody = document.getElementById('shipments-table-body');
const formFilterShipments = document.getElementById('form-filter-shipments');
let allShipmentsCache = [];

async function loadShipments() {
    if (!shipmentsTableBody) return;
    shipmentsTableBody.innerHTML = '<tr><td colspan="5">Kraunama...</td></tr>';

    try {
        const shipments = await apiRequest('/shipments', { method: 'GET' });
        allShipmentsCache = shipments;
        renderShipmentsTable(shipments);
    } catch (e) {
        console.error(e);
        shipmentsTableBody.innerHTML = '<tr><td colspan="5">Įvyko klaida kraunant siuntas.</td></tr>';
    }
}

function renderShipmentsTable(shipments) {
    if (!shipmentsTableBody) return;

    if (!shipments.length) {
        shipmentsTableBody.innerHTML = '<tr><td colspan="5">Nerasta siuntų.</td></tr>';
        return;
    }

    shipmentsTableBody.innerHTML = '';

    shipments.forEach(sh => {
        const tr = document.createElement('tr');

        const warehouseName = sh.warehouse
            ? (sh.warehouse.name || sh.warehouse.id || '-')
            : (sh.warehouse_id || '-');

        tr.innerHTML = `
            <td>${sh.id}</td>
            <td>${sh.code || '-'}</td>
            <td>${sh.status || '-'}</td>
            <td>${warehouseName}</td>
            <td>
                <button class="btn btn-primary btn-sm"
                        data-action="details"
                        data-id="${sh.id}">
                    <i class="fa-solid fa-circle-info"></i> Detalės
                </button>

                <button class="btn btn-secondary btn-sm"
                        data-action="packages"
                        data-id="${sh.id}">
                    <i class="fa-solid fa-cubes"></i> Paketai
                </button>

                <button class="btn btn-primary btn-sm"
                        data-action="add-package"
                        data-id="${sh.id}">
                    <i class="fa-solid fa-plus"></i> Naujas paketas
                </button>
            </td>
        `;
        shipmentsTableBody.appendChild(tr);
    });

    shipmentsTableBody.querySelectorAll('button[data-action]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const action = btn.getAttribute('data-action');
            const id = btn.getAttribute('data-id');
            if (action === 'details') {
                await showShipmentDetails(id);
            } else if (action === 'packages') {
                await showShipmentPackages(id);
            } else if (action === 'add-package') {
                openAddPackageModal(id);
            }
        });
    });
}

if (formFilterShipments) {
    formFilterShipments.addEventListener('submit', (e) => {
        e.preventDefault();
        const status = document.getElementById('filter-status').value;
        const code = document.getElementById('filter-code').value.trim().toLowerCase();

        let filtered = allShipmentsCache.slice();

        if (status) {
            filtered = filtered.filter(sh => (sh.status || '').toLowerCase() === status.toLowerCase());
        }

        if (code) {
            filtered = filtered.filter(sh => (sh.code || '').toLowerCase().includes(code));
        }

        renderShipmentsTable(filtered);
    });
}
function openAddPackageModal(shipmentId) {
    if (!accessToken) {
        openModal('Reikia prisijungti', '<p>Norėdami pridėti paketą, prisijunkite prie sistemos.</p>');
        return;
    }

    const html = `
        <p>Kurti naują paketą siuntai <strong>#${shipmentId}</strong></p>

        <form id="form-add-package-single" class="form-grid">
            <div class="form-group">
                <label for="pkg2-description">Aprašymas</label>
                <input type="text" id="pkg2-description" name="description" placeholder="Pvz. Elektronika" />
            </div>

            <div class="form-group">
                <label for="pkg2-weight">Svoris (kg)</label>
                <input type="number" step="0.01" min="0" id="pkg2-weight" name="weight" required />
            </div>

            <div class="form-group">
                <label for="pkg2-length">Ilgis (cm)</label>
                <input type="number" step="0.1" min="0" id="pkg2-length" name="length" required />
            </div>

            <div class="form-group">
                <label for="pkg2-width">Plotis (cm)</label>
                <input type="number" step="0.1" min="0" id="pkg2-width" name="width" required />
            </div>

            <div class="form-group">
                <label for="pkg2-height">Aukštis (cm)</label>
                <input type="number" step="0.1" min="0" id="pkg2-height" name="height" required />
            </div>

            <div class="form-group form-group-inline">
                <label class="checkbox-label">
                    <input type="checkbox" id="pkg2-fragile" name="fragile" />
                    Dūžtantis
                </label>
            </div>

            <div class="form-group">
                <button type="submit" class="btn btn-primary">
                    <i class="fa-solid fa-plus"></i> Sukurti paketą
                </button>
            </div>
        </form>
    `;

    openModal(`Naujas paketas siuntai #${shipmentId}`, html);

    const form = document.getElementById('form-add-package-single');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const description = document.getElementById('pkg2-description').value.trim();
        const weight = parseFloat(document.getElementById('pkg2-weight').value);
        const length = parseFloat(document.getElementById('pkg2-length').value);
        const width  = parseFloat(document.getElementById('pkg2-width').value);
        const height = parseFloat(document.getElementById('pkg2-height').value);
        const fragile = document.getElementById('pkg2-fragile').checked;

        try {
            await apiRequest('/packages', {
                method: 'POST',
                body: JSON.stringify({
                    shipment_id: Number(shipmentId),
                    description,
                    weight,
                    length,
                    width,
                    height,
                    fragile,
                }),
            });

            alert('Paketas sėkmingai sukurtas.');
            closeModal();

            // jei nori iškart matyti naują paketą sąraše:
            // await showShipmentPackages(shipmentId);
        } catch (err) {
            console.error(err);
            alert('Nepavyko pridėti paketo. Patikrink duomenis ir rolę (operator/admin).');
        }
    });
}


/* SHIPMENT DETAILS */

async function showShipmentDetails(id) {
    try {
        const sh = await apiRequest(`/shipments/${id}`, { method: 'GET' });

        const warehouseName = sh.warehouse
            ? (sh.warehouse.name || sh.warehouse.id || '-')
            : (sh.warehouse_id || '-');

        const userName = sh.user
            ? (sh.user.name || sh.user.id || '-')
            : (sh.user_id || '-');

        const html = `
            <p><strong>ID:</strong> ${sh.id}</p>
            <p><strong>Kodas:</strong> ${sh.code || '-'}</p>
            <p><strong>Statusas:</strong> ${sh.status || '-'}</p>
            <p><strong>Sandėlis:</strong> ${warehouseName}</p>
            <p><strong>Naudotojas:</strong> ${userName}</p>
        `;

        openModal(`Siunta #${sh.id}`, html);
    } catch (e) {
        console.error(e);
        alert('Nepavyko gauti siuntos detalių.');
    }
}

/* SHIPMENT PACKAGES */

async function showShipmentPackages(id) {
    if (!accessToken) {
        openModal('Reikia prisijungti', '<p>Norėdami matyti siuntos paketus, prisijunkite prie sistemos.</p>');
        return;
    }

    try {
        const packages = await apiRequest(`/shipments/${id}/packages`, { method: 'GET' });

        const rows = packages.length
            ? packages.map(p => `
                <tr>
                    <td>${p.id}</td>
                    <td>${p.description || '-'}</td>
                    <td>${p.weight} kg</td>
                    <td>${p.length} × ${p.width} × ${p.height}</td>
                    <td>${p.fragile ? 'Taip' : 'Ne'}</td>
                </tr>
              `).join('')
            : `<tr><td colspan="5">Ši siunta šiuo metu neturi paketų.</td></tr>`;

        const html = `
            <p><strong>Paketai siuntoje #${id}:</strong></p>
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Aprašymas</th>
                            <th>Svoris</th>
                            <th>Išmatavimai (L×W×H)</th>
                            <th>Dūžtantis</th>
                        </tr>
                    </thead>
                    <tbody id="shipment-packages-rows">${rows}</tbody>
                </table>
            </div>

            <hr class="modal-separator" />

            <h3 style="margin-top:1rem;">Pridėti naują paketą</h3>
            <form id="form-add-package" class="form-grid">
                <div class="form-group">
                    <label for="pkg-description">Aprašymas</label>
                    <input type="text" id="pkg-description" name="description" placeholder="Pvz. Elektronika" />
                </div>

                <div class="form-group">
                    <label for="pkg-weight">Svoris (kg)</label>
                    <input type="number" step="0.01" min="0" id="pkg-weight" name="weight" required />
                </div>

                <div class="form-group">
                    <label for="pkg-length">Ilgis (cm)</label>
                    <input type="number" step="0.1" min="0" id="pkg-length" name="length" required />
                </div>

                <div class="form-group">
                    <label for="pkg-width">Plotis (cm)</label>
                    <input type="number" step="0.1" min="0" id="pkg-width" name="width" required />
                </div>

                <div class="form-group">
                    <label for="pkg-height">Aukštis (cm)</label>
                    <input type="number" step="0.1" min="0" id="pkg-height" name="height" required />
                </div>

                <div class="form-group form-group-inline">
                    <label class="checkbox-label">
                        <input type="checkbox" id="pkg-fragile" name="fragile" />
                        Dūžtantis
                    </label>
                </div>

                <div class="form-group">
                    <button type="submit" class="btn btn-primary">
                        <i class="fa-solid fa-plus"></i> Pridėti paketą
                    </button>
                </div>
            </form>
        `;

        openModal(`Siunta #${id} – paketai`, html);

        // pridėti submit listeneriui jau po to, kai modalas atidarytas
        const form = document.getElementById('form-add-package');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();

                if (!accessToken) {
                    alert('Norint pridėti paketą reikia prisijungti.');
                    return;
                }

                const description = document.getElementById('pkg-description').value.trim();
                const weight = parseFloat(document.getElementById('pkg-weight').value);
                const length = parseFloat(document.getElementById('pkg-length').value);
                const width  = parseFloat(document.getElementById('pkg-width').value);
                const height = parseFloat(document.getElementById('pkg-height').value);
                const fragile = document.getElementById('pkg-fragile').checked;

                try {
                    await apiRequest('/packages', {
                        method: 'POST',
                        body: JSON.stringify({
                            shipment_id: Number(id),
                            description,
                            weight,
                            length,
                            width,
                            height,
                            fragile,
                        }),
                    });

                    // iš naujo užkraunam paketų sąrašą, kad matytum naują
                    await showShipmentPackages(id);
                } catch (err) {
                    console.error(err);
                    alert('Nepavyko pridėti paketo. Patikrink duomenis ir rolę (operator/admin).');
                }
            });
        }

    } catch (e) {
        console.error(e);
        openModal('Klaida', `<p>Nepavyko gauti siuntos paketų.<br><small>${e.message}</small></p>`);
    }
}


/* PACKAGES VIEW – VISI PAKETAI */

const packagesTableBody = document.getElementById('packages-table-body');

async function loadPackages() {
    if (!packagesTableBody) return;

    packagesTableBody.innerHTML = '<tr><td colspan="6">Kraunama...</td></tr>';

    try {
        const packages = await apiRequest('/packages', { method: 'GET' });

        if (!packages.length) {
            packagesTableBody.innerHTML = '<tr><td colspan="6">Paketų nerasta.</td></tr>';
            return;
        }

        packagesTableBody.innerHTML = '';

        packages.forEach(p => {
            const tr = document.createElement('tr');

            const dims = `${p.length} × ${p.width} × ${p.height}`;

            tr.innerHTML = `
                <td>${p.id}</td>
                <td>${p.description || '-'}</td>
                <td>${p.weight} kg</td>
                <td>${dims}</td>
                <td>${p.fragile ? 'Taip' : 'Ne'}</td>
                <td>
                    <button class="btn btn-primary btn-sm"
                        data-action="pkg-shipment"
                        data-id="${p.shipment_id}">
                        <i class="fa-solid fa-box"></i> Siunta #${p.shipment_id}
                    </button>
                </td>
            `;

            packagesTableBody.appendChild(tr);
        });

        packagesTableBody.querySelectorAll('[data-action="pkg-shipment"]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const shipmentId = btn.getAttribute('data-id');
                await showShipmentDetails(shipmentId);
            });
        });
    } catch (e) {
        console.error(e);
        packagesTableBody.innerHTML = '<tr><td colspan="6">Įvyko klaida kraunant paketus.</td></tr>';
    }
}

/* CREATE SHIPMENT */

const formCreateShipment = document.getElementById('form-create-shipment');
const csWarehouseSelect = document.getElementById('cs-warehouse');

async function loadWarehousesForSelect() {
    if (!csWarehouseSelect) return;

    try {
        const warehouses = await apiRequest('/warehouses', { method: 'GET' });

        csWarehouseSelect.innerHTML = '';
        warehouses.forEach(wh => {
            const opt = document.createElement('option');
            opt.value = wh.id;
            opt.textContent = `${wh.name} (#${wh.id})`;
            csWarehouseSelect.appendChild(opt);
        });
    } catch (e) {
        console.error('loadWarehousesForSelect', e);
        csWarehouseSelect.innerHTML = '<option value="">Nepavyko užkrauti sandėlių</option>';
    }
}

if (formCreateShipment) {
    formCreateShipment.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!accessToken) {
            alert('Norint kurti siuntą reikia prisijungti.');
            return;
        }

        const code = document.getElementById('cs-code').value.trim();
        const warehouse_id = parseInt(csWarehouseSelect.value, 10);
        const status = document.querySelector('input[name="cs-status"]:checked').value;

        try {
            await apiRequest('/shipments', {
                method: 'POST',
                body: JSON.stringify({
                    code,
                    warehouse_id,
                    status
                    // user_id priskiriamas backende pagal auth user
                })
            });

            alert('Siunta sukurta sėkmingai.');
            formCreateShipment.reset();
            await loadWarehousesForSelect();
            showView('view-shipments');
            loadShipments();
        } catch (e) {
            console.error(e);
            alert('Nepavyko sukurti siuntos. Patikrink duomenis ir rolę (operator/admin).');
        }
    });
}

/* INITIALIZATION */

document.addEventListener('DOMContentLoaded', async () => {
    initNavigation();

    if (accessToken) {
        try {
            await loadAccountInfo();
            setAuthState(true);
        } catch (e) {
            console.error('Initial auth check failed:', e);
            accessToken = null;
            refreshToken = null;
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            setAuthState(false);
        }
    } else {
        setAuthState(false);
    }
});
