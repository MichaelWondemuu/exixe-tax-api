export class PublicPortalResponse {
  static toAnnouncement(entity) {
    if (!entity) return null;
    const e = entity.get ? entity.get({ plain: true }) : entity;
    return {
      id: e.id,
      category: e.category,
      priority: e.priority,
      title: e.title,
      message: e.message,
      isActive: e.isActive,
      publishedAt: e.publishedAt,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    };
  }

  static toReport(entity) {
    if (!entity) return null;
    const e = entity.get ? entity.get({ plain: true }) : entity;
    return {
      id: e.id,
      reference: e.reference,
      reportType: e.reportType,
      stampUid: e.stampUid,
      channel: e.channel,
      productName: e.productName,
      address: e.address,
      city: e.city,
      region: e.region,
      woreda: e.woreda,
      latitude: e.latitude,
      longitude: e.longitude,
      location: e.location,
      comments: e.comments,
      photos: Array.isArray(e.photos) ? e.photos : [],
      reporterName: e.reporterName,
      reporterContact: e.reporterContact,
      reporterId: e.reporterId,
      status: e.status,
      timeline: Array.isArray(e.timeline) ? e.timeline : [],
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    };
  }

  static toNotification(entity) {
    if (!entity) return null;
    const e = entity.get ? entity.get({ plain: true }) : entity;
    return {
      id: e.id,
      reporterId: e.reporterId,
      type: e.type,
      title: e.title,
      message: e.message,
      payload: e.payload || {},
      isRead: Boolean(e.isRead),
      createdAt: e.createdAt,
    };
  }

  static toRestrictedProduct(entity) {
    if (!entity) return null;
    const e = entity.get ? entity.get({ plain: true }) : entity;
    return {
      id: e.id,
      productName: e.productName || null,
      status: e.enforcementState || 'UNDER_ENFORCEMENT',
      merchantName: e.merchantName || null,
      stampUid: e.stampUid || null,
      batchNumber: e.batchNumber || null,
      productionDate: e.productionDate || null,
      revokedAt: e.revokedAt || null,
      notes: e.notes || null,
      isImported: Boolean(e.isImported),
      ethiopiaRevenueOffice: e.ethiopiaRevenueOffice || null,
      updatedAt: e.updatedAt || null,
    };
  }

  static toPortalProduct(entity) {
    if (!entity) return null;
    const e = entity.get ? entity.get({ plain: true }) : entity;
    return {
      id: e.id,
      name: e.name,
      description: e.description ?? null,
      imageUrl: e.imageUrl ?? null,
      categoryId: e.categoryId ?? null,
      category: e.category
        ? { id: e.category.id, name: e.category.name, code: e.category.code ?? null }
        : null,
      productTypeId: e.productTypeId ?? null,
      productType: e.productType
        ? { id: e.productType.id, name: e.productType.name }
        : null,
      measurementId: e.measurementId ?? null,
      measurement: e.measurement
        ? {
            id: e.measurement.id,
            name: e.measurement.name,
            shortForm: e.measurement.shortForm ?? null,
          }
        : null,
      updatedAt: e.updatedAt ?? null,
    };
  }

  static toPortalVariant(entity) {
    if (!entity) return null;
    const e = entity.get ? entity.get({ plain: true }) : entity;
    return {
      id: e.id,
      productId: e.productId,
      name: e.name,
      sku: e.sku,
      unitValue: e.unitValue,
      sellingPrice: e.sellingPrice,
      isActive: Boolean(e.isActive),
      attributes: Array.isArray(e.attributes)
        ? e.attributes.map((a) => ({
            id: a.id,
            key: a.key,
            value: a.value,
          }))
        : [],
    };
  }

  static toPortalProductType(entity) {
    if (!entity) return null;
    const e = entity.get ? entity.get({ plain: true }) : entity;
    return {
      id: e.id,
      name: e.name,
      updatedAt: e.updatedAt ?? null,
    };
  }

  static toPortalCategory(entity) {
    if (!entity) return null;
    const e = entity.get ? entity.get({ plain: true }) : entity;
    return {
      id: e.id,
      name: e.name,
      code: e.code ?? null,
      status: e.status ?? null,
      color: e.color ?? null,
      description: e.description ?? null,
      updatedAt: e.updatedAt ?? null,
    };
  }
}
