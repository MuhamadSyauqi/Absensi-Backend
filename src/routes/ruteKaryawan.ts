import express from "express";
import { tambahKaryawan, semuaKaryawan, login, profil } from "../controllers/karyawanCtr";
import { otentikasiMw } from "../middlewares/otentikasiMw";
import { aksesPeran } from "../middlewares/peranMw";

const rute = express.Router();

rute.post("/", otentikasiMw, aksesPeran('admin'), tambahKaryawan);
rute.get("/", otentikasiMw, aksesPeran('admin'), semuaKaryawan);
rute.get("/profil", otentikasiMw, profil)
rute.post("/login", login);

// Add more routes as needed

export default rute;
