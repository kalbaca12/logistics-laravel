## Aplinka

- PHP 8.2+
- Composer
- Laravel (projektas jau paruoštas)
- DB: SQLite

## Startas

```bash
composer install
copy .env.example .env
php artisan key:generate
php artisan jwt:secret --force
mkdir database 2>$null
type NUL > database\database.sqlite

# DB_CONNECTION=sqlite
# DB_DATABASE=database/database.sqlite
# CACHE_DRIVER=file
# SESSION_DRIVER=file
# QUEUE_CONNECTION=sync

php artisan config:clear

php artisan migrate --seed

php artisan serve
```

## Autentifikacija

- Prisijungimas grąžina **JWT**.
- Protected maršrutai naudoja `jwt.auth` (o rolės tikrinamos `role:...` vidiniu middleware).

## Postman

Importuokite:
- Kolekciją: **Logistics_API_Lab1_FULL_with_tests.postman_collection.json**
- Aplinką: **Logistics_API_Local_with_tests.postman_environment.json**

Paleidimo seka:
1. **Auth/Register** (sugeneruoja `EMAIL` jei tuščias) → **201/422**
2. **Auth/Login** (išsaugo `ACCESS_TOKEN`) → **200**
3. **Auth/Me** → **200**
4. **Warehouses/Create** → **201** (jei role=admin) / **403** (jei ne)
5. **Negative**: 404, 422, 401 testai

## OpenAPI specifikacija

Failas: `openapi.yaml`

https://editor.swagger.io

## Greita demonstracija

1. `GET /api/v1/ping` → **200**
2. `POST /api/v1/auth/register` → **201**
3. `POST /api/v1/auth/login` → **200** (išsaugomas token)
4. `GET /api/v1/auth/me` → **200**
5. `GET /api/v1/admin-only` → **403** (kol ne admin)
6. (pasikeliame rolę į `admin`, arba registracijos metu paduodame `"role":"admin"`)
7. `POST /api/v1/warehouses` → **201**
8. `GET /api/v1/warehouses` → **200**
9. `GET /api/v1/warehouses/{id}` → **200**
10. `PUT /api/v1/warehouses/{id}` → **200**
11. `DELETE /api/v1/warehouses/{id}` → **204**
12. `GET /api/v1/warehouses/999999` → **404**
13. `POST /api/v1/auth/register` (dupl. email) → **422**
14. `POST /api/v1/auth/logout` → **200/204**
15. Vėl **GET /api/v1/auth/me** (su senu token) → **401**

## Teisingi statusai

- **201** – resursas sukurtas
- **200** – sėkminga užklausa
- **204** – sėkmingas ištrynimas (be body)
- **401** – neprisijungęs / neteisingas tokenas
- **403** – prisijungęs, bet neturi teisės
- **404** – nerasta
- **422** – blogas payload (validation)
- **405** – neteisingas HTTP metodas

## Struktūra (svarbiausi failai)

- `routes/api.php` – maršrutai (JWT + rolės)
- `app/Http/Controllers/*Controller.php` – CRUD logika
- `app/Http/Middleware/RoleMiddleware.php` – rolės tikrinimas (401 jei neprisijungęs, 403 jei rolė neteisinga)
- `bootstrap/app.php` – nuosekli JSON klaidų grąža API keliams
- `openapi.yaml` – OpenAPI specifikacija (visi metodai)

---
