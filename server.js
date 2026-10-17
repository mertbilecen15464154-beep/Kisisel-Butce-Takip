const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Basit Veritabanı Simülasyonu (Bellek Üzerinde)
let users = [];
let transactions = [
    { id: 1, userId: 1, title: "Market Alışverişi", amount: -450, category: "Yemek", date: "2026-10-15", type: "gider" },
    { id: 2, userId: 1, title: "Maaş", amount: 35000, category: "Gelir", date: "2026-10-01", type: "gelir" },
    { id: 3, userId: 1, title: "Elektrik Faturası", amount: -650, category: "Faturalar", date: "2026-10-10", type: "gider" },
    { id: 4, userId: 1, title: "Taksi", amount: -200, category: "Ulaşım", date: "2026-10-14", type: "gider" }
];

// Kullanıcı Kayıt API
app.post('/api/register', (req, res) => {
    const { email, password } = req.body;
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        return res.status(400).json({ success: false, message: "Bu e-posta zaten kayıtlı." });
    }
    const newUser = { id: users.length + 1, email, password };
    users.push(newUser);
    res.json({ success: true, message: "Kayıt başarılı! Giriş yapabilirsiniz." });
});

// Kullanıcı Giriş API
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    // Kolaylık olsun diye test kullanıcısı da kabul edilir
    if (user || (email === "demo@bute.com" && password === "123456")) {
        res.json({ success: true, userId: user ? user.id : 1, email });
    } else {
        res.status(401).json({ success: false, message: "E-posta veya şifre hatalı." });
    }
});

// İşlemleri Listele (Filtreleme desteği ile)
app.get('/api/transactions', (req, res) => {
    const { category, startDate, endDate } = req.query;
    let filtered = [...transactions];

    if (category && category !== "Tümü") {
        filtered = filtered.filter(t => t.category === category);
    }
    if (startDate) {
        filtered = filtered.filter(t => t.date >= startDate);
    }
    if (endDate) {
        filtered = filtered.filter(t => t.date <= endDate);
    }

    res.json({ success: true, transactions: filtered });
});

// Yeni İşlem Ekle
app.post('/api/transactions', (req, res) => {
    const { title, amount, category, date, type } = req.body;
    const parsedAmount = type === 'gider' ? -Math.abs(Number(amount)) : Math.abs(Number(amount));
    
    const newTx = {
        id: Date.now(),
        userId: 1,
        title,
        amount: parsedAmount,
        category,
        date: date || new Date().toISOString().split('T')[0],
        type
    };

    transactions.unshift(newTx);
    res.json({ success: true, transaction: newTx });
});

// İşlem Sil
app.delete('/api/transactions/:id', (req, res) => {
    const id = Number(req.params.id);
    transactions = transactions.filter(t => t.id !== id);
    res.json({ success: true, message: "İşlem silindi." });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Bütçe Takip Uygulaması çalışıyor: http://localhost:${PORT}`);
});