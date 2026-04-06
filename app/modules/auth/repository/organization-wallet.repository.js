/**
 * OrganizationWalletRepository
 * CRUD for the organization_wallets table.
 */
export class OrganizationWalletRepository {
    constructor() { }

    _model() {
        return import('../../../shared/db/data-source.js').then(m => m.models.OrganizationWallet);
    }

    /**
     * Find a wallet config by org + type.
     * @param {string} organizationId
     * @param {string} walletType - e.g. 'CHECHE_WALLET'
     */
    async findByOrgAndType(organizationId, walletType) {
        const Model = await this._model();
        return Model.findOne({ where: { organizationId, walletType, active: true } });
    }

    /**
     * List all wallet configs for an org.
     * @param {string} organizationId
     */
    async findAllByOrg(organizationId) {
        const Model = await this._model();
        return Model.findAll({ where: { organizationId }, order: [['walletType', 'ASC']] });
    }

    /**
     * Upsert a wallet config (create if not exists, update if exists).
     * @param {string} organizationId
     * @param {string} walletType
     * @param {{ phone?: string, pin?: string, config?: object, active?: boolean }} data
     */
    async upsert(organizationId, walletType, data) {
        const Model = await this._model();
        const [record] = await Model.findOrCreate({
            where: { organizationId, walletType },
            defaults: { organizationId, walletType, ...data },
        });
        if (record) {
            const updateData = {};
            if (data.phone !== undefined) updateData.phone = data.phone;
            if (data.pin !== undefined) updateData.pin = data.pin;
            if (data.config !== undefined) updateData.config = data.config;
            if (data.active !== undefined) updateData.active = data.active;
            if (Object.keys(updateData).length > 0) await record.update(updateData);
        }
        return record;
    }

    /**
     * Delete a wallet config.
     * @param {string} organizationId
     * @param {string} walletType
     */
    async delete(organizationId, walletType) {
        const Model = await this._model();
        return Model.destroy({ where: { organizationId, walletType } });
    }
}
