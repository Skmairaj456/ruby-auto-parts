// Thermal Printer Integration for Seznik 2-inch Printer
// This utility generates print commands compatible with ESC/POS thermal printers

const generateThermalPrintData = (printData) => {
  const { uniqueCode, name, brand, price, type, quantity = 1 } = printData;
  
  // ESC/POS Commands for 2-inch thermal printer
  const ESC = '\x1B';
  const GS = '\x1D';
  
  // Print commands
  let printCommands = '';
  
  // Initialize printer
  printCommands += `${ESC}@`; // Initialize
  printCommands += `${ESC}a\x01`; // Center align
  
  // Small top margin
  printCommands += '\n';
  
  // Part name (truncated for 2-inch)
  printCommands += `${ESC}!\x01`; // Bold
  printCommands += `${name.substring(0, 24)}\n`; // Limit for 2-inch width
  printCommands += `${ESC}!\x00`; // Reset font
  
  // Brand (if available)
  if (brand) {
    printCommands += `${brand.substring(0, 24)}\n`;
  }
  
  // Price
  printCommands += `Rs.${price}\n`;
  
  printCommands += '\n'; // Space before barcode
  
  // Barcode (Code 128) - Reduced size for 2-inch labels
  // Use only the last part of uniqueCode for barcode (e.g., OIDJRX from 20250912_002147_OIDJRX)
  const barcodeCode = uniqueCode.split('_').pop();
  printCommands += `${GS}h\x40`; // Barcode height (64 dots - smaller for 2-inch)
  printCommands += `${GS}w\x01`; // Barcode width (1 - narrower for 2-inch)
  printCommands += `${GS}H\x00`; // No HRI above barcode
  printCommands += `${GS}k\x49${String.fromCharCode(barcodeCode.length)}${barcodeCode}\x00`; // Code 128 barcode
  
  printCommands += '\n'; // Space after barcode
  
  // Unique code below barcode (show full uniqueCode with timestamp)
  printCommands += `${ESC}!\x00`; // Normal font size
  printCommands += `${uniqueCode}\n`;
  
  // Small bottom margin
  printCommands += '\n';
  
  // Cut paper
  printCommands += `${GS}V\x42\x00`; // Full cut
  
  return {
    rawCommands: printCommands,
    printData: {
      ...printData,
      timestamp: new Date().toISOString(),
      printerModel: 'Seznik 2-inch Thermal'
    }
  };
};

// Function to format print data for A4 printing
const formatForA4Print = (printData) => {
  const { uniqueCode, name, brand, price, quantity = 1 } = printData;
  const timestamp = new Date().toLocaleString();
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Barcode Label - A4</title>
      <style>
        @page { 
          size: A4; 
          margin: 20mm; 
        }
        body { 
          font-family: 'Arial', sans-serif; 
          margin: 0; 
          padding: 0;
          background: white;
        }
        .label-container {
          display: flex;
          flex-wrap: wrap;
          gap: 10mm;
          justify-content: flex-start;
        }
        .label {
          width: 60mm;
          height: 40mm;
          border: 1px solid #ddd;
          padding: 5mm;
          text-align: center;
          background: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .part-name { 
          font-weight: bold; 
          font-size: 12pt;
          margin-bottom: 2mm;
          word-wrap: break-word;
          line-height: 1.2;
        }
        .brand { 
          font-size: 10pt;
          margin-bottom: 2mm;
          color: #666;
        }
        .price { 
          font-weight: bold;
          font-size: 14pt;
          margin-bottom: 3mm;
          color: #2c5aa0;
        }
        .barcode-container { 
          margin: 2mm 0;
          height: 20mm;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .barcode svg {
          max-width: 100%;
          height: auto;
        }
        .code { 
          font-size: 9pt; 
          font-weight: bold;
          margin-top: 2mm;
          letter-spacing: 1px;
          color: #333;
        }
        .timestamp {
          font-size: 8pt;
          color: #999;
          margin-top: 1mm;
        }
        .header {
          text-align: center;
          margin-bottom: 10mm;
          padding-bottom: 5mm;
          border-bottom: 2px solid #2c5aa0;
        }
        .header h1 {
          color: #2c5aa0;
          margin: 0;
          font-size: 18pt;
        }
        .header p {
          margin: 5px 0 0 0;
          color: #666;
          font-size: 12pt;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Ruby Auto Parts</h1>
        <p>Barcode Labels - ${timestamp}</p>
      </div>
      
      <div class="label-container">
        ${Array(quantity).fill(0).map(() => `
          <div class="label">
            <div class="part-name">${name.substring(0, 30)}</div>
            ${brand ? `<div class="brand">${brand.substring(0, 30)}</div>` : ''}
            <div class="price">₹${price}</div>
            
            <div class="barcode-container">
              <div class="barcode">
                <svg class="barcode-svg"></svg>
              </div>
            </div>
            <div class="code">${uniqueCode}</div>
            <div class="timestamp">${timestamp}</div>
          </div>
        `).join('')}
      </div>
      
      <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
      <script>
        // Generate barcodes for all labels
        document.querySelectorAll('.barcode-svg').forEach((svg, index) => {
          JsBarcode(svg, "${uniqueCode.split('_').pop()}", {
            format: "CODE128",
            width: 1.5,
            height: 40,
            displayValue: false,
            margin: 2
          });
        });
        
        // Auto print
        window.onload = function() {
          setTimeout(() => {
            window.print();
            window.close();
          }, 1000);
        };
      </script>
    </body>
    </html>
  `;
};

// Function to format print data for web printing (2-inch labels)
const formatForWebPrint = (printData) => {
  const { uniqueCode, name, brand, price, quantity = 1 } = printData;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Barcode Label</title>
      <style>
        @page { 
          size: 2in auto; 
          margin: 0; 
        }
        body { 
          font-family: monospace; 
          margin: 0; 
          padding: 1mm;
          text-align: center;
          background: white;
          font-size: 8pt;
        }
        .part-name { 
          font-weight: bold; 
          font-size: 9pt;
          margin-bottom: 1mm;
          word-wrap: break-word;
          max-width: 100%;
        }
        .brand { 
          font-size: 8pt;
          margin-bottom: 1mm;
        }
        .price { 
          font-weight: bold;
          font-size: 9pt;
          margin-bottom: 2mm;
        }
        .barcode-container { 
          margin: 1mm 0;
          height: 15mm;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .barcode svg {
          max-width: 90%;
          height: auto;
        }
        .code { 
          font-size: 7pt; 
          font-weight: bold;
          margin-top: 1mm;
          margin-bottom: 1mm;
          letter-spacing: 0.5px;
        }
      </style>
    </head>
    <body>
      <div class="part-name">${name.substring(0, 24)}</div>
      ${brand ? `<div class="brand">${brand.substring(0, 24)}</div>` : ''}
      <div class="price">Rs.${price}</div>
      
      <div class="barcode-container">
        <div class="barcode">
          <svg id="barcode"></svg>
        </div>
      </div>
      <div class="code">${uniqueCode}</div>
      
      <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
      <script>
        // Use only the last part of uniqueCode for barcode (e.g., OIDJRX from 20250912_002147_OIDJRX)
        const barcodeCode = "${uniqueCode}".split('_').pop();
        JsBarcode("#barcode", barcodeCode, {
          format: "CODE128",
          width: 1.2,
          height: 30,
          displayValue: false,
          margin: 1
        });
        
        // Auto print for multiple labels if needed
        ${quantity > 1 ? `
        let printCount = 0;
        const totalPrints = ${quantity};
        
        function printNext() {
          if (printCount < totalPrints) {
            printCount++;
            window.print();
            if (printCount < totalPrints) {
              setTimeout(printNext, 1000); // Wait 1 second between prints
            } else {
              window.close();
            }
          }
        }
        
        window.onload = function() {
          setTimeout(printNext, 500);
        };
        ` : `
        // Single print
        window.onload = function() {
          setTimeout(() => {
            window.print();
            window.close();
          }, 500);
        };
        `}
      </script>
    </body>
    </html>
  `;
};

module.exports = {
  generateThermalPrintData,
  formatForWebPrint,
  formatForA4Print
};
