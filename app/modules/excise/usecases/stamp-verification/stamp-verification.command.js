export class StampVerificationCommandService {
  constructor({ exciseCommandService }) {
    this.exciseCommandService = exciseCommandService;
  }

  createPublic = (req, body) =>
    this.exciseCommandService.createStampVerification(req, body, { isPublic: true });

  createOperator = (req, body) =>
    this.exciseCommandService.createStampVerification(req, body, { isPublic: false });
}

