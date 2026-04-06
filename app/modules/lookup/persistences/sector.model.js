import { DataTypes } from 'sequelize';

/**
 * Sector – recursive hierarchy (e.g. Retail > Supermarket, Mini-market; Hospitality > Hotel, Restaurant > Fast Food, Fine Dining).
 * Table: lookup_sectors
 */
export const Sector = (sequelize) => {
  const model = sequelize.define(
    'Sector',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      parentId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'parent_id',
        comment: 'Parent sector for hierarchy (null = root)',
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'name',
      },
      code: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'code',
      },
      division: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'division',
      },
      majorGroup: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'major_group',
      },
      group: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'group',
      },
      licensingCategory: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'licensing_category',
      },
      verificationBodyId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'verification_body_id',
      },
      licensingAuthorityId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'licensing_authority_id',
      },
      expectedDailyTxnMin: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'expected_daily_txn_min',
        defaultValue: 50,
      },
      expectedDailyTxnMax: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'expected_daily_txn_max',
        defaultValue: 2000,
      },
      expectedAvgTicketMin: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'expected_avg_ticket_min',
        defaultValue: 50,
      },
      expectedAvgTicketMax: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'expected_avg_ticket_max',
        defaultValue: 5000,
      },
      expectedOpenTime: {
        type: DataTypes.STRING(10),
        allowNull: true,
        field: 'expected_open_time',
        defaultValue: '08:00',
      },
      expectedCloseTime: {
        type: DataTypes.STRING(10),
        allowNull: true,
        field: 'expected_close_time',
        defaultValue: '21:00',
      },
      riskThresholdPercent: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'risk_threshold_percent',
        defaultValue: 30,
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
      tableName: 'lookup_sectors',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    },
  );

  model.ignoreOrganizationFilter = true;
  model.associate = (models) => {
    model.belongsTo(model, {
      foreignKey: 'parentId',
      as: 'parent',
    });
    model.hasMany(model, {
      foreignKey: 'parentId',
      as: 'children',
    });
    if (models.VerificationBody) {
      model.belongsTo(models.VerificationBody, {
        foreignKey: 'verificationBodyId',
        as: 'verificationBody',
      });
    }
    if (models.LicensingAuthority) {
      model.belongsTo(models.LicensingAuthority, {
        foreignKey: 'licensingAuthorityId',
        as: 'licensingAuthority',
      });
    }
  };

  return model;
};
