# Nitkowa Sztuka — Panel zamówień

Panel administracyjny do zarządzania zamówieniami w biznesie handmade. Marki, klienci, zamówienia ze śledzeniem statusów, statystyki finansowe i publiczne linki do podglądu zamówień dla klientów.

---

## Wymagania

- Node.js >= 20
- npm >= 10
- Baza PostgreSQL (zalecany [Neon](https://neon.tech) — darmowe konto)

---

## Pierwsze uruchomienie

### 1. Instalacja zależności

```bash
npm install --ignore-scripts
npx nuxt prepare
npx prisma generate
```

> Flaga `--ignore-scripts` zapobiega przedwczesnemu uruchomieniu `nuxt prepare` przed zakończeniem instalacji.

---

### 2. Baza danych (Neon PostgreSQL)

1. Utwórz konto na [neon.tech](https://neon.tech)
2. Utwórz nowy projekt i bazę danych
3. Skopiuj **Connection string** w formacie:
   ```
   postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
   ```

---

### 3. Plik `.env`

Skopiuj szablon i uzupełnij wartości:

```bash
cp .env.example .env
```

Edytuj `.env`:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require

# Wygeneruj losowy sekret (minimum 32 znaki):
# openssl rand -hex 32
NUXT_SESSION_PASSWORD=wklej-wygenerowany-sekret

# Hasło dla konta admin (używane tylko przez seed)
ADMIN_PASSWORD=twoje-haslo
```

---

### 4. Migracje bazy danych

```bash
npx prisma migrate dev --name init
```

---

### 5. Seed — dane początkowe

```bash
npm run db:seed
```

Tworzy:
- Konto administratora (login: `admin`, hasło = wartość `ADMIN_PASSWORD`)
- Markę „Nitkowa Sztuka"
- Domyślne metody dostawy
- Domyślne stawki podatkowe

---

### 6. Uruchomienie serwera deweloperskiego

```bash
npm run dev
```

Aplikacja dostępna pod: **http://localhost:3000**

Przekieruje automatycznie na stronę logowania. Zaloguj się danymi z seeda.

---

## Praca z bazą danych

```bash
# Nowa migracja po zmianie schema.prisma
npx prisma migrate dev --name nazwa-zmiany

# Regeneruj klienta Prisma po zmianie schema
npx prisma generate

# Przeglądarka danych (GUI)
npm run db:studio
```

---

## Pozostałe komendy

```bash
npm run build        # Budowanie do produkcji
npm run preview      # Podgląd buildu produkcyjnego
npx nuxi typecheck   # Sprawdzenie TypeScript (musi kończyć się Exit: 0)
```

---

## Deploy na Vercel

1. Wypchnij kod na GitHub
2. Połącz repozytorium w [Vercel Dashboard](https://vercel.com)
3. Ustaw zmienne środowiskowe w ustawieniach projektu:
   - `DATABASE_URL`
   - `NUXT_SESSION_PASSWORD`
4. Vercel automatycznie wykryje konfigurację Nuxt 3

> Po każdym deploymencie uruchom migracje ręcznie:
> ```bash
> DATABASE_URL="..." npx prisma migrate deploy
> ```
