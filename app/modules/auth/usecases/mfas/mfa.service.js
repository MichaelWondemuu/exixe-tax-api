import { MfaCommandService } from './mfa.command.js';

/**
 * Facade used by AuthService for login-time MFA (check / send / verify).
 * Implementation lives on {@link MfaCommandService}.
 */
export class MfaService {
  constructor(deps) {
    const command = new MfaCommandService(deps);
    this.checkMfaStatus = command.checkMfaStatus.bind(command);
    this.sendSmsOtp = command.sendSmsOtp.bind(command);
    this.verifySmsOtp = command.verifySmsOtp.bind(command);
    this.verifyTotp = command.verifyTotp.bind(command);
  }
}
