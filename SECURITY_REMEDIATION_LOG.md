# Security Remediation Log / Registro de Remediación de Seguridad

**Lead Security Auditor & Hardener:** [Jon](https://www.linkedin.com/in/jonathan-flores-pt) — [Vanguard Crux](https://www.vanguardcrux.com)

## Audit & Hardening Summary / Resumen de Auditoría y Saneamiento

This document summarizes the security improvements applied to ClawSuite to ensure a production-ready environment.
Este documento resume las mejoras de seguridad aplicadas a ClawSuite para garantizar un entorno listo para producción.

---

### 1. Vulnerabilities from Previous Audit (Feb 23, 2026 - PDF) / Vulnerabilidades de Auditoría Previa
The following issues were identified in the internal PDF report and have been verified as correctly patched in the current codebase:
Los siguientes problemas fueron identificados en el reporte PDF interno y se han verificado como correctamente parchados en el código actual:

*   **API Auth Guard**: All sensitive Nitro backend routes are now protected by session tokens.
    *   *Auth Guard en API*: Todas las rutas sensibles de Nitro están protegidas por tokens de sesión.
*   **CSRF Protection**: Double-submit cookie pattern integrated into `requireAuth` for all mutating methods.
    *   *Protección CSRF*: Patrón double-submit cookie integrado en `requireAuth` para todos los métodos mutables.
*   **Path Traversal (Uploads)**: Implemented `ensureWorkspacePath` and filename sanitization to prevent unauthorized file access.
    *   *Path Traversal (Cargas)*: Implementación de `ensureWorkspacePath` y saneamiento de nombres para evitar acceso no autorizado.
*   **SSRF (Browser Navigation)**: Browser automation is now restricted to `http` and `https` protocols.
    *   *SSRF (Navegación)*: La automatización del navegador está restringida únicamente a protocolos `http` y `https`.
*   **Gateway Injection**: Sanitized gateway configuration parameters to prevent `.env` file tampering.
    *   *Inyección en Gateway*: Saneamiento de parámetros de configuración del gateway para evitar manipulación del archivo `.env`.

---

### 2. New Vulnerabilities Fixed (SAESRS Audit - Feb 2026) / Nuevas Vulnerabilidades Corregidas
The following critical gaps were identified during the recent SAESRS security audit and are now fully remediated:
Las siguientes brechas críticas fueron detectadas durante la reciente auditoría SAESRS y están ahora completamente remediadas:

*   **Terminal Sandbox Escape (CRITICAL)**: Implemented strict CWD validation. Terminal sessions are now locked to the `WORKSPACE_ROOT`.
    *   *Escape de Sandbox de Terminal (CRÍTICO)*: Validación estricta de CWD. Las sesiones de terminal ahora están bloqueadas al `WORKSPACE_ROOT`.
*   **Session Store DoS (HIGH)**: Migrated to a Map-based store with a 1000-session cap and 30-day automatic expiration (TTL) to prevent memory exhaustion.
    *   *DoS en Sesiones (ALTO)*: Migración a almacenamiento en Map con límite de 1000 sesiones y expiración automática de 30 días para evitar agotamiento de memoria.
*   **Rate Limit Bypass / IP Spoofing (HIGH)**: Hardened the rate limiter to ignore proxy headers (`X-Forwarded-For`) unless a `TRUSTED_PROXY_IP` is explicitly configured.
    *   *Bypass de Rate Limit / IP Spoofing (ALTO)*: Blindaje del rate limiter para ignorar cabeceras de proxy a menos que se configure un `TRUSTED_PROXY_IP`.
*   **Information Exposure (MEDIUM)**: Consolidated error handling to use `safeErrorMessage`, preventing internal server path leakage in API responses.
    *   *Exposición de Información (MEDIO)*: Consolidación del manejo de errores mediante `safeErrorMessage` para evitar fugas de rutas internas en las respuestas de la API.
*   **Plaintext Password Mitigation (MEDIUM)**: Added support for `PBKDF2` hashing via `CLAWSUITE_PASSWORD_HASH` to avoid storing passwords in plaintext.
    *   *Mitigación de Contraseñas en Texto Plano (MEDIO)*: Soporte para hashing `PBKDF2` mediante `CLAWSUITE_PASSWORD_HASH` para no guardar contraseñas en claro.

---

### 3. Recent Hardening (SAESRS Audit - Feb 25, 2026) / Saneamiento Reciente
The following improvements were added to further harden the system against advanced exploitation:
Las siguientes mejoras fueron añadidas para blindar aún más el sistema contra explotación avanzada:

*   **Glob ReDoS Protection (HIGH)**: Patched `src/routes/api/files.ts` to limit pattern complexity. Prevented CPU exhaustion from malicious glob inputs.
    *   *Protección contra ReDoS en Globs (ALTO)*: Parche en `src/routes/api/files.ts` para limitar la complejidad de patrones. Se previene el agotamiento de CPU por entradas de glob maliciosas.
*   **Enhanced Skill Evasion Detection (MEDIUM)**: Strengthened `SECURITY_PATTERNS` in `src/routes/api/skills.ts` to detect hex/unicode obfuscation and dynamic string manipulation for dangerous methods.
    *   *Detección de Evasión en Skills (MEDIO)*: Fortalecimiento de `SECURITY_PATTERNS` en `src/routes/api/skills.ts` para detectar ofuscación hex/unicode y manipulación dinámica de strings para métodos peligrosos.
*   **Terminal Sandbox Documentation (LOW)**: Added critical security warnings in `src/server/terminal-sessions.ts` regarding shell-level directory traversal risks.
    *   *Documentación de Sandbox de Terminal (BAJO)*: Adición de advertencias críticas en `src/server/terminal-sessions.ts` sobre riesgos de navegación fuera del directorio a nivel de shell.

---
**Latest Audit Date / Última Fecha de Auditoría:** Feb 25, 2026
**Methodology / Metodología:** SAESRS (Modern Offensive/Defensive Hybrid)
**Status / Estado:** Continuous Hardening / Saneamiento Continuo.

---
**Audit Date / Fecha de Auditoría:** Feb 24, 2026
**Methodology / Metodología:** SAESRS (Modern Offensive/Defensive Hybrid)
**Status / Estado:** All known high-severity issues remediated. / Todos los problemas conocidos de alta severidad remediados.
