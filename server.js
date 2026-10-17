const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 10000;

// Body Parser
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// GÜVENLİK: Rate Limiter (Aşırı istek ve Brute-Force koruması)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 100, // 15 dakikada IP başına maks 100 istek
    message: { success: false, message: 'Çok fazla istek gönderdiniz. Lütfen 15 dakika sonra tekrar deneyin.' }
});
app.use('/api/', limiter);

// In-memory Veri Deposu
const users = [];
const transactions = [];

// Başlangıç Varsayılan Kullanıcısını Güvenli (Hash'lenmiş) Şifre ile Ekle
(async () => {
    const hashedPassword = await bcrypt.hash('123456', 10);
    users.push({
        id: 1,
        email: 'demo@bute.com',
        password: hashedPassword
    });
})();

// API: KAYIT OL (Şifre Hash'leme ile)
app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'E-posta ve şifre gereklidir.' });
    }

    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
        return res.status(400).json({ success: false, message: 'Bu e-posta adresi zaten kayıtlı.' });
    }

    // Şifreyi güvenli bir şekilde hash'le
    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ id: Date.now(), email, password: hashedPassword });

    return res.json({ success: true, message: 'Kayıt başarılı!' });
});

// API: GİRİŞ YAP (Hash Doğrulama ile)
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
        return res.status(401).json({ success: false, message: 'E-posta veya şifre hatalı.' });
    }

    // Hash'lenmiş şifreyi karşılaştır
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({ success: false, message: 'E-posta veya şifre hatalı.' });
    }

    return res.json({ success: true, message: 'Giriş başarılı!', email: user.email });
});

// API: İŞLEMLERİ GETİR
app.get('/api/transactions', (req, res) => {
    const { category } = req.query;
    let filtered = transactions;

    if (category && category !== 'Tümü') {
        filtered = transactions.filter(t => t.category === category);
    }

    res.json({ success: true, transactions: filtered });
});

// API: İŞLEM EKLE
app.post('/api/transactions', (req, res) => {
    const { type, title, amount, category, date } = req.body;

    if (!title || !amount || !date) {
        return res.status(400).json({ success: false, message: 'Lütfen tüm alanları doldurun.' });
    }

    const numAmount = parseFloat(amount);
    const finalAmount = type === 'gider' ? -Math.abs(numAmount) : Math.abs(numAmount);

    const newTx = {
        id: Date.now(),
        type,
        title,
        amount: finalAmount,
        category,
        date
    };

    transactions.push(newTx);
    res.json({ success: true, transaction: newTx });
});

// API: İŞLEM SİL
app.delete('/api/transactions/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = transactions.findIndex(t => t.id === id);

    if (index !== -1) {
        transactions.splice(index, 1);
        return res.json({ success: true, message: 'İşlem silindi.' });
    }

    res.status(404).json({ success: false, message: 'İşlem bulunamadı.' });
});

// Sunucuyu Başlat
app.listen(PORT, () => {
    console.log(`Bütçe Takip Uygulaması çalışıyor: http://localhost:${PORT}`);
});