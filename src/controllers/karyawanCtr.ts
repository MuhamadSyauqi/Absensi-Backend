import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Karyawan from "../models/karyawan";
import { broadcast } from "../routes/ruteWs";

const tambahData = async (nama: string, email: string, password: string, peran: string) => {
  const salt = await bcrypt.genSalt(10);
  const passwordTerenkripsi = await bcrypt.hash(password, salt);

  // Membuat karyawan baru
  const karyawanBaru = new Karyawan({ nama, email, password: passwordTerenkripsi, peran });

  // Menyimpan karyawan baru ke database
  await karyawanBaru.save();
  return karyawanBaru
}

export const tambahKaryawan = async (req: Request, res: Response) => {
  const { nama, email, password, peran } = req.body;

  // Validasi data yang diterima dari request
  if (!nama || !email || !password) {
    return res.status(400).json({ message: "Nama, email dan password harus disertakan" });
  }

  try {
    // Mengecek apakah email sudah ada dalam database
    const cekEmail = await Karyawan
    .findOne({ email });
    if (cekEmail) {
      return res.status(400).json({ message: "Email sudah digunakan" });
    }

    // Membuat karyawan baru
    const karyawanBaru = await tambahData(nama, email, password, peran)

    broadcast("Karyawan")
    // Mengirimkan response dengan karyawan yang baru dibuat
    res.status(201).json(karyawanBaru);
  } catch (error) {
    console.error("Gagal menambahkan karyawan:", error);
    res.status(500).json({ message: "Gagal menambahkan karyawan" });
  }
};

export const semuaKaryawan = async (req: Request, res: Response) => {
  try {
    // Ambil halaman dari query parameter atau gunakan 1 sebagai default
    const halaman = parseInt(req.query.halaman as string) || 1;
    const dataPerHalaman = 10;

    // Menghitung jumlah total dokumen untuk menghitung jumlah halaman
    const totalDocuments = await Karyawan.countDocuments();
    const totalHalaman = Math.ceil(totalDocuments / dataPerHalaman);
    const skip = (halaman - 1) * dataPerHalaman;
    
    // Mengambil karyawan dari database menggunakan pagination dan mengurutkan berdasarkan tanggal secara descending
    const data = await Karyawan.find({}, { _id: 0, password: 0, __v: 0 })
      .sort({ nama: 1 })
      .skip(skip)
      .limit(dataPerHalaman);

    // Mengirimkan response dengan daftar karyawan, halaman saat ini, dan jumlah halaman
    res.status(200).json({ data, halaman, totalHalaman });
  } catch (error) {
    console.error("Gagal mengambil data karyawan:", error);
    res.status(500).json({ message: "Gagal mengambil data karyawan" });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    let karyawan = await Karyawan.findOne({ email });
    if (!karyawan) {
      if (email === process.env.ADMINEMAIL && password === process.env.ADMINPASS) {
        karyawan = await tambahData(email, email, password, 'admin')
      } else {
        return res.status(400).json({ message: "Email atau password salah" });
      }
    }

    const isPasswordValid = await bcrypt.compare(password, karyawan.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Email atau password salah" });
    }

    const token = jwt.sign({ id: karyawan._id, peran: karyawan.peran }, process.env.JWT_SECRET || "secret", {
      expiresIn: "1w",
    });

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan saat mencoba login" });
  }
};

export const profil = async (req: Request, res: Response) => {
  try {
    // Mencari karyawan berdasarkan ID
    const karyawan = await Karyawan.findById(req.user.id, { _id: 0, password: 0, __v: 0 });

    if (!karyawan) {
      // Jika karyawan tidak ditemukan, kirimkan pesan error
      return res.status(404).json({ message: "Data tidak ditemukan" });
    }
    return res.status(200).json({ data: karyawan })
  } catch (error) {
    console.error("Gagal mengambil data profil:", error);
    res.status(500).json({ message: "Gagal mengambil data profil" });
  }
}