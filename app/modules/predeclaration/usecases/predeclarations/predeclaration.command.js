import { HttpError } from '../../../../shared/utils/http-error.js';
import { sequelize } from '../../../../shared/db/database.js';

function buildReferenceNo() {
  const ts = Date.now();
  const rnd = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `PD-${ts}-${rnd}`;
}

function getActorId(req) {
  return req?.userId || req?.accountId || null;
}

function parseDateOnly(value, fieldName) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new HttpError(
      400,
      'VALIDATION_ERROR',
      `${fieldName} must be a valid date (YYYY-MM-DD)`,
    );
  }
  return date;
}

function validateDates({ declarationDate, arrivalDate }) {
  const declaration = parseDateOnly(declarationDate, 'declarationDate');
  const arrival = parseDateOnly(arrivalDate, 'arrivalDate');
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  if (declaration > arrival) {
    throw new HttpError(
      400,
      'VALIDATION_ERROR',
      'declarationDate cannot be greater than arrivalDate',
    );
  }
  if (declaration < today) {
    throw new HttpError(
      400,
      'VALIDATION_ERROR',
      'declarationDate cannot be in the past',
    );
  }
  if (arrival < today) {
    throw new HttpError(
      400,
      'VALIDATION_ERROR',
      'arrivalDate cannot be in the past',
    );
  }
}

const PACKAGE_LEVELS = new Set(['UNIT', 'INNER_PACK', 'CASE', 'PALLET']);

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
    packagingId: item.packagingId || null,
    packageLevel: String(item.packageLevel || 'UNIT').trim().toUpperCase(),
    clientRef: item.clientRef?.trim() || null,
    parentClientRef: item.parentClientRef?.trim() || null,
    unitsPerParent:
      item.unitsPerParent !== undefined && item.unitsPerParent !== null
        ? Number(item.unitsPerParent)
        : null,
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

  validateHierarchy = (items) => {
    const refs = new Set();
    const parentByRef = new Map();
    const byRef = new Map();

    for (const item of items) {
      if (!PACKAGE_LEVELS.has(item.packageLevel)) {
        throw new HttpError(
          400,
          'VALIDATION_ERROR',
          `item.packageLevel must be one of ${Array.from(PACKAGE_LEVELS).join(', ')}`,
        );
      }

      if (item.clientRef && refs.has(item.clientRef)) {
        throw new HttpError(
          400,
          'VALIDATION_ERROR',
          `Duplicate item.clientRef "${item.clientRef}"`,
        );
      }

      if (item.parentClientRef && !item.clientRef) {
        throw new HttpError(
          400,
          'VALIDATION_ERROR',
          'item.clientRef is required when item.parentClientRef is provided',
        );
      }

      if (!item.parentClientRef && item.unitsPerParent !== null) {
        throw new HttpError(
          400,
          'VALIDATION_ERROR',
          'item.unitsPerParent is only allowed for nested items with parentClientRef',
        );
      }

      if (
        item.unitsPerParent !== null &&
        (!Number.isFinite(item.unitsPerParent) || item.unitsPerParent <= 0)
      ) {
        throw new HttpError(
          400,
          'VALIDATION_ERROR',
          'item.unitsPerParent must be greater than 0',
        );
      }

      if (item.clientRef) {
        refs.add(item.clientRef);
        byRef.set(item.clientRef, item);
      }
    }

    for (const item of items) {
      if (!item.clientRef) continue;
      parentByRef.set(item.clientRef, item.parentClientRef || null);
      if (item.parentClientRef === item.clientRef) {
        throw new HttpError(
          400,
          'VALIDATION_ERROR',
          `item.parentClientRef cannot equal item.clientRef (${item.clientRef})`,
        );
      }
      if (item.parentClientRef && !refs.has(item.parentClientRef)) {
        throw new HttpError(
          400,
          'VALIDATION_ERROR',
          `Parent reference "${item.parentClientRef}" not found for item "${item.clientRef}"`,
        );
      }
      if (item.parentClientRef) {
        const parent = byRef.get(item.parentClientRef);
        if (
          parent &&
          (parent.productId !== item.productId ||
            parent.productVariantId !== item.productVariantId)
        ) {
          throw new HttpError(
            400,
            'VALIDATION_ERROR',
            `Nested item "${item.clientRef}" must use same product and variant as parent`,
          );
        }
      }
    }

    const visiting = new Set();
    const visited = new Set();
    const dfs = (ref) => {
      if (visited.has(ref)) return;
      if (visiting.has(ref)) {
        throw new HttpError(
          400,
          'VALIDATION_ERROR',
          `Circular parent relationship detected at "${ref}"`,
        );
      }
      visiting.add(ref);
      const parent = parentByRef.get(ref);
      if (parent) dfs(parent);
      visiting.delete(ref);
      visited.add(ref);
    };

    for (const ref of parentByRef.keys()) {
      dfs(ref);
    }
  };

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
    const packagingModel = this.predeclarationRepository.getPackagingModel();

    const normalizedItems = items.map((rawItem) => this.normalizeItem(rawItem));
    this.validateHierarchy(normalizedItems);

    for (const item of normalizedItems) {
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
      if (item.packagingId) {
        const packaging = await packagingModel.findByPk(item.packagingId, {
          attributes: ['id'],
        });
        if (!packaging) {
          throw new HttpError(
            400,
            'VALIDATION_ERROR',
            `packaging ${item.packagingId} not found`,
          );
        }
      }
    }

    return { itemModel, normalizedItems };
  };

  createItemsWithHierarchy = async ({
    itemModel,
    predeclarationId,
    normalizedItems,
    transaction,
  }) => {
    const itemsWithIndex = normalizedItems.map((item, idx) => ({
      item,
      idx,
      key: item.clientRef || `__idx_${idx}`,
    }));
    const createdIdByKey = new Map();
    const pending = [...itemsWithIndex];

    while (pending.length > 0) {
      let createdAny = false;

      for (let i = 0; i < pending.length; i += 1) {
        const { item, key } = pending[i];
        const parentKey = item.parentClientRef || null;
        if (parentKey && !createdIdByKey.has(parentKey)) continue;

        const row = await itemModel.create(
          {
            predeclarationId,
            productId: item.productId,
            productVariantId: item.productVariantId,
            packagingId: item.packagingId,
            packageLevel: item.packageLevel,
            parentItemId: parentKey ? createdIdByKey.get(parentKey) : null,
            unitsPerParent: item.unitsPerParent,
            quantity: item.quantity,
            unitValueSnapshot: item.unitValueSnapshot,
            sellingPriceSnapshot: item.sellingPriceSnapshot,
            remarks: item.remarks,
          },
          { transaction },
        );

        createdIdByKey.set(key, row.id);
        pending.splice(i, 1);
        i -= 1;
        createdAny = true;
      }

      if (!createdAny) {
        throw new HttpError(
          400,
          'VALIDATION_ERROR',
          'Could not resolve nested packaging hierarchy. Check parentClientRef ordering and references.',
        );
      }
    }
  };

  createPredeclaration = async (req, body) => {
    const declarationDate = body?.declarationDate;
    const arrivalDate = body?.arrivalDate;
    if (!declarationDate) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'declarationDate is required',
      );
    }
    if (!arrivalDate) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'arrivalDate is required',
      );
    }
    validateDates({ declarationDate, arrivalDate });
    const { itemModel, normalizedItems } = await this.validateItems(body?.items || []);

    const row = await sequelize.transaction(async (transaction) => {
      const created = await this.predeclarationRepository.getModel().create(
        {
          organizationId: req.organizationId || req['organizationId'],
          referenceNo: buildReferenceNo(),
          declarationDate,
          arrivalDate,
          status: 'DRAFT',
          remarks: body?.remarks?.trim() || null,
        },
        { transaction },
      );

      await this.createItemsWithHierarchy({
        itemModel,
        predeclarationId: created.id,
        normalizedItems,
        transaction,
      });
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
    const arrivalDate = body?.arrivalDate;
    if (!declarationDate) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'declarationDate is required',
      );
    }
    if (!arrivalDate) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'arrivalDate is required',
      );
    }
    validateDates({ declarationDate, arrivalDate });

    const { itemModel, normalizedItems } = await this.validateItems(body?.items || []);
    await sequelize.transaction(async (transaction) => {
      await this.predeclarationRepository.getModel().update(
        {
          declarationDate,
          arrivalDate,
          remarks: body?.remarks?.trim() || null,
        },
        { where: { id }, transaction },
      );
      await itemModel.destroy({ where: { predeclarationId: id }, transaction });
      await this.createItemsWithHierarchy({
        itemModel,
        predeclarationId: id,
        normalizedItems,
        transaction,
      });
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
      submittedBy: getActorId(req),
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
      approvedBy: getActorId(req),
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
      rejectedBy: getActorId(req),
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
      cancelledBy: getActorId(req),
      remarks: body?.remarks?.trim() || current.remarks || null,
    });
    return this.predeclarationRepository.findByIdDetailed(req, id);
  };
}
