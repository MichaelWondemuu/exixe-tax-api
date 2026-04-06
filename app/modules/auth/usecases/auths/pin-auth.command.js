/**
 * Command-side facade for PIN auth use cases (mutations / verification flows).
 */
export class PinAuthCommandService {
  constructor({ pinAuthService }) {
    this.pinAuthService = pinAuthService;
  }

  verifyPin = (req, userId, pin) =>
    this.pinAuthService.verifyPin(req, userId, pin);

  setPin = (req, userId, pin, oldPin) =>
    this.pinAuthService.setPin(req, userId, pin, oldPin);
}
