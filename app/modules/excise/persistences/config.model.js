import { DataTypes } from 'sequelize';
import { getBaseFields, getBaseOptions } from '../../../shared/db/base.model.js';

export const ExciseConfig = (sequelize) => {
  const base = getBaseFields();
  const model = sequelize.define(
    'ExciseConfig',
    {
      ...base,
      organizationId: {
        ...base.organizationId,
        allowNull: true,
      },
      key: {
        type: DataTypes.STRING(128),
        allowNull: false,
        unique: true,
        field: 'key',
      },
      value: {
        type: DataTypes.JSONB,
        allowNull: false,
        field: 'value',
      },
      description: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'description',
      },
      isEditable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_editable',
      },
    },
    {
      ...getBaseOptions('excise_configs'),
      indexes: [
        {
          unique: true,
          fields: [{ name: 'key' }],
          name: 'unique_excise_config_key',
        },
      ],
    },
  );

  return model;
};
