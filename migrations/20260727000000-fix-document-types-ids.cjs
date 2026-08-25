'use strict';

const crypto = require('node:crypto');

function uuidFromCode(code) {
  const hash = crypto.createHash('md5').update(code).digest('hex');
  return `${hash.slice(0,8)}-${hash.slice(8,12)}-4${hash.slice(13,16)}-${((parseInt(hash.slice(16,18),16) & 0x3f) | 0x80).toString(16)}${hash.slice(18,20)}-${hash.slice(20,32)}`;
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const docTypes = [
      { code: '01', name: 'Factura' },
      { code: '04', name: 'Nota de crédito' },
      { code: '05', name: 'Nota de débito' },
      { code: '06', name: 'Guía de remisión' },
      { code: '07', name: 'Comprobante de retención' },
    ];

    for (const dt of docTypes) {
      const newId = uuidFromCode(`EC:${dt.code}`);

      // Obtener el ID viejo (random) si existe
      const [rows] = await queryInterface.sequelize.query(
        `SELECT id FROM document_types WHERE country_code = 'EC' AND code = :code LIMIT 1`,
        { replacements: { code: dt.code } }
      );
      const oldId = rows.length > 0 ? rows[0].id : null;

      if (oldId && oldId !== newId) {
        // Actualizar document_types con el ID determinístico
        await queryInterface.sequelize.query(
          `UPDATE document_types SET id = :newId WHERE id = :oldId`,
          { replacements: { newId, oldId } }
        );

        // Si hay facturas en billing_db usando el ID viejo, actualizarlas también
        await queryInterface.sequelize.query(
          `UPDATE billing_db.invoices SET document_type_id = :newId WHERE document_type_id = :oldId`,
          { replacements: { newId, oldId } }
        ).catch(() => {
          // billing_db puede no existir aún o no tener la tabla — ignorar
        });
      } else if (!oldId) {
        // Insertar si no existe
        await queryInterface.bulkInsert('document_types', [{
          id: newId,
          country_code: 'EC',
          code: dt.code,
          name: dt.name,
        }], { ignoreDuplicates: true });
      }
    }
  },

  async down(queryInterface) {
    // No revertimos — los IDs viejos son random y no se pueden reconstruir
  },
};
