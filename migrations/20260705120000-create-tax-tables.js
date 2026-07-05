/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('countries', {
      code: { type: Sequelize.CHAR(2), primaryKey: true },
      name: { type: Sequelize.STRING(100), allowNull: false },
      currency_code: { type: Sequelize.CHAR(3), allowNull: false },
      decimals: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 2 },
      enabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
    });

    await queryInterface.createTable('tax_rates', {
      id: { type: Sequelize.CHAR(36), primaryKey: true },
      country_code: {
        type: Sequelize.CHAR(2),
        allowNull: false,
        references: { model: 'countries', key: 'code' },
        onDelete: 'CASCADE',
      },
      code: { type: Sequelize.STRING(20), allowNull: false },
      name: { type: Sequelize.STRING(100), allowNull: false },
      percentage: { type: Sequelize.DECIMAL(6, 2), allowNull: false },
      kind: { type: Sequelize.ENUM('vat', 'withholding_iva', 'withholding_rent', 'special'), allowNull: false },
      is_default: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
    });
    await queryInterface.addIndex('tax_rates', ['country_code', 'code'], { unique: true });

    await queryInterface.createTable('identification_types', {
      id: { type: Sequelize.CHAR(36), primaryKey: true },
      country_code: {
        type: Sequelize.CHAR(2),
        allowNull: false,
        references: { model: 'countries', key: 'code' },
        onDelete: 'CASCADE',
      },
      code: { type: Sequelize.STRING(20), allowNull: false },
      name: { type: Sequelize.STRING(100), allowNull: false },
      regex: { type: Sequelize.STRING(255), allowNull: true },
    });
    await queryInterface.addIndex('identification_types', ['country_code', 'code'], { unique: true });

    await queryInterface.createTable('document_types', {
      id: { type: Sequelize.CHAR(36), primaryKey: true },
      country_code: {
        type: Sequelize.CHAR(2),
        allowNull: false,
        references: { model: 'countries', key: 'code' },
        onDelete: 'CASCADE',
      },
      code: { type: Sequelize.STRING(20), allowNull: false },
      name: { type: Sequelize.STRING(100), allowNull: false },
    });
    await queryInterface.addIndex('document_types', ['country_code', 'code'], { unique: true });

    await queryInterface.createTable('outbox_messages', {
      id: { type: Sequelize.CHAR(36), primaryKey: true },
      aggregate_type: { type: Sequelize.STRING(50), allowNull: false },
      aggregate_id: { type: Sequelize.CHAR(36), allowNull: false },
      type: { type: Sequelize.STRING(100), allowNull: false },
      payload: { type: Sequelize.JSON, allowNull: false },
      occurred_at: { type: Sequelize.DATE, allowNull: false },
      processed_at: { type: Sequelize.DATE, allowNull: true },
    });
    await queryInterface.addIndex('outbox_messages', ['processed_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('outbox_messages');
    await queryInterface.dropTable('document_types');
    await queryInterface.dropTable('identification_types');
    await queryInterface.dropTable('tax_rates');
    await queryInterface.dropTable('countries');
  },
};
