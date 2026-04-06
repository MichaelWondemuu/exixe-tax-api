/**
 * Command-side facade for auth use cases (mutations / side effects).
 */
export class AuthCommandService {
  constructor({ authService }) {
    this.authService = authService;
  }

  login = (loginData) => this.authService.login(loginData);

  sendOtp = (payload) => this.authService.sendOtp(payload);

  resetPassword = (payload) => this.authService.resetPassword(payload);

  refreshToken = (refreshTokenString) =>
    this.authService.refreshToken(refreshTokenString);

  logout = (req) => this.authService.logout(req);

  completeLoginWithMfa = (mfaData) =>
    this.authService.completeLoginWithMfa(mfaData);

  updatePassword = (req, userId, password) =>
    this.authService.updatePassword(req, userId, password);

  unbanLoginClient = (req, phone) =>
    this.authService.unbanLoginClient(req, phone);
}
