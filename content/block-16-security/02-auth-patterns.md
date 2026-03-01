---
title: "Authentication Patterns in Angular"
block: 16
topic: 2
slug: "auth-patterns"
difficulty: 4
sinceVersion: "2"
tags: ["JWT", "OAuth2", "OIDC", "route guards", "token interceptor", "refresh token", "silent refresh", "auth state"]
relatedTopics: ["xss-sanitization", "csp-csrf", "secure-coding", "http-client"]
interviewQuestions:
  - level: "junior"
    question: "Де безпечно зберігати JWT токен у Angular SPA і які є варіанти?"
    referenceAnswers:
      junior: "JWT можна зберігати у localStorage або cookie. localStorage простіший, cookie безпечніший якщо HttpOnly."
      mid: "JWT storage options: 1) localStorage: простий доступ, persists між tabs і sessions. Ризик: доступний через JS (XSS може вкрасти). 2) sessionStorage: лише поточний tab, не persists після закриття. Теж доступний через JS. 3) HttpOnly cookie: JS не може читати — XSS не вкраде token. Але: CSRF вразливість (потрібен CSRF token). 4) Memory (JS variable/signal): найбезпечніший від XSS. Але: втрата при page reload, не синхронізується між tabs."
      senior: "JWT storage trade-offs: 1) localStorage + XSS: якщо XSS можлива — localStorage storage = stolen token = account takeover. 2) HttpOnly cookie + CSRF: token недоступний JS, але browser автоматично надсилає при cross-site requests (CSRF). Рішення: SameSite=Strict cookie + CSRF token (double submit pattern). 3) Memory storage: token у Signal/service → reload = logout. Компроміс: short-lived access token у memory + long-lived refresh token у HttpOnly cookie. 4) Refresh token rotation: кожен use refresh token → new refresh token, old invalidated. Stolen refresh token детектується (two uses = invalidate all). 5) Security recommendation: HttpOnly, Secure, SameSite=Strict cookie для refresh token; memory для access token."
      staff: "Token storage at enterprise: 1) Threat model first: що ми захищаємо? Account takeover, data exfiltration, privilege escalation. 2) XSS vs CSRF: SPA-specific trade-off. Якщо strict CSP (no inline, nonce-based) — XSS risk знижується, localStorage більш acceptable. 3) Backend For Frontend (BFF) pattern: Angular → BFF (Node.js) → Resource API. BFF тримає tokens, Angular отримує session cookie. JS ніколи не бачить JWT. 4) Token binding: DPoP (Demonstration of Proof of Possession) — token прив'язаний до key pair клієнта, stolen token непридатний для зловмисника. 5) Short-lived tokens: access token 5-15 хв — window for stolen token мінімальний. 6) Device fingerprinting + token validation: додатковий сигнал для anomaly detection. 7) Monitoring: alert при token use від нового IP/device → force re-auth."
    commonMistakes:
      - "localStorage для refresh token — XSS = permanent account takeover"
      - "Не знають SameSite cookie attribute — CSRF vulnerability з cookies"
      - "Довгий expiry для access token (1 day+) — large stolen token window"
    relatedQuestions: ["b16t2q2", "b16t2q3"]
  - level: "mid"
    question: "Як реалізувати HTTP interceptor для автоматичного додавання JWT до запитів?"
    referenceAnswers:
      junior: "Interceptor — це клас що перехоплює всі HTTP запити. В ньому можна додати Authorization header з JWT."
      mid: "Functional interceptor (Angular 15+): `const authInterceptor: HttpInterceptorFn = (req, next) => { const token = inject(AuthService).getToken(); if (!token) return next(req); const authReq = req.clone({ setHeaders: { Authorization: 'Bearer ' + token } }); return next(authReq); }`. Реєстрація: `provideHttpClient(withInterceptors([authInterceptor]))`. Важливо: `req.clone()` — HTTP requests immutable. Не додавати токен до зовнішніх APIs (token leakage)."
      senior: "Auth interceptor production concerns: 1) Token leakage: додавати auth header лише до власних APIs: `if (!req.url.startsWith(environment.apiUrl)) return next(req)`. 2) Token expiry check до запиту: `if (isExpired(token)) → refresh first → then send`. 3) 401 handling: якщо запит повернув 401 → refresh token → retry original request. 4) Race condition: кілька паралельних 401 → кілька refresh requests. Рішення: BehaviorSubject/Promise для pending refresh — queued requests чекають refresh completion. 5) Refresh failure: refresh token теж expired → logout. 6) Retry: `catchError(err => err.status === 401 ? refreshAndRetry(req, next) : throwError(err))`. 7) Circular: AuthService.refresh() також HTTP request — не проходить через auth interceptor (або explicit skip через header/param)."
      staff: "Auth interceptor at scale: 1) Token refresh race condition solution: `private refreshing$ = new BehaviorSubject<boolean>(false)`. При першому 401: `refreshing$.next(true)` → refresh → `refreshing$.next(false)`. Інші запити: `refreshing$.pipe(filter(r => !r), take(1))` → wait → retry. 2) Retry mechanism: `switchMap(() => next(req.clone({ setHeaders: ... })))`. 3) Multiple token types: деякі endpoints потребують різні tokens (service account, impersonation). Interceptor logic: per-URL або per-header-hint. 4) Circuit breaker: якщо refresh fails N times → stop retrying → logout + redirect. 5) Monitoring: log token refresh events, 401 spike detection → alert. 6) E2E testing: mock interceptor у Playwright/Cypress для auth state. 7) Interceptor order: якщо кілька interceptors — порядок у `withInterceptors` array (FIFO). Auth interceptor першим або після logging."
    commonMistakes:
      - "Додають auth header до всіх URL включно з third-party — token leakage"
      - "Не вирішують race condition при паралельних 401 — N refresh requests"
      - "Refresh request сам проходить через auth interceptor — infinite loop"
    relatedQuestions: ["b16t2q1", "b16t2q3"]
  - level: "mid"
    question: "Як реалізувати route guard для захисту роутів з redirectUrl після логіну?"
    referenceAnswers:
      junior: "CanActivate guard перевіряє чи авторизований користувач. Якщо ні — редиректить на /login."
      mid: "Functional guard (Angular 15+): `export const authGuard: CanActivateFn = (route, state) => { const auth = inject(AuthService); if (auth.isLoggedIn()) return true; inject(Router).navigate(['/login'], { queryParams: { returnUrl: state.url } }); return false; }`. ReturnUrl: зберегти state.url у queryParams. Після логіну: `this.router.navigateByUrl(this.route.snapshot.queryParams['returnUrl'] || '/')`. Роль guard: декларативний захист у route config."
      senior: "Route guard production patterns: 1) Auth guard + permissions: CanActivate перевіряє auth, CanActivateChild для nested routes. 2) Permission-based guard: `const permissionGuard = (required: Permission): CanActivateFn => (route, state) => inject(PermissionsService).hasPermission(required) ? true : inject(Router).createUrlTree(['/forbidden'])`. 3) returnUrl sanitization: `returnUrl` не повинен містити external URLs — `if (!returnUrl.startsWith('/')) returnUrl = '/'`. 4) returnUrl encoding: URL з queryParams — encode: `encodeURIComponent(state.url)`. 5) Guard composition: кілька guards через array у route config. Angular 15+ `CanActivateFn` може бути composed. 6) Lazy guards: `canActivate: [() => import('./auth.guard').then(m => m.authGuard)]` — lazy-loaded guard. 7) Resolve guards: prefetch data до navigation, redirect якщо дані недоступні."
      staff: "Route guard architecture: 1) Guard тільки перевіряє — не завантажує дані (це Resolver). 2) Auth state у Guard: inject AuthService (signal-based). Guard reactive до state changes? Ні — guard виконується при navigation, не при state change. 3) Token refresh у guard: якщо token expired — refresh перед navigation. `canActivate` може повертати `Observable<boolean>` — async guard. 4) Multi-tenant: guard перевіряє tenant-specific permissions, не лише global auth. 5) Guard testing: TestBed + RouterTestingHarness (Angular 16+). `RouterTestingHarness.navigateByUrl('/protected')` → check redirect. 6) Defense: guard = first line. Server-side authorization = always required. Guard — UX, сервер — security. 7) Guard з NgRx: `store.select(selectIsAuthenticated)` у guard — reactive, але перший emission must happen synchronously або use `take(1)`."
    commonMistakes:
      - "returnUrl без validation — open redirect vulnerability"
      - "Покладаються тільки на guard без server-side authorization"
      - "Клас CanActivate замість функціонального guard (deprecated pattern)"
    relatedQuestions: ["b16t2q2", "b16t2q4"]
  - level: "senior"
    question: "Як реалізувати OAuth2/OIDC flow у Angular SPA і що таке silent refresh?"
    referenceAnswers:
      junior: "OAuth2 — стандарт для авторизації. Angular використовує redirect до auth server, отримує token, зберігає його. Silent refresh — автоматичне оновлення token у фоні."
      mid: "OAuth2 Authorization Code Flow + PKCE (для SPAs): 1) Redirect до authorization server з code_challenge (PKCE). 2) User логіниться, сервер redirect back з authorization code. 3) SPA exchange code → access + refresh tokens (PKCE verifies). 4) `angular-oauth2-oidc` або `@auth0/auth0-angular` lib. Silent refresh: hidden iframe → authorization server session → new token без user interaction. Або: refresh token rotation. OIDC: extension OAuth2 — ID token (JWT з user info)."
      senior: "OAuth2 PKCE деталі: 1) PKCE (Proof Key for Code Exchange): генерується `code_verifier` (random), `code_challenge = BASE64URL(SHA256(code_verifier))`. Auth server зберігає challenge, перевіряє verifier при token exchange. Запобігає authorization code interception. 2) `angular-oauth2-oidc`: `OAuthService.configure()`, `initCodeFlow()`, `silentRefresh()`. 3) Silent refresh через iframe: `<iframe src='auth-server?prompt=none&...'>` → якщо session активна → postMessage з token. 4) Silent refresh failure: session expired → frame → login_required error → force login. 5) Token storage у `angular-oauth2-oidc`: за замовчуванням localStorage — можна override до sessionStorage або memory. 6) OIDC discovery: `loadDiscoveryDocumentAndTryLogin()` — auto-configure endpoints з `/.well-known/openid-configuration`. 7) Post-logout: `OAuthService.logOut()` → OIDC end_session_endpoint."
      staff: "OAuth2 enterprise implementation: 1) Library choice: `angular-oauth2-oidc` vs `@auth0/auth0-angular` vs custom. Auth0: managed OIDC, add-ons (MFA, anomaly detection). angular-oauth2-oidc: self-hosted, більш control. 2) BFF (Backend For Frontend): redirect flow goes through BFF — tokens never in SPA JS. BFF implements OIDC callback, sets HttpOnly cookie. Angular завантажуєт session через BFF. 3) Token binding: DPoP binding — access token прив'язаний до key pair. 4) Multi-IDP: кілька identity providers (corporate AD + Google). Federated identity у auth server. 5) Refresh token rotation at scale: якщо refresh stolen і used before legitimate user → rotation detects → invalidate all tokens для user → security alert. 6) OIDC Backchannel Logout: server-to-server logout notification. SPA не потребує page reload для logout sync. 7) Claims-based authorization: Angular reads ID token claims (roles, permissions). Server validates same claims. Sync між auth server і app server claims schemas."
    commonMistakes:
      - "Implicit flow замість Authorization Code + PKCE для SPA — security downgrade"
      - "Silent refresh не обробляє failure — token expiry = silent logout"
      - "ID token для API authorization замість access token"
    relatedQuestions: ["b16t2q3", "b16t2q5"]
  - level: "staff"
    question: "Як управляти auth state у Angular додатку з signals і що відбувається при logout?"
    referenceAnswers:
      junior: "AuthService зберігає стан авторизації. Logout очищає токен і redirect на /login."
      mid: "Signal-based AuthService: `private _user = signal<User | null>(null); readonly user = this._user.asReadonly(); readonly isLoggedIn = computed(() => this._user() !== null)`. Logout: `clearTokens(), _user.set(null), router.navigate(['/login'])`. Components реактивно оновлюються через computed signals."
      senior: "Auth state lifecycle: 1) Bootstrap: `APP_INITIALIZER` → `AuthService.initialize()` → verify token validity → restore user state від stored token. 2) Token refresh: interceptor 401 → refresh → update token → update `_user` signal. 3) Logout: a) Clear tokens (memory + cookies). b) Call OIDC `end_session_endpoint` (revocation). c) `_user.set(null)`. d) Clear sensitive app state (NgRx clear actions). e) Navigate to /login. f) BroadcastChannel → notify other tabs. 4) Session expiry: `setInterval` check token expiry → pre-emptive refresh або force logout. 5) Cross-tab sync: `BroadcastChannel('auth')` → logout у одному tab → інші tabs logout. 6) App state cleanup при logout: NgRx dispatch LOGOUT action → all reducers handle → clear cached data."
      staff: "Enterprise auth state management: 1) AUTH_STATE as discriminated union: `type AuthState = { status: 'loading' } | { status: 'authenticated'; user: User; token: string } | { status: 'unauthenticated' } | { status: 'error'; error: string }`. 2) Signal store для auth: `signalStore(withState<AuthState>({ status: 'loading' }), withMethods(...))`. 3) APP_INITIALIZER для hydration: відновити auth state до першого render — prevent flash of unauthorized content. 4) Token expiry handling: `toObservable(authState)` + `switchMap` до timer → refresh або logout. 5) Partial logout (single-sign-out): logout від одного app → notify auth server → backchannel logout → all apps get logout notification. 6) Audit trail: кожен login, logout, token refresh — server-side log. Suspicious patterns → alert. 7) Re-auth flow: sensitive operations (change password, payment) → require fresh auth despite valid session. 8) Permission change propagation: якщо user permissions змінились на сервері → how does SPA know? WebSocket notification або periodic permission check."
    commonMistakes:
      - "Не очищають app state при logout — наступний user може бачити попереднього дані"
      - "Не синхронізують logout між tabs — stale authenticated state у інших tabs"
      - "Не revoke token на сервері при logout — token залишається валідним"
    relatedQuestions: ["b16t2q4", "b16t2q2"]
---

## Core Concept

**English definition:** Authentication patterns in Angular SPAs encompass secure token storage strategies, HTTP interceptors for bearer token attachment, OAuth2/OIDC flows for federated identity, reactive auth state management, and route guards for access control.

**Пояснення:** Аутентифікація у Angular SPA — це набір рішень: де зберігати токен (localStorage vs HttpOnly cookie), як автоматично додавати його до запитів (interceptor), як реалізувати OAuth2/OIDC flow (Authorization Code + PKCE), як оновлювати токен у фоні (refresh token rotation або silent refresh), і як будувати реактивний auth state (signals). Кожне рішення має security trade-offs.

**Яку проблему вирішує:** SPA не має "sessions" як traditional web app — немає server-side state. JWT або opaque tokens несе state на клієнті. Проблема: де безпечно зберігати токен (XSS vs CSRF), як автоматично надсилати з кожним запитом, як оновлювати без повторного логіну, як синхронізувати auth стан між компонентами.

**Як працює під капотом:** JWT: Base64URL encoded header.payload.signature. Signature validates за допомогою secret (HMAC) або key pair (RSA/ECDSA). Angular interceptor: `HttpClient` pipeline → interceptors chain → request modified → HTTP send. OAuth2 PKCE: `code_verifier` (random 43-128 chars) → `code_challenge = BASE64URL(SHA256(verifier))` → auth server stores challenge → exchange code with verifier → server verifies SHA256(verifier) === stored challenge. Silent refresh via hidden iframe: iframe loads auth page з `prompt=none` → якщо valid session → auth server redirect з token → iframe `postMessage` до parent.

**Trade-offs та обмеження:** localStorage: простий але XSS-vulnerable. HttpOnly cookie: безпечний від XSS але CSRF-vulnerable без SameSite. Memory: найбезпечніший але втрачається при reload. Short-lived access token у memory + HttpOnly refresh token = optimal для більшості SPAs. BFF pattern елімінує JS token exposure повністю але додає infrastructure.

**Версійність:** Functional guards (`CanActivateFn`) — Angular 14+. `inject()` у interceptors — Angular 14+. Functional interceptors (`HttpInterceptorFn`) — Angular 15+. `provideHttpClient(withInterceptors([...]))` — Angular 15+. Signal-based auth state — Angular 16+. `APP_INITIALIZER` з `inject()` — Angular 14+.

## Deep Details

### Edge Cases

**Race condition у token refresh:** 3 паралельні HTTP запити отримали 401 → 3 refresh requests → лише один успішний, інші fail. Рішення: `BehaviorSubject<boolean>` як mutex — перший 401 починає refresh (`next(true)`), решта чекають (`filter(isRefreshing => !isRefreshing)`). Після refresh — retry.

**returnUrl open redirect:** `returnUrl` у query param може бути `https://evil.com`. `router.navigateByUrl(returnUrl)` → redirect до evil.com. Завжди validate: `if (!returnUrl.startsWith('/')) returnUrl = '/'`.

**Token refresh circular dependency:** `AuthService.refreshToken()` викликає `HttpClient.post('/auth/refresh')` → auth interceptor додає Authorization header → але це refresh endpoint → потрібен refresh token, не access token. Рішення: conditional в interceptor — skip auth header для refresh endpoint.

**Silent refresh third-party cookies:** Safari ITP (Intelligent Tracking Prevention) та Chrome cookie deprecation блокують third-party cookies. Silent refresh через iframe не працює якщо auth server на іншому домені. Альтернатива: refresh token rotation замість silent refresh через iframe.

### Junior vs Senior Understanding

**Junior** знає що interceptor додає Authorization header і є route guard.

**Senior** розуміє: 1) Конкретний race condition pattern і його рішення через BehaviorSubject mutex. 2) PKCE mechanics і чому Implicit Flow deprecated. 3) Token storage threat model (XSS vs CSRF trade-off). 4) BFF pattern як найбезпечніший підхід. 5) Cross-tab logout через BroadcastChannel. 6) returnUrl sanitization проти open redirect. 7) APP_INITIALIZER для auth state hydration перед першим render.

### Deprecation & Migration Path

**Class-based `CanActivate`:** Deprecated Angular 15.2. Міграція: `class AuthGuard implements CanActivate { canActivate() { ... } }` → `export const authGuard: CanActivateFn = (route, state) => { ... }`. **Class-based `HttpInterceptor`:** `class AuthInterceptor implements HttpInterceptor { intercept() }` → `const authInterceptor: HttpInterceptorFn = (req, next) => { }`. Реєстрація: `HTTP_INTERCEPTORS` provide token → `withInterceptors([])`. **Implicit OAuth2 Flow:** Deprecated у OAuth 2.1. Всі SPAs мають використовувати Authorization Code + PKCE. **`OAuthService.loadDiscoveryDocumentAndLogin()` (angular-oauth2-oidc):** Замінено на `initCodeFlow()` + `loadDiscoveryDocumentAndTryLogin()`.

### Connections to Other Concepts

- **HTTP Interceptors (Block 8):** Технічна основа для auth token injection.
- **XSS Sanitization (Block 16, Topic 1):** XSS може вкрасти tokens — HttpOnly cookies захищають.
- **CSP & CSRF (Block 16, Topic 3):** CSRF protection для cookie-based auth.
- **Route Guards (Block 6):** Navigation-level access control.

## Examples

### Basic Usage

```typescript
// Signal-based AuthService
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

export interface User {
  id: string;
  email: string;
  roles: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);

  // Private mutable signal — auth state
  private _user = signal<User | null>(null);
  private _token = signal<string | null>(null);

  // Public readonly signals
  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);
  readonly isAdmin = computed(() => this._user()?.roles.includes('admin') ?? false);

  setAuth(user: User, token: string): void {
    this._user.set(user);
    this._token.set(token);
  }

  logout(): void {
    this._user.set(null);
    this._token.set(null);
    // Notify other tabs
    new BroadcastChannel('auth').postMessage({ type: 'logout' });
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this._token();
  }
}

// Functional auth guard з returnUrl
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return true;
  }

  // Sanitize returnUrl — prevent open redirect
  const returnUrl = state.url.startsWith('/') ? state.url : '/';
  return router.createUrlTree(['/login'], { queryParams: { returnUrl } });
};
```

### Production Scenario

```typescript
// Functional HTTP interceptor з refresh token і race condition handling
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, throwError, EMPTY } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { TokenRefreshService } from './token-refresh.service';
import { environment } from '../environments/environment';

// Shared state for refresh mutex — outside interceptor function (singleton)
const isRefreshing$ = new BehaviorSubject<boolean>(false);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const refreshService = inject(TokenRefreshService);

  // Skip: non-API requests або refresh endpoint itself (prevents circular)
  if (!req.url.startsWith(environment.apiUrl) || req.url.includes('/auth/refresh')) {
    return next(req);
  }

  const token = auth.getToken();
  const authReq = token ? addToken(req, token) : req;

  return next(authReq).pipe(
    catchError(err => {
      if (err.status === 401) {
        return handle401(req, next, auth, refreshService);
      }
      return throwError(() => err);
    })
  );
};

function addToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
}

function handle401(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  auth: AuthService,
  refreshService: TokenRefreshService
) {
  if (isRefreshing$.getValue()) {
    // Інший запит вже refreshing — чекаємо завершення
    return isRefreshing$.pipe(
      filter(refreshing => !refreshing),
      take(1),
      switchMap(() => {
        const newToken = auth.getToken();
        return newToken ? next(addToken(req, newToken)) : EMPTY;
      })
    );
  }

  // Перший 401 — починаємо refresh
  isRefreshing$.next(true);

  return refreshService.refresh().pipe(
    switchMap(({ token, user }) => {
      auth.setAuth(user, token);
      isRefreshing$.next(false);
      return next(addToken(req, token));
    }),
    catchError(err => {
      isRefreshing$.next(false);
      auth.logout(); // Refresh failed — force logout
      return throwError(() => err);
    })
  );
}

// APP_INITIALIZER — відновлення auth state до першого render
import { APP_INITIALIZER, Provider } from '@angular/core';

export function provideAuthInitializer(): Provider {
  return {
    provide: APP_INITIALIZER,
    useFactory: () => {
      const auth = inject(AuthService);
      const http = inject(HttpClient);

      return () => http.get<{ user: User; token: string }>('/api/auth/me').pipe(
        tap(({ user, token }) => auth.setAuth(user, token)),
        catchError(() => {
          // Not authenticated — OK, proceed
          return EMPTY;
        })
      ).toPromise();
    },
    multi: true,
  };
}
```

### Anti-Example

```typescript
// ❌ Race condition — кілька parallel refresh requests
export const badAuthInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError(err => {
      if (err.status === 401) {
        // Кожен з 5 паралельних 401 запустить refreshToken()
        // Лише перший буде успішним, 4 інші fail
        // Результат: logged out при transient 401
        return inject(AuthService).refreshToken().pipe(
          switchMap(token => next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })))
        );
      }
      return throwError(() => err);
    })
  );
};

// ❌ returnUrl open redirect
@Component({ template: '' })
export class LoginComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  onLogin() {
    const returnUrl = this.route.snapshot.queryParams['returnUrl'];
    // ❌ Redirect до будь-якого URL включно з external
    // Attacker: /login?returnUrl=https://evil.com → redirect після login
    this.router.navigateByUrl(returnUrl || '/');
  }
}

// ❌ Token у localStorage без XSS consideration
@Injectable({ providedIn: 'root' })
export class UnsafeAuthService {
  saveToken(token: string): void {
    localStorage.setItem('jwt', token); // ❌ XSS вкраде token
  }
  getToken(): string | null {
    return localStorage.getItem('jwt');
  }
}
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| Refresh token у localStorage | XSS → stolen refresh token → permanent account takeover | HttpOnly, Secure, SameSite=Strict cookie для refresh token |
| Auth interceptor без race condition handling | Паралельні 401 → N refresh requests → лише 1 успішний → logout | BehaviorSubject mutex: перший 401 refreshes, решта чекають |
| returnUrl без sanitization проти external URLs | Open redirect: `?returnUrl=https://evil.com` після login | `if (!returnUrl.startsWith('/')) returnUrl = '/'` |
| Refresh endpoint проходить через auth interceptor | Circular loop: refresh → 401 → refresh → ∞ | Skip auth header для `/auth/refresh` URL у interceptor |
| Logout без очищення app state і token revocation | Наступний user бачить попередні дані; stolen token залишається валідним | Clear NgRx/signal state + revoke token on server + BroadcastChannel |

## Interview Block

### [L1 — Warm-up] Де безпечно зберігати JWT у Angular SPA?

**Signal being tested:** Розуміння XSS vs CSRF trade-off у token storage і security model кожного варіанту.

**What the interviewer expects:** Не просто "localStorage погано". Конкретний trade-off: localStorage=XSS риск, cookie=CSRF риск, memory=reload logout.

**How to probe deeper:** "Якщо зберігаємо токен у HttpOnly cookie — яка нова загроза з'являється і як її вирішити?"

**Reference answer:** localStorage: доступний через JS → XSS краде token. HttpOnly cookie: JS не може читати → XSS захищений. Але: browser auto-sends cookies → CSRF. Рішення: SameSite=Strict + CSRF token. Optimal: short-lived access token у memory + refresh token у HttpOnly cookie. BFF pattern: token ніколи у SPA.

**Common mistakes:** Думають localStorage завжди поганий незалежно від контексту. Не знають SameSite cookie attribute.

---

### [L2 — Mid] Як реалізувати HTTP interceptor для JWT і як вирішити race condition при 401?

**Signal being tested:** Практичне розуміння interceptor implementation і конкретного race condition паттерну.

**What the interviewer expects:** Функціональний interceptor, req.clone(), conditional для non-API URLs, BehaviorSubject mutex для 401.

**How to probe deeper:** "Два паралельних HTTP запити повернули 401 одночасно. Що відбудеться без race condition handling?"

**Reference answer:** `HttpInterceptorFn`, `req.clone({ setHeaders: ... })`. Пропускаємо non-API і `/auth/refresh` URLs. 401: `isRefreshing$` BehaviorSubject — якщо `true` → queue via `filter(!isRefreshing)` → retry після refresh. Перший 401 → `isRefreshing$.next(true)` → refresh → `next(false)` → всі queued retried.

**Common mistakes:** Без mutex — N refresh requests при N parallel 401s. Refresh endpoint через interceptor — circular loop.

---

### [L3 — Senior] Як реалізувати OAuth2 PKCE flow у Angular і що таке silent refresh?

**Signal being tested:** Розуміння Authorization Code + PKCE mechanics і чому Implicit Flow deprecated для SPAs.

**What the interviewer expects:** code_verifier/code_challenge, angular-oauth2-oidc або auth0, silent refresh через iframe, third-party cookie проблема.

**How to probe deeper:** "Silent refresh через iframe перестав працювати у Safari. Яка альтернатива?"

**Reference answer:** PKCE: random `code_verifier` → `SHA256 → code_challenge`. Auth server stores challenge, verifies при token exchange → prevents code interception. `angular-oauth2-oidc`: `initCodeFlow()` + `loadDiscoveryDocumentAndTryLogin()`. Silent refresh: hidden iframe → `prompt=none` → якщо session active → new token через postMessage. Safari ITP блокує third-party cookies → silent refresh fails → альтернатива: refresh token rotation.

**Common mistakes:** Implicit flow (deprecated). Не обробляють silent refresh failure. ID token для API auth замість access token.

---

### [L4 — Staff/Principal] Як організувати auth state management з signals і що відбувається при logout?

**Signal being tested:** Системне мислення про auth lifecycle, cross-tab sync, app state cleanup і security implications.

**What the interviewer expects:** Signal store для auth state, APP_INITIALIZER, BroadcastChannel, NgRx LOGOUT action, token revocation.

**How to probe deeper:** "User залогінений у 3 tabs. Logout у одному tab. Як інші два реагують?"

**Reference answer:** Signal-based AuthService: `_user = signal<User|null>(null)`, `isLoggedIn = computed(...)`. APP_INITIALIZER: відновити state з `/api/auth/me` до першого render. Logout: clear tokens → revoke на сервері → `_user.set(null)` → NgRx LOGOUT action (clear caches) → BroadcastChannel `postMessage({type:'logout'})` → інші tabs слухають і logout синхронно.

**Common mistakes:** Не очищають app state — наступний user бачить дані попереднього. Не revoke token. Без cross-tab sync.

## Summary

### Key Points

- Optimal token storage: short-lived access token у memory + long-lived refresh token у HttpOnly cookie (захист і від XSS і від CSRF)
- Auth interceptor: `HttpInterceptorFn`, `req.clone()`, skip non-API і refresh endpoints, BehaviorSubject mutex для race condition
- Route guard: functional `CanActivateFn`, returnUrl sanitization (лише `/`-started paths), server-side auth обов'язкова
- OAuth2 Authorization Code + PKCE: стандарт для SPAs; Implicit Flow deprecated у OAuth 2.1
- Silent refresh через iframe: проблема з Safari ITP та Chrome → refresh token rotation як альтернатива
- Logout lifecycle: token revocation → clear signals/NgRx → BroadcastChannel для cross-tab sync
- APP_INITIALIZER: відновити auth state до першого render — prevent flash of unauthorized content

### Elevator Pitch (2 minutes)

Auth у Angular SPA: токен у memory (XSS захищений) + refresh token у HttpOnly cookie (JS не читає). Interceptор автоматично додає Bearer header до API requests, обробляє 401 з BehaviorSubject mutex проти race conditions при паралельних refresh. OAuth2 flow: Authorization Code + PKCE (не Implicit — deprecated) через `angular-oauth2-oidc`, silent refresh через iframe або refresh token rotation. Auth state як signal store: `isLoggedIn = computed(() => user() !== null)`, реактивно оновлює UI. APP_INITIALIZER відновлює session до першого render. Logout: revoke token → clear state → BroadcastChannel синхронізує інші tabs. Route guards (функціональний `CanActivateFn`) + server-side authorization — два незалежних шари захисту.
