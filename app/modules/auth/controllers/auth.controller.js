export class AuthController {
  constructor({ authQueryService, authCommandService }) {
    this.authQueryService = authQueryService;
    this.authCommandService = authCommandService;
  }

  login = async (req, res) => {
    const response = await this.authCommandService.login(req.body);
    res.json(response);
  };

  sendOtp = async (req, res) => {
    const response = await this.authCommandService.sendOtp(req.body);
    res.json(response);
  };

  resetPassword = async (req, res) => {
    const response = await this.authCommandService.resetPassword(req.body);
    res.json(response);
  };

  refreshToken = async (req, res) => {
    const refreshTokenString = req.body.refreshToken;
    const response = await this.authCommandService.refreshToken(
      refreshTokenString,
    );
    res.json(response);
  };

  getCurrentUser = async (req, res) => {
    const response = await this.authQueryService.getCurrentUser(req);
    res.json(response);
  };

  logout = async (req, res) => {
    const response = await this.authCommandService.logout(req);
    res.json(response);
  };

  completeLoginWithMfa = async (req, res, next) => {
    try {
      const response = await this.authCommandService.completeLoginWithMfa(
        req.body,
      );
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  updatePassword = async (req, res, next) => {
    try {
      const userId = req.params.id;
      const password = req.body.password;
      const response = await this.authCommandService.updatePassword(
        req,
        userId,
        password,
      );
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  unbanLoginClient = async (req, res, next) => {
    try {
      const response = await this.authCommandService.unbanLoginClient(
        req,
        req.body?.phone,
      );
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  health = async (req, res, next) => {
    try {
      const response = await this.authQueryService.health();
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
