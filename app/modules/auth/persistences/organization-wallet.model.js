import { DataTypes } from 'sequelize';

export const OrganizationWallet = (sequelize) => {
  const model = sequelize.define(
    'OrganizationWallet',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      organizationId: {
        type: DataTypes.UUID,
        field: 'organization_id',
        allowNull: false,
      },
      walletType: {
        type: DataTypes.STRING(64),
        field: 'wallet_type',
        allowNull: false,
      },
      phone: { type: DataTypes.STRING(32), allowNull: true },
      pin: { type: DataTypes.TEXT, allowNull: true },
      config: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        field: 'created_at',
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        field: 'updated_at',
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'organization_wallets',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['organization_id', 'wallet_type'],
          name: 'uniq_organization_wallets_org_type',
        },
      ],
    },
  );

  model.associate = (models) => {
    model.belongsTo(models.Organization, {
      foreignKey: 'organizationId',
      as: 'organization',
    });
  };

  return model;
};
