const { ThermalPrinter, PrinterTypes } = require('node-thermal-printer');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const printer = new ThermalPrinter({
    type: PrinterTypes.EPSON,
    interface: 'tcp://localhost', 
    width: 32 
});

async function imprimirTicket(venta) {
    try {
        printer.clear();
        
        printer.alignCenter();
        printer.setTextDoubleHeight();
        printer.println("ELI MINI MARKET");
        printer.setTextNormal();
        printer.println("Av. Siempre Viva 123");
        printer.println("Formosa, Argentina");
        printer.drawLine();

        printer.alignLeft();
        const ahora = new Date();
        const fecha = new Date().toLocaleString('es-AR', {
            hour12: false
        });
        printer.println(`Fecha: ${fecha}`);
        const hora = ahora.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
        
        printer.println(`TICKET Nro: ${String(venta.id_venta).padStart(6, '0')}`);
        printer.drawLine();

        venta.items.forEach(item => {
            printer.println(item.nombre.toUpperCase().substring(0, 31));
            
            const cantYPrecio = `${item.cantidad} x $${item.precio_unitario}`;
            const subtotal = `$${(item.cantidad * item.precio_unitario).toFixed(2)}`;
            
            const espacios = 32 - cantYPrecio.length - subtotal.length;
            printer.println(cantYPrecio + " ".repeat(Math.max(1, espacios)) + subtotal);
        });

        printer.drawLine();

        printer.alignRight();
        printer.setTextDoubleHeight();
        printer.setTextDoubleWidth();
        printer.println(`TOTAL: $${venta.total_venta}`);
        printer.setTextNormal();

        if (venta.monto_pagado && venta.monto_pagado > venta.total_venta) {
            printer.println(`PAGO CON: $${venta.monto_pagado}`);
            printer.println(`VUELTO: $${(venta.monto_pagado - venta.total_venta).toFixed(2)}`);
        }

        printer.alignCenter();
        printer.newLine();
        printer.println("¡GRACIAS POR SU COMPRA!");
        printer.newLine();

        printer.newLine();
        printer.newLine();
        printer.newLine();
        printer.cut();

        const buffer = printer.getBuffer();
        const tempFile = path.join(__dirname, 'ticket.bin');
        fs.writeFileSync(tempFile, buffer);

        const printerSharedName = "POS58"; 
        const command = `cmd /c copy /b "${tempFile}" "\\\\127.0.0.1\\${printerSharedName}"`;

        exec(command, (error) => {
            if (error) {
                console.error("Error de envío:", error);
            } else {
                console.log("Ticket enviado correctamente a la impresora.");
                setTimeout(() => {
                    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
                }, 2000);
            }
        });

        printer.clear();

    } catch (error) {
        console.error("Error en la lógica:", error);
    }
}

module.exports = { imprimirTicket };