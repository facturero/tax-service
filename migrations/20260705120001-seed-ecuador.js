const { randomUUID } = require('node:crypto');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const ecCountry = { code: 'EC', name: 'Ecuador', currency_code: 'USD', decimals: 2, enabled: true };

    const taxRates = [
      { code: 'IVA15', name: 'IVA 15%', percentage: 15.00, kind: 'vat', is_default: true },
      { code: 'IVA0', name: 'IVA 0%', percentage: 0.00, kind: 'vat', is_default: false },
      { code: 'NO_OBJETO', name: 'No objeto de IVA', percentage: 0.00, kind: 'vat', is_default: false },
    ];

    const identTypes = [
      { code: 'RUC', name: 'RUC', regex: '^\\d{13}$' },
      { code: 'CEDULA', name: 'Cédula', regex: '^\\d{10}$' },
      { code: 'PASAPORTE', name: 'Pasaporte', regex: null },
      { code: 'CONSUMIDOR_FINAL', name: 'Consumidor final', regex: '^9{13}$' },
      { code: 'EXTERIOR', name: 'Identificación del exterior', regex: null },
    ];

    const docTypes = [
      { code: '01', name: 'Factura' },
      { code: '04', name: 'Nota de crédito' },
      { code: '05', name: 'Nota de débito' },
      { code: '06', name: 'Guía de remisión' },
      { code: '07', name: 'Comprobante de retención' },
    ];

    const outboxEntries = [];

    await queryInterface.bulkInsert('countries', [ecCountry], { ignoreDuplicates: true });
    outboxEntries.push({
      id: randomUUID(),
      aggregate_type: 'country',
      aggregate_id: 'EC',
      type: 'tax.country.enabled',
      payload: JSON.stringify({ countryCode: 'EC', name: 'Ecuador', currencyCode: 'USD', decimals: 2 }),
      occurred_at: new Date(),
      processed_at: null,
    });

    for (const tr of taxRates) {
      const id = randomUUID();
      await queryInterface.bulkInsert('tax_rates', [{ id, country_code: 'EC', ...tr }], { ignoreDuplicates: true });
      outboxEntries.push({
        id: randomUUID(),
        aggregate_type: 'tax_rate',
        aggregate_id: id,
        type: 'tax.tax_rate.upserted',
        payload: JSON.stringify({ id, countryCode: 'EC', code: tr.code, name: tr.name, percentage: tr.percentage, kind: tr.kind, isDefault: tr.is_default }),
        occurred_at: new Date(),
        processed_at: null,
      });
    }

    for (const it of identTypes) {
      const id = randomUUID();
      await queryInterface.bulkInsert('identification_types', [{ id, country_code: 'EC', ...it }], { ignoreDuplicates: true });
      outboxEntries.push({
        id: randomUUID(),
        aggregate_type: 'identification_type',
        aggregate_id: id,
        type: 'tax.identification_type.upserted',
        payload: JSON.stringify({ id, countryCode: 'EC', code: it.code, name: it.name, regex: it.regex }),
        occurred_at: new Date(),
        processed_at: null,
      });
    }

    for (const dt of docTypes) {
      const id = randomUUID();
      await queryInterface.bulkInsert('document_types', [{ id, country_code: 'EC', ...dt }], { ignoreDuplicates: true });
      outboxEntries.push({
        id: randomUUID(),
        aggregate_type: 'document_type',
        aggregate_id: id,
        type: 'tax.document_type.upserted',
        payload: JSON.stringify({ id, countryCode: 'EC', code: dt.code, name: dt.name }),
        occurred_at: new Date(),
        processed_at: null,
      });
    }

    await queryInterface.bulkInsert('outbox_messages', outboxEntries, {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('outbox_messages', {});
    await queryInterface.bulkDelete('document_types', { country_code: 'EC' });
    await queryInterface.bulkDelete('identification_types', { country_code: 'EC' });
    await queryInterface.bulkDelete('tax_rates', { country_code: 'EC' });
    await queryInterface.bulkDelete('countries', { code: 'EC' });
  },
};
