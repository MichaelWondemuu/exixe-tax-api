function toPlain(entity) {
  if (!entity) return entity;
  if (typeof entity.get === 'function') {
    return entity.get({ plain: true });
  }
  if (typeof entity.toJSON === 'function') {
    return entity.toJSON();
  }
  return entity;
}

function mapEntity(entity, mapper) {
  if (entity == null) return entity;
  const plain = toPlain(entity);
  return mapper(plain);
}

export function mapDataPayload(payload, mapper) {
  if (!payload || typeof payload !== 'object') return payload;

  if (!Object.prototype.hasOwnProperty.call(payload, 'data')) {
    return payload;
  }

  const mapped = { ...payload };
  if (Array.isArray(mapped.data)) {
    mapped.data = mapped.data.map((item) => mapEntity(item, mapper));
    return mapped;
  }

  mapped.data = mapEntity(mapped.data, mapper);
  return mapped;
}

export { toPlain };
