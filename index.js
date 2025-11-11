const express = require('express')
const path = require('path')
const crypto = require('crypto')
const mysql = require('mysql2/promise')

const app = express()
const port = 3000

// Konfigurasi koneksi MySQL
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'Afif2005',   // ganti sesuai password kamu
    database: 'apikey_db',
    port: 3309
}

// Middleware
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

// Fungsi helper koneksi database
async function getConnection() {
    const connection = await mysql.createConnection(dbConfig)
    return connection
}

// === 1️⃣ GET - Ambil semua API Key ===
app.get('/apikeys', async (req, res) => {
    try {
        const connection = await getConnection()
        const [rows] = await connection.execute('SELECT * FROM api_keys ORDER BY id DESC')
        connection.end()
        res.json({ success: true, data: rows })
    } catch (error) {
        console.error('❌ Gagal mengambil data:', error.message)
        res.status(500).json({ success: false, message: 'Gagal mengambil data dari database' })
    }
})

// === 2️⃣ POST - Buat API Key baru ===
app.post('/apikeys', async (req, res) => {
    try {
        const apiKey = `sk-sm-v1-${crypto.randomBytes(16).toString('hex').toUpperCase()}`
        const connection = await getConnection()
        console.log("🔹 Koneksi berhasil, siap insert:", apiKey)

        await connection.execute('INSERT INTO api_keys (api_key) VALUES (?)', [apiKey])
        connection.end()

        res.json({ success: true, message: 'API Key berhasil dibuat', apiKey })
    } catch (error) {
        console.error('❌ Gagal membuat API key:', error)
        res.status(500).json({ success: false, message: 'Gagal membuat API key', error: error.message })
    }
})


// === 3️⃣ PUT - Update API Key berdasarkan ID ===
app.put('/apikeys/:id', async (req, res) => {
    const { id } = req.params
    const { api_key } = req.body

    if (!api_key) {
        return res.status(400).json({ success: false, message: 'api_key baru harus dikirim' })
    }

    try {
        const connection = await getConnection()
        const [result] = await connection.execute('UPDATE api_keys SET api_key = ? WHERE id = ?', [api_key, id])
        connection.end()

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'API key tidak ditemukan' })
        }

        res.json({ success: true, message: 'API key berhasil diperbarui' })
    } catch (error) {
        console.error('❌ Gagal mengupdate API key:', error.message)
        res.status(500).json({ success: false, message: 'Gagal mengupdate API key' })
    }
})

// === 4️⃣ DELETE - Hapus API Key berdasarkan ID ===
app.delete('/apikeys/:id', async (req, res) => {
    const { id } = req.params

    try {
        const connection = await getConnection()
        const [result] = await connection.execute('DELETE FROM api_keys WHERE id = ?', [id])
        connection.end()

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'API key tidak ditemukan' })
        }

        res.json({ success: true, message: 'API key berhasil dihapus' })
    } catch (error) {
        console.error('❌ Gagal menghapus API key:', error.message)
        res.status(500).json({ success: false, message: 'Gagal menghapus API key' })
    }
})

// === Rute Halaman Utama ===
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

// === Jalankan Server ===
app.listen(port, () => {
    console.log(`✅ Server berjalan di http://localhost:${port}`)
})
