const { imprimirTicket } = require('./src/services/printer');

imprimirTicket({
    id_venta: 128,
    total_venta: 8650,
    metodo_pago: "efectivo",
    monto_pagado: 10000,
    items: [
        { nombre: "Coca Cola 2.25L", cantidad: 1, precio_unitario: 1800 },
        { nombre: "Pan Frances", cantidad: 2, precio_unitario: 700 },
        { nombre: "Galletas Oreo", cantidad: 1, precio_unitario: 1200 },
        { nombre: "Leche Entera La Serenisima", cantidad: 1, precio_unitario: 1500 },
        { nombre: "Azucar Ledesma 1Kg", cantidad: 1, precio_unitario: 950 },
        { nombre: "Papel Higienico x4", cantidad: 1, precio_unitario: 1800 }
    ]
});