/**
 * Query-side facade for auth use cases (read-only).
 */
export class AuthQueryService {
  /**
   * @param {{ authService: import('./auth.service.js').AuthService }} deps
   */
  constructor({ authService }) {
    this.authService = authService;
  }

  getCurrentUser = (req) => this.authService.getCurrentUser(req);

  health = () => this.authService.health();
}
