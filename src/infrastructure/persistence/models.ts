import { DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { sequelize } from './sequelize';

export class CountryModel extends Model<
  InferAttributes<CountryModel>,
  InferCreationAttributes<CountryModel>
> {
  declare code: string;
  declare name: string;
  declare currency_code: string;
  declare decimals: number;
  declare enabled: boolean;
}

CountryModel.init(
  {
    code: { type: DataTypes.CHAR(2), primaryKey: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    currency_code: { type: DataTypes.STRING(3), allowNull: false },
    decimals: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 2 },
    enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { sequelize, tableName: 'countries', timestamps: false },
);

export class TaxRateModel extends Model<
  InferAttributes<TaxRateModel>,
  InferCreationAttributes<TaxRateModel>
> {
  declare id: string;
  declare country_code: string;
  declare code: string;
  declare name: string;
  declare percentage: number;
  declare kind: 'vat' | 'withholding_iva' | 'withholding_rent' | 'special';
  declare is_default: boolean;
}

TaxRateModel.init(
  {
    id: { type: DataTypes.CHAR(36), primaryKey: true },
    country_code: { type: DataTypes.CHAR(2), allowNull: false },
    code: { type: DataTypes.STRING(20), allowNull: false },
    name: { type: DataTypes.STRING(100), allowNull: false },
    percentage: { type: DataTypes.DECIMAL(6, 2), allowNull: false },
    kind: { type: DataTypes.ENUM('vat', 'withholding_iva', 'withholding_rent', 'special'), allowNull: false },
    is_default: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  { sequelize, tableName: 'tax_rates', timestamps: false },
);

export class IdentificationTypeModel extends Model<
  InferAttributes<IdentificationTypeModel>,
  InferCreationAttributes<IdentificationTypeModel>
> {
  declare id: string;
  declare country_code: string;
  declare code: string;
  declare name: string;
  declare regex: string | null;
}

IdentificationTypeModel.init(
  {
    id: { type: DataTypes.CHAR(36), primaryKey: true },
    country_code: { type: DataTypes.CHAR(2), allowNull: false },
    code: { type: DataTypes.STRING(20), allowNull: false },
    name: { type: DataTypes.STRING(100), allowNull: false },
    regex: { type: DataTypes.STRING(255), allowNull: true },
  },
  { sequelize, tableName: 'identification_types', timestamps: false },
);

export class DocumentTypeModel extends Model<
  InferAttributes<DocumentTypeModel>,
  InferCreationAttributes<DocumentTypeModel>
> {
  declare id: string;
  declare country_code: string;
  declare code: string;
  declare name: string;
}

DocumentTypeModel.init(
  {
    id: { type: DataTypes.CHAR(36), primaryKey: true },
    country_code: { type: DataTypes.CHAR(2), allowNull: false },
    code: { type: DataTypes.STRING(20), allowNull: false },
    name: { type: DataTypes.STRING(100), allowNull: false },
  },
  { sequelize, tableName: 'document_types', timestamps: false },
);

export class OutboxModel extends Model<
  InferAttributes<OutboxModel>,
  InferCreationAttributes<OutboxModel>
> {
  declare id: string;
  declare aggregate_type: string;
  declare aggregate_id: string;
  declare type: string;
  declare payload: unknown;
  declare occurred_at: Date;
  declare processed_at: Date | null;
}

OutboxModel.init(
  {
    id: { type: DataTypes.CHAR(36), primaryKey: true },
    aggregate_type: { type: DataTypes.STRING(50), allowNull: false },
    aggregate_id: { type: DataTypes.CHAR(36), allowNull: false },
    type: { type: DataTypes.STRING(100), allowNull: false },
    payload: { type: DataTypes.JSON, allowNull: false },
    occurred_at: { type: DataTypes.DATE, allowNull: false },
    processed_at: { type: DataTypes.DATE, allowNull: true },
  },
  { sequelize, tableName: 'outbox_messages', timestamps: false },
);

CountryModel.hasMany(TaxRateModel, { foreignKey: 'country_code' });
TaxRateModel.belongsTo(CountryModel, { foreignKey: 'country_code' });
CountryModel.hasMany(IdentificationTypeModel, { foreignKey: 'country_code' });
IdentificationTypeModel.belongsTo(CountryModel, { foreignKey: 'country_code' });
CountryModel.hasMany(DocumentTypeModel, { foreignKey: 'country_code' });
DocumentTypeModel.belongsTo(CountryModel, { foreignKey: 'country_code' });
