import { HttpError } from '../../../../shared/utils/http-error.js';
import { sequelize } from '../../../../shared/db/database.js';

function buildReferenceNo() {
  const ts = Date.now();
  const rnd = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `PD-${ts}-${rnd}`;
}

export class PredeclarationCommandService {
  /**
   * @param {{
   *   predeclarationRepository: import('../../repository/predeclaration.repository.js').PredeclarationRepository;
   * }} deps
   */
  constructor({ predeclarationRepository }) {
    this.predeclarationRepository = predeclarationRepository;
  }

  normalizeItem = (item) => ({
    productId: item.productId,
    productVariantId: item.productVariantId || null,
    quantity: Number(item.quantity),
    unitValueSnapshot:
      item.unitValueSnapshot !== undefined && item.unitValueSnapshot !== null
        ? Number(item.unitValueSnapshot)
        : null,
    sellingPriceSnapshot:
      item.sellingPriceSnapshot !== undefined && item.sellingPriceSnapshot !== null
        ? Number(item.sellingPriceSnapshot)
        : null,
    remarks: item.remarks?.trim() || null,
  });

  ensureDraft = (row) => {
    if (row.status !== 'DRAFT') {
      throw new HttpError(
        409,
        'PREDECLARATION_NOT_EDITABLE',
        `Predeclaration is ${row.status} and cannot be modified`,
      );
    }
  };

  validateItems = async (items = []) => {
    if (!Array.isArray(items) || items.length === 0) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'At least one predeclaration item is required',
      );
    }

    const itemModel = this.predeclarationRepository.getItemModel();
    const variantModel = this.predeclarationRepository.getVariantModel();

    for (const rawItem of items) {
      const item = this.normalizeItem(rawItem);
      if (!item.productId) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'item.productId is required');
      }
      if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
        throw new HttpError(
          400,
          'VALIDATION_ERROR',
          'item.quantity must be greater than 0',
        );
      }
      if (item.productVariantId) {
        const variant = await variantModel.findOne({
          where: { id: item.productVariantId, productId: item.productId },
          attributes: ['id', 'unitValue', 'sellingPrice'],
        });
        if (!variant) {
          throw new HttpError(
            400,
            'VALIDATION_ERROR',
            `variant ${item.productVariantId} does not belong to product ${item.productId}`,
          );
        }
      }
    }

    return itemModel;
  };

  createPredeclaration = async (req, body) => {
    const declarationDate = body?.declarationDate;
    if (!declarationDate) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'declarationDate is required',
      );
    }
    const itemModel = await this.validateItems(body?.items || []);

    const row = await sequelize.transaction(async (transaction) => {
      const created = await this.predeclarationRepository.getModel().create(
        {
          organizationId: req.organizationId || req['organizationId'],
          referenceNo: buildReferenceNo(),
          declarationDate,
          status: 'DRAFT',
          remarks: body?.remarks?.trim() || null,
        },
        { transaction },
      );

      const items = body.items.map((item) => {
        const normalized = this.normalizeItem(item);
        return {
          predeclarationId: created.id,
          ...normalized,
        };
      });
      await itemModel.bulkCreate(items, { transaction });
      return created;
    });

    return this.predeclarationRepository.findByIdDetailed(req, row.id);
  };

  updatePredeclaration = async (req, id, body) => {
    const current = await this.predeclarationRepository.findByIdDetailed(req, id);
    if (!current) {
      throw new HttpError(404, 'NOT_FOUND', 'Predeclaration not found');
    }
    this.ensureDraft(current);

    const declarationDate = body?.declarationDate;
    if (!declarationDate) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'declarationDate is required',
      );
    }

    const itemModel = await this.validateItems(body?.items || []);
    await sequelize.transaction(async (transaction) => {
      await this.predeclarationRepository.getModel().update(
        {
          declarationDate,
          remarks: body?.remarks?.trim() || null,
        },
        { where: { id }, transaction },
      );
      await itemModel.destroy({ where: { predeclarationId: id }, transaction });
      await itemModel.bulkCreate(
        body.items.map((item) => ({
          predeclarationId: id,
          ...this.normalizeItem(item),
        })),
        { transaction },
      );
    });

    return this.predeclarationRepository.findByIdDetailed(req, id);
  };

  deletePredeclaration = async (req, id) => {
    const current = await this.predeclarationRepository.findByIdDetailed(req, id);
    if (!current) {
      throw new HttpError(404, 'NOT_FOUND', 'Predeclaration not found');
    }
    this.ensureDraft(current);
    await this.predeclarationRepository.delete(req, id);
    return { message: 'Predeclaration deleted successfully' };
  };

  submitPredeclaration = async (req, id) => {
    const current = await this.predeclarationRepository.findByIdDetailed(req, id);
    if (!current) {
      throw new HttpError(404, 'NOT_FOUND', 'Predeclaration not found');
    }
    this.ensureDraft(current);
    await this.predeclarationRepository.update(req, id, {
      status: 'SUBMITTED',
      submittedAt: new Date(),
    });
    return this.predeclarationRepository.findByIdDetailed(req, id);
  };

  approvePredeclaration = async (req, id) => {
    const current = await this.predeclarationRepository.findByIdDetailed(req, id);
    if (!current) {
      throw new HttpError(404, 'NOT_FOUND', 'Predeclaration not found');
    }
    if (current.status !== 'SUBMITTED') {
      throw new HttpError(
        409,
        'INVALID_STATUS_TRANSITION',
        'Only SUBMITTED predeclaration can be approved',
      );
    }
    await this.predeclarationRepository.update(req, id, {
      status: 'APPROVED',
      approvedAt: new Date(),
    });
    return this.predeclarationRepository.findByIdDetailed(req, id);
  };

  rejectPredeclaration = async (req, id, body) => {
    const current = await this.predeclarationRepository.findByIdDetailed(req, id);
    if (!current) {
      throw new HttpError(404, 'NOT_FOUND', 'Predeclaration not found');
    }
    if (current.status !== 'SUBMITTED') {
      throw new HttpError(
        409,
        'INVALID_STATUS_TRANSITION',
        'Only SUBMITTED predeclaration can be rejected',
      );
    }
    await this.predeclarationRepository.update(req, id, {
      status: 'REJECTED',
      rejectedAt: new Date(),
      remarks: body?.remarks?.trim() || current.remarks || null,
    });
    return this.predeclarationRepository.findByIdDetailed(req, id);
  };

  cancelPredeclaration = async (req, id, body) => {
    const current = await this.predeclarationRepository.findByIdDetailed(req, id);
    if (!current) {
      throw new HttpError(404, 'NOT_FOUND', 'Predeclaration not found');
    }
    if (current.status === 'APPROVED') {
      throw new HttpError(
        409,
        'INVALID_STATUS_TRANSITION',
        'APPROVED predeclaration cannot be cancelled',
      );
    }
    await this.predeclarationRepository.update(req, id, {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      remarks: body?.remarks?.trim() || current.remarks || null,
    });
    return this.predeclarationRepository.findByIdDetailed(req, id);
  };
}
