import crypto from "crypto";
import { Op } from "sequelize";

const algorithm = "aes-256-cbc";
const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, "hex"); // Must be 32 bytes
const IV_LENGTH = 16;

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(algorithm, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
}

function decrypt(text) {
  const [ivHex, encryptedData] = text.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv(algorithm, ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export class EncryptedModelService {
  constructor(model, encryptedFields = []) {
    this.model = model;
    this.encryptedFields = encryptedFields;
  }

  async encryptFields(data) {
    const clone = { ...data };
    for (const field of this.encryptedFields) {
      if (clone[field]) {
        clone[field] = encrypt(clone[field]);
      }
    }
    return clone;
  }

  async decryptFields(instance) {
    if (!instance) return null;
    const raw = instance.get({ plain: true });
    for (const field of this.encryptedFields) {
      if (raw[field]) {
        raw[field] = decrypt(raw[field]);
      }
    }
    return raw;
  }

  async findOne(query) {
    const result = await this.model.findOne({ where: query });
    return this.decryptFields(result);
  }

  async findAll(query = {}) {
    const results = await this.model.findAll({ where: query });
    return Promise.all(results.map((item) => this.decryptFields(item)));
  }

  async insert(data) {
    const encryptedData = await this.encryptFields(data);
    const result = await this.model.create(encryptedData);
    return this.decryptFields(result);
  }

  async update(id, data) {
    const encryptedData = await this.encryptFields(data);
    await this.model.update(encryptedData, { where: { id } });
    const updated = await this.model.findByPk(id);
    return this.decryptFields(updated);
  }

  async softDelete(id) {
    await this.model.update({ deletedAt: new Date() }, { where: { id } });
  }

  async hardDelete(id) {
    await this.model.destroy({ where: { id }, force: true });
  }
}
