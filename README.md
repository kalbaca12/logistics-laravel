# Logistikos REST API ir naudotojo sąsajos projektas

## 1. Sprendžiamo uždavinio aprašymas

### 1.1. Sistemos paskirtis

Projekto tikslas – sukurti paprastą logistikos valdymo sistemą, leidžiančią valdyti:

- **sandėlius**,
- **siuntas**,
- **siuntų paketus**.

Sistema realizuota kaip **REST API (Laravel)** ir **lengvas front-end** (vienas HTML/CSS/JS puslapis), skirtas patogiai išbandyti ir demonstruoti API funkcionalumą.

Tipiniai naudotojai:

- **Administratorius** – prižiūri sandėlių sąrašą, gali kurti / redaguoti / trinti sandėlius, valdyti siuntas ir paketus.
- **Operatorius** – dirba su siuntomis ir paketais (kuria naujas siuntas, priskiria paketus).
- **Svečas (guest)** – gali tik peržiūrėti sandėlių, siuntų ir paketų sąrašus per API ir UI, bet negali keisti duomenų.

Sistema orientuota į mokymosi tikslus – parodyti, kaip:

- sukurti REST API su **roles-based** autentifikacija,
- naudoti **JWT** ir **refresh tokenus**,
- ant viršaus uždėti paprastą, **responsyvią naudotojo sąsają**.

---

### 1.2. Funkciniai reikalavimai

Sistema realizuoja šias funkcijas:

**Autentifikacija ir rolės**

- Vartotojas gali **užsiregistruoti** (POST `/api/v1/auth/register`).
- Vartotojas gali **prisijungti** (POST `/api/v1/auth/login`) ir gauti:
  - `access_token` (trumpalaikis),
  - `refresh_token` (ilgesnio galiojimo).
- Vartotojas gali gauti **informaciją apie save** (GET `/api/v1/auth/me`).
- Vartotojas gali **atsijungti** (POST `/api/v1/auth/logout`).
- **Admin** ir **Operator** rolės nustatomos `role` lauku naudotojo įraše.
- Prieiga prie dalies API metodų ribojama pagal rolę:

  - tik **admin** gali kurti / redaguoti / trinti sandėlius;
  - **admin** ir **operatorius** gali kurti / redaguoti / trinti siuntas ir paketus;
  - **guest** gali tik skaityti (GET).

**Sandėlių valdymas**

- Peržiūrėti visus sandėlius: `GET /api/v1/warehouses`.
- Peržiūrėti konkretų sandėlį: `GET /api/v1/warehouses/{id}`.
- (Admin) sukurti naują sandėlį: `POST /api/v1/warehouses`.
- (Admin) atnaujinti sandėlio duomenis: `PUT /api/v1/warehouses/{id}`.
- (Admin) ištrinti sandėlį: `DELETE /api/v1/warehouses/{id}`.

**Siuntų valdymas**

- Peržiūrėti visas siuntas: `GET /api/v1/shipments` (su filtravimu UI pusėje).
- Peržiūrėti konkrečią siuntą: `GET /api/v1/shipments/{id}`.
- (Operator / Admin) sukurti naują siuntą: `POST /api/v1/shipments`.
- (Operator / Admin) atnaujinti siuntos būseną ir duomenis: `PUT /api/v1/shipments/{id}`.
- (Operator / Admin) ištrinti siuntą: `DELETE /api/v1/shipments/{id}`.
- Gauti konkretios siuntos paketus: `GET /api/v1/shipments/{id}/packages`.

**Paketų valdymas**

- Peržiūrėti visus paketus: `GET /api/v1/packages`.
- Peržiūrėti konkretų paketą: `GET /api/v1/packages/{id}`.
- (Operator / Admin) sukurti naują paketą konkrečiai siuntai: `POST /api/v1/packages` (su `shipment_id`).
- (Operator / Admin) atnaujinti paketo duomenis: `PUT /api/v1/packages/{id}`.
- (Operator / Admin) ištrinti paketą: `DELETE /api/v1/packages/{id}`.

**Front-end funkcijos**

- Prisijungimo / registracijos formos su vaidmenų (rolės) atvaizdavimu.
- **Dashboard** su santrumpomis:
  - sandėlių skaičius,
  - siuntų skaičius,
  - paketų skaičius,
  - demonstracinė logistikos iliustracija.
- **Sandėlių langas**:
  - lentelė su sandėlių sąrašu,
  - mygtukas *„Naujas sandėlis“* (admin tik),
  - sandėlio „Siuntos“ mygtukas, atidarantis modalinį langą su to sandėlio siuntomis.
- **Siuntų langas**:
  - lentelė su siuntomis,
  - filtravimas pagal statusą ir kodą,
  - „Detalės“ mygtukas (modalas),
  - „Paketai“ mygtukas (modalas),
  - „Naujas paketas“ mygtukas – atskiras modalas naujam paketui kurti.
- **Paketų langas**:
  - lentelė su visais paketais,
  - mygtukas „Siunta #id“, parodantis susijusią siuntą.
- Visi veiksmai vykdomi per REST API naudojant **fetch** ir **JWT**.

---

## 2. Sistemos architektūra

Sistema sudaryta iš trijų pagrindinių komponentų:

1. **Naudotojo naršyklė (Front-end)**  
   - Vienas `index.html` puslapis.  
   - Stiliai – `style.css`.  
   - Logika – `app.js`.  
   - Bendrauja su back-end REST API per `fetch` HTTP užklausas (`/api/v1/...`).
   - Access token saugomas `localStorage`, jei reikia – naudojamas `refresh_token`.

2. **Laravel aplikacija (Back-end / API)**  
   - PHP + Laravel karkasas.
   - API maršrutai: `routes/api.php`.
   - Kontroleriai: `AuthController`, `WarehouseController`, `ShipmentController`, `PackageController`.
   - Middleware:
     - `auth:api` (JWT autentifikacija),
     - `role` (rolėms tikrinti).
   - Naudoja `JWTAuth` biblioteką ir atskirą `RefreshToken` modelį ilgesnio galiojimo žetonams.

3. **Duomenų bazė**  
   - Laravel Eloquent modeliai: `User`, `Warehouse`, `Shipment`, `Package`, `RefreshToken`.
   - Tipinė struktūra:
     - `warehouses` – sandėlių informacija (pavadinimas, adresas).
     - `shipments` – siuntų kodai, statusai, ryšys su sandėliu ir naudotoju.
     - `packages` – paketo aprašymas, svoris, išmatavimai, ar dūžtantis, ryšys su siunta.
     - `users` – naudotojai, rolės, slaptažodžiai (hash).
     - `refresh_tokens` – galiojantys atnaujinimo žetonai.

### 2.1. UML deployment diagrama (žodinis aprašymas)

<img width="801" height="559" alt="image" src="https://github.com/user-attachments/assets/d395d979-0c26-44fe-aef3-a86a1d952c19" />

---

## 3. Naudotojo sąsajos projektas

### 3.1. Wireframe’ai

Wireframe’ams galima panaudoti bet kokį įrankį (draw.io, Figma, ranka ir nuskanuoti). Pasiūlyti langai:

1. **Prisijungimo langas**
<img width="2484" height="1884" alt="image" src="https://github.com/user-attachments/assets/4ff9ef72-421d-4d59-b280-b50fe808e723" />


2. **Dashboard**
<img width="3364" height="2084" alt="image" src="https://github.com/user-attachments/assets/e6091382-03d6-45f8-80bc-2a14e2ef91ea" />


3. **Sandėlių langas**
<img width="3164" height="1804" alt="image" src="https://github.com/user-attachments/assets/8841e871-92af-41f8-8755-f8ce341b741b" />


4. **Siuntų langas**
<img width="3164" height="1804" alt="image" src="https://github.com/user-attachments/assets/3f6ab76b-452c-4331-a02c-07db758056a6" />


5. **Paketų langas**
<img width="3164" height="2124" alt="image" src="https://github.com/user-attachments/assets/1b30567e-18d2-44c0-8c1a-90dce0b143c2" />


6. **Modaliniai langai**
   - „Siunta #id – paketai“ (lentelė + „Naujas paketas“ forma).
   - „Naujas sandėlis“ forma.
   - Klaidos / informaciniai pranešimai.

### 3.2. Realizacijos ekrano iškarpos

Prie wireframe’ų ataskaitoje pridėti atitinkamas:

- Prijungimo ekrano screenshot.
- Dashboard screenshot.
- Sandėlių, Siuntų, Paketų langų screenshot’us.
- Bent vieno modalo (pvz., „Siunta #1 – paketai“) screenshot.

---

## 4. API specifikacija (OpenAPI)

Pilna API specifikacija aprašoma atskirame faile:

- `api-spec.yaml` (OpenAPI 3.0 formatas).

README / ataskaitoje galima palikti nuorodą:

> Išsami API specifikacija pateikta faile **`api-spec.yaml`**, kuriame aprašyti visi maršrutai, modeliai ir pavyzdiniai atsakymai.

### 4.1. Pagrindiniai endpoint’ai (santrauka)

| Metodas | Kelias                          | Aprašymas                            | Autentifikacija / rolė          |
|--------|----------------------------------|--------------------------------------|---------------------------------|
| POST   | `/api/v1/auth/register`         | Registracija                         | vieša                           |
| POST   | `/api/v1/auth/login`            | Prisijungimas                        | vieša                           |
| POST   | `/api/v1/auth/refresh`          | Access token atnaujinimas            | vieša (su validžiu refresh)     |
| GET    | `/api/v1/auth/me`               | Prisijungusio vartotojo info         | `auth:api`                      |
| POST   | `/api/v1/auth/logout`           | Atsijungimas                         | `auth:api`                      |
| GET    | `/api/v1/warehouses`            | Sandėlių sąrašas                     | vieša                           |
| POST   | `/api/v1/warehouses`            | Naujas sandėlis                      | `auth:api`, `role:admin`        |
| GET    | `/api/v1/shipments`             | Siuntų sąrašas                       | vieša                           |
| POST   | `/api/v1/shipments`             | Nauja siunta                         | `auth:api`, `role:operator,admin` |
| GET    | `/api/v1/shipments/{id}`        | Konkreti siunta                      | vieša                           |
| GET    | `/api/v1/shipments/{id}/packages` | Konkrečios siuntos paketai         | `auth:api` (su JWT/refresh)     |
| POST   | `/api/v1/packages`              | Naujas paketas siuntai               | `auth:api`, `role:operator,admin` |
| GET    | `/api/v1/packages`              | Paketų sąrašas                       | vieša                           |

### 4.2. Pavyzdys: prisijungimas

**Užklausa**

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password"
}
