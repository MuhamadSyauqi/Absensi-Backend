import mongoose, { Schema, Document } from "mongoose";

export interface Ikaryawan extends Document {
  nama: string;
  email: string;
  password: string;
  peran: "karyawan" | "admin";
}

const skemaKaryawan: Schema = new Schema({
  nama: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  peran: { type: String, enum: ["karyawan", "admin"], default: "karyawan" },
});

export default mongoose.model<Ikaryawan>("Karyawan", skemaKaryawan, 'karyawan');
