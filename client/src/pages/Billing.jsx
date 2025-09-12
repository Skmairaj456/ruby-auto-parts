import React, { useState, useEffect, useRef } from 'react';
import { recordSale } from '../services/api'; // Import recordSale
import API from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import ZxingScanner from '../components/ZxingScanner.jsx';
import '../styles.css';

const Billing = () => {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState(''); // Changed from customerMobile
  const [billItems, setBillItems] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { user, isAdmin } = useAuth();
  const billRef = useRef();
  const [saleRecorded, setSaleRecorded] = useState(false);
  const [lastRecordedSaleId, setLastRecordedSaleId] = useState(null);
  const [lastSaleDetails, setLastSaleDetails] = useState(null); // New state to store last sale details
  const [showScanner, setShowScanner] = useState(false);

  const fetchItemByUniqueCode = async (code) => {
    try {
      const response = await API.get(`/active/${code}`);
      const item = response.data;
      // Check if item already exists in billItems, if so, increment quantity
      const existingItemIndex = billItems.findIndex(bi => bi.item._id === item._id);

      if (existingItemIndex > -1) {
        const updatedBillItems = [...billItems];
        const existingBillItem = updatedBillItems[existingItemIndex];

        if (existingBillItem.quantity + 1 > item.quantity) {
          setError(`Cannot add more than available stock for ${item.name}. Available: ${item.quantity}`);
          return;
        }

        updatedBillItems[existingItemIndex].quantity += 1;
        setBillItems(updatedBillItems);
      } else {
        setBillItems([...billItems, { item: item, quantity: 1 }]);
      }
      setBarcodeInput('');
      setError('');
    } catch (err) {
      setError('Failed to fetch item: ' + (err.response?.data?.message || err.message));
    }
  };

  const fetchItemByBarcodeCode = async (barcodeCode) => {
    try {
      // Search for items where the uniqueCode ends with the barcodeCode
      const response = await API.get(`/active/search-by-barcode/${barcodeCode}`);
      const item = response.data;
      
      if (!item) {
        setError(`No item found with barcode code: ${barcodeCode}`);
        return;
      }

      // Check if item already exists in billItems, if so, increment quantity
      const existingItemIndex = billItems.findIndex(bi => bi.item._id === item._id);

      if (existingItemIndex > -1) {
        const updatedBillItems = [...billItems];
        const existingBillItem = updatedBillItems[existingItemIndex];

        if (existingBillItem.quantity + 1 > item.quantity) {
          setError(`Cannot add more than available stock for ${item.name}. Available: ${item.quantity}`);
          return;
        }

        updatedBillItems[existingItemIndex].quantity += 1;
        setBillItems(updatedBillItems);
      } else {
        setBillItems([...billItems, { item: item, quantity: 1 }]);
      }
      setBarcodeInput('');
      setError('');
    } catch (err) {
      setError('Failed to fetch item by barcode: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    if (barcodeInput) {
      fetchItemByUniqueCode(barcodeInput);
    }
  };

  const handleScanResult = (result) => {
    if (result) {
      try {
        const parsed = JSON.parse(result);
        if (parsed.uniqueCode) {
          fetchItemByUniqueCode(parsed.uniqueCode);
        } else {
          // If it's a short barcode code (7 characters), we need to find the full uniqueCode
          if (result.length === 7) {
            fetchItemByBarcodeCode(result);
          } else {
            fetchItemByUniqueCode(result); // Fallback if barcode data is not JSON or uniqueCode is missing
          }
        }
      } catch (e) {
        // If it's a short barcode code (7 characters), we need to find the full uniqueCode
        if (result.length === 7) {
          fetchItemByBarcodeCode(result);
        } else {
          fetchItemByUniqueCode(result); // If not JSON, treat as raw barcode
        }
      }
    }
  };

  const handleQuantityChange = (index, newQuantity) => {
    const updatedBillItems = [...billItems];
    const itemInStock = updatedBillItems[index].item;

    if (newQuantity < 1) {
      setError('Quantity cannot be less than 1.');
      return;
    }
    if (newQuantity > itemInStock.quantity) {
      setError(`Cannot add more than available stock for ${itemInStock.name}. Available: ${itemInStock.quantity}`);
      return;
    }

    updatedBillItems[index].quantity = newQuantity;
    setBillItems(updatedBillItems);
  };

  const handleRemoveItem = (index) => {
    setBillItems(billItems.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    let subTotal = 0;
    let gstAmount = 0;

    billItems.forEach(billItem => {
      const itemPrice = billItem.item.price;
      const itemQuantity = billItem.quantity;
      const itemTotal = itemPrice * itemQuantity;
      subTotal += itemTotal;

      if (billItem.item.isTaxable) {
        gstAmount += itemTotal * 0.18; // Assuming 18% GST
      }
    });

    // Handle null/undefined/NaN discount values
    const validDiscount = isNaN(discount) || discount === null || discount === undefined ? 0 : Number(discount);
    const discountAmount = subTotal * (validDiscount / 100);
    const totalAfterDiscount = Math.max(0, subTotal - discountAmount); // Prevent negative subtotal
    const finalTotal = Math.max(0, totalAfterDiscount + gstAmount); // Prevent negative final total

    return { subTotal, gstAmount, discountAmount, totalAfterDiscount, finalTotal };
  };

  const { subTotal, gstAmount, discountAmount, totalAfterDiscount, finalTotal } = calculateTotals();

  const handleRecordSale = async () => {
    if (billItems.length === 0) {
      setError('Please add items to the sale.');
      return;
    }
    if (!customerName || !customerContact) {
      setError('Please enter customer name and contact number.');
      return;
    }
    
    // Validate phone number - exactly 10 digits
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(customerContact)) {
      setError('Phone number must be exactly 10 digits.');
      return;
    }

    try {
      const itemsForSale = billItems.map(bi => ({
        item: bi.item._id,
        quantity: bi.quantity,
        priceAtSale: bi.item.price, // Store the current price of the item
      }));

      const saleData = {
        customerName,
        customerContact,
        itemsSold: itemsForSale,
        discount: discount, // Add discount percentage
        discountAmount: discountAmount, // Add calculated discount amount
        totalAmount: finalTotal, // Use the calculated final total
      };

      const response = await recordSale(saleData);
      setSuccessMessage(`Sale recorded successfully! Sale ID: ${response.data._id}`);
      setBillItems([]);
      setCustomerName('');
      setCustomerContact('');
      setDiscount(0);
      setError('');
      setSaleRecorded(true);
      setLastRecordedSaleId(response.data._id);
      setLastSaleDetails(response.data); // Store the full sale details
    } catch (err) {
      setError('Failed to record sale: ' + (err.response?.data?.message || err.message));
      console.error(err);
    }
  };

  const printBill = () => {
    // Create 2-inch thermal receipt format
    const thermalBillContent = generateThermalBillHTML();
    
    // Open print window optimized for 2-inch thermal printer
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    
    if (!printWindow) {
      // Fallback: Try alternative printing method
      try {
        const printFrame = document.createElement('iframe');
        printFrame.style.position = 'absolute';
        printFrame.style.top = '-9999px';
        printFrame.style.left = '-9999px';
        document.body.appendChild(printFrame);
        
        const frameDoc = printFrame.contentDocument || printFrame.contentWindow.document;
        frameDoc.write(thermalBillContent);
        frameDoc.close();
        
        setTimeout(() => {
          printFrame.contentWindow.print();
          setTimeout(() => {
            document.body.removeChild(printFrame);
          }, 1000);
        }, 500);
        
        return;
      } catch (fallbackError) {
        setError('Print failed. Please enable popups or try a different browser.');
        return;
      }
    }
    
    try {
      printWindow.document.write(thermalBillContent);
      printWindow.document.close();
      
      // Auto-trigger print dialog
      setTimeout(() => {
        printWindow.print();
      }, 500);
      
    } catch (error) {
      setError('Failed to open print window: ' + error.message);
      if (printWindow) {
        printWindow.close();
      }
    }
  };

  const generateThermalBillHTML = () => {
    const items = saleRecorded && lastSaleDetails?.itemsSold ? lastSaleDetails.itemsSold : billItems;
    const customerInfo = saleRecorded && lastSaleDetails ? lastSaleDetails : { customerName, customerContact };
    const totals = saleRecorded && lastSaleDetails ? lastSaleDetails : { subTotal, gstAmount, discountAmount: discountAmount, totalAmount: finalTotal, discount };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          @media print {
            @page { 
              size: 58mm auto; 
              margin: 2mm; 
            }
            body { 
              margin: 0; 
              padding: 0; 
              width: 54mm;
              font-family: 'Courier New', monospace;
              font-size: 11px;
              line-height: 1.2;
            }
          }
          body {
            width: 54mm;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            line-height: 1.2;
            margin: 0;
            padding: 2mm;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .small { font-size: 9px; }
          .line { border-bottom: 1px dashed #000; margin: 2px 0; }
          .row { display: flex; justify-content: space-between; margin: 1px 0; }
          .item-row { margin: 2px 0; font-size: 10px; }
          .total-row { font-weight: bold; margin: 1px 0; }
        </style>
      </head>
      <body>
        <div class="center bold">RUBY AUTO PARTS</div>
        <div class="center small">RAM NAGAR</div>
        <div class="center small">Contact: 9123456789</div>
        <div class="line"></div>
        
        <div class="small">Customer: ${customerInfo.customerName}</div>
        <div class="small">Phone: ${customerInfo.customerContact}</div>
        <div class="small">Date: ${new Date().toLocaleDateString()}</div>
        <div class="small">Time: ${new Date().toLocaleTimeString()}</div>
        <div class="small">Bill ID: ${saleRecorded && lastSaleDetails?.billId ? lastSaleDetails.billId : 'PENDING'}</div>
        <div class="line"></div>
        
        <div class="bold small">ITEMS:</div>
        ${items.map(item => {
          const name = item.itemName || item.item?.name || 'Unknown Item';
          const price = item.priceAtSale || item.item?.price || 0;
          const quantity = item.quantity || 1;
          const total = price * quantity;
          
          return `
          <div class="item-row">
            <div>${name.substring(0, 20)}</div>
            <div class="row">
              <span>${quantity} x ₹${price.toFixed(2)}</span>
              <span>₹${total.toFixed(2)}</span>
            </div>
          </div>`;
        }).join('')}
        
        <div class="line"></div>
        
        <div class="row">
          <span>Subtotal:</span>
          <span>₹${(totals.subTotal || subTotal).toFixed(2)}</span>
        </div>
        
        ${totals.discount > 0 ? `
        <div class="row">
          <span>Discount (${totals.discount}%):</span>
          <span>-₹${(totals.discountAmount || discountAmount).toFixed(2)}</span>
        </div>` : ''}
        
        <div class="row">
          <span>GST (18%):</span>
          <span>₹${(totals.gstAmount || gstAmount).toFixed(2)}</span>
        </div>
        
        <div class="line"></div>
        
        <div class="row total-row">
          <span>TOTAL:</span>
          <span>₹${(totals.totalAmount || finalTotal).toFixed(2)}</span>
        </div>
        
        <div class="line"></div>
        <div class="center small">Thank you for your business!</div>
        <div class="center small">Visit again!</div>
      </body>
      </html>
    `;
  };

  const generateA4BillHTML = () => {
    const items = saleRecorded && lastSaleDetails?.itemsSold ? lastSaleDetails.itemsSold : billItems;
    const customerInfo = saleRecorded && lastSaleDetails ? lastSaleDetails : { customerName, customerContact };
    const totals = saleRecorded && lastSaleDetails ? lastSaleDetails : { subTotal, gstAmount, discountAmount: discountAmount, totalAmount: finalTotal, discount };
    const currentDate = new Date().toLocaleDateString('en-IN');
    const currentTime = new Date().toLocaleTimeString('en-IN');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bill - Ruby Auto Parts</title>
        <style>
          @media print {
            @page { 
              size: A4; 
              margin: 20mm; 
            }
            body { 
              margin: 0; 
              padding: 0; 
              font-family: 'Arial', sans-serif;
              font-size: 12px;
              line-height: 1.4;
              color: #333;
            }
          }
          body {
            font-family: 'Arial', sans-serif;
            font-size: 12px;
            line-height: 1.4;
            margin: 0;
            padding: 20mm;
            color: #333;
            background: white;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #2c5aa0;
          }
          .header h1 {
            color: #2c5aa0;
            margin: 0;
            font-size: 28px;
            font-weight: bold;
          }
          .header p {
            margin: 5px 0 0 0;
            color: #666;
            font-size: 14px;
          }
          .bill-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            flex-wrap: wrap;
          }
          .bill-info div {
            flex: 1;
            min-width: 200px;
            margin: 10px;
          }
          .bill-info h3 {
            color: #2c5aa0;
            margin: 0 0 10px 0;
            font-size: 16px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
          }
          .bill-info p {
            margin: 5px 0;
            font-size: 12px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            background: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .items-table th {
            background: #2c5aa0;
            color: white;
            padding: 12px 8px;
            text-align: left;
            font-weight: bold;
            font-size: 12px;
          }
          .items-table td {
            padding: 10px 8px;
            border-bottom: 1px solid #ddd;
            font-size: 11px;
          }
          .items-table tr:nth-child(even) {
            background: #f8f9fa;
          }
          .items-table tr:hover {
            background: #e3f2fd;
          }
          .totals {
            margin-top: 20px;
            text-align: right;
          }
          .totals div {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            padding: 5px 0;
            border-bottom: 1px solid #eee;
          }
          .totals .total-row {
            font-weight: bold;
            font-size: 16px;
            color: #2c5aa0;
            border-top: 2px solid #2c5aa0;
            border-bottom: 2px solid #2c5aa0;
            padding: 10px 0;
            margin-top: 10px;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 11px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Ruby Auto Parts</h1>
          <p>Your Trusted Auto Parts Partner</p>
          <p>Ram Nagar | Phone: +91-XXXXXXXXXX</p>
        </div>

        <div class="bill-info">
          <div>
            <h3>Bill To:</h3>
            <p><strong>Name:</strong> ${customerInfo.customerName}</p>
            <p><strong>Contact:</strong> ${customerInfo.customerContact || 'N/A'}</p>
          </div>
          <div>
            <h3>Bill Details:</h3>
            <p><strong>Date:</strong> ${currentDate}</p>
            <p><strong>Time:</strong> ${currentTime}</p>
            <p><strong>Bill ID:</strong> ${saleRecorded && lastSaleDetails?.billId ? lastSaleDetails.billId : 'PENDING'}</p>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 5%;">#</th>
              <th style="width: 40%;">Item Name</th>
              <th style="width: 15%;">Brand</th>
              <th style="width: 10%;">Qty</th>
              <th style="width: 15%;">Price</th>
              <th style="width: 15%;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.itemName || item.item?.name}</td>
                <td>${item.itemBrand || item.item?.brand || 'N/A'}</td>
                <td>${item.quantity}</td>
                <td>₹${(item.priceAtSale || item.item?.price || 0).toFixed(2)}</td>
                <td>₹${((item.priceAtSale || item.item?.price || 0) * item.quantity).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div>
            <span>Subtotal:</span>
            <span>₹${(totals.subTotal || subTotal).toFixed(2)}</span>
          </div>
          ${(totals.discount || discount) > 0 ? `
          <div>
            <span>Discount (${totals.discount || discount}%):</span>
            <span>-₹${(totals.discountAmount || discountAmount).toFixed(2)}</span>
          </div>
          ` : ''}
          <div>
            <span>GST (18%):</span>
            <span>₹${(totals.gstAmount || gstAmount).toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>TOTAL:</span>
            <span>₹${(totals.totalAmount || finalTotal).toFixed(2)}</span>
          </div>
        </div>


        <div class="footer">
          <p>Thank you for your business!</p>
          <p>Visit us again for all your auto parts needs</p>
          <p>This is a computer generated bill</p>
        </div>
      </body>
      </html>
    `;
  };

  const exportPdf = () => {
    const input = billRef.current;
    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('bill.pdf');
    });
  };

  const printBillA4 = () => {
    // Create A4 format bill for printing
    const a4BillContent = generateA4BillHTML();
    
    // Open print window optimized for A4 printing
    const printWindow = window.open('', '_blank', 'width=800,height=1000');
    
    if (!printWindow) {
      // Fallback: Try alternative printing method
      try {
        const printFrame = document.createElement('iframe');
        printFrame.style.position = 'absolute';
        printFrame.style.top = '-9999px';
        printFrame.style.left = '-9999px';
        document.body.appendChild(printFrame);
        
        const frameDoc = printFrame.contentDocument || printFrame.contentWindow.document;
        frameDoc.write(a4BillContent);
        frameDoc.close();
        
        setTimeout(() => {
          printFrame.contentWindow.print();
          setTimeout(() => {
            document.body.removeChild(printFrame);
          }, 1000);
        }, 500);
        
        return;
      } catch (fallbackError) {
        setError('Print failed. Please enable popups or try a different browser.');
        return;
      }
    }
    
    try {
      printWindow.document.write(a4BillContent);
      printWindow.document.close();
      
      // Auto-trigger print dialog
      setTimeout(() => {
        printWindow.print();
      }, 500);
      
    } catch (error) {
      setError('Failed to open print window: ' + error.message);
      if (printWindow) {
        printWindow.close();
      }
    }
  };

  return (
    <div className="container">
      <h2>Billing System</h2>
      {error && <p className="error-message">{error}</p>}
      {successMessage && <p className="success-message">{successMessage}</p>}

      {/* Stats Overview */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-value">{billItems.length}</div>
          <div className="stat-label">Items in Bill</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{billItems.reduce((sum, item) => sum + item.quantity, 0)}</div>
          <div className="stat-label">Total Quantity</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">₹{subTotal.toFixed(2)}</div>
          <div className="stat-label">Subtotal</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">₹{finalTotal.toFixed(2)}</div>
          <div className="stat-label">Final Total</div>
        </div>
      </div>

      <div className="card mb-4">
        <h3>Scan / Enter Item Barcode</h3>
        <form onSubmit={handleBarcodeSubmit} className="form-inline" style={{ display: 'flex', gap: '1rem', alignItems: 'end', marginBottom: '1rem' }}>
          <div className="form-group" style={{ flex: 1, marginBottom: 0, position: 'relative' }}>
            <label style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Barcode / Unique Code</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Scan or enter barcode"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                disabled={saleRecorded}
                style={{ marginBottom: 0, paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowScanner(!showScanner)}
                className="btn btn-outline-secondary"
                style={{
                  position: 'absolute',
                  right: '5px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  padding: '4px 8px',
                  fontSize: '12px',
                  border: 'none',
                  background: 'transparent',
                  color: '#6c757d',
                  cursor: 'pointer'
                }}
                title={showScanner ? 'Hide Camera' : 'Show Camera'}
              >
                📷
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={saleRecorded}>
            {saleRecorded ? 'Sale Recorded' : 'Add Item'}
          </button>
        </form>
        {showScanner && (
          <div className="mt-3">
            <ZxingScanner onScan={handleScanResult} />
          </div>
        )}
      </div>

      <div className="card mb-4">
        <h3>Customer Details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <div className="form-group">
            <label>Customer Name:</label>
            <input
              type="text"
              className="form-control"
              value={saleRecorded && lastSaleDetails ? lastSaleDetails.customerName : customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
              disabled={saleRecorded}
              placeholder="Enter customer name"
            />
          </div>
          <div className="form-group">
            <label>Mobile Number:</label>
            <input
              type="text"
              className="form-control"
              value={saleRecorded && lastSaleDetails ? lastSaleDetails.customerContact : customerContact}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                if (value.length <= 10) {
                  setCustomerContact(value);
                }
              }}
              required
              disabled={saleRecorded}
              placeholder="Enter mobile number"
            />
            {customerContact && customerContact.length > 0 && customerContact.length !== 10 && !saleRecorded && (
              <small style={{ color: 'var(--accent-red)', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                Phone number must be exactly 10 digits ({customerContact.length}/10)
              </small>
            )}
          </div>
        </div>
      </div>

      <div className="card mb-4"> {/* Bill content for printing */} 
        <div className="bill-print-area" ref={billRef}> 
          <h3>RUBY AUTO PARTS</h3> 
          <p>RAM NAGAR</p> 
          <p>Contact: 9123456789</p> 
          <hr />

          <h4>Bill Items</h4>
          {(saleRecorded && lastSaleDetails?.itemsSold.length > 0) || (billItems.length === 0 && !saleRecorded) ? (
            (saleRecorded && lastSaleDetails?.itemsSold.length > 0) ? (
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Part Name</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lastSaleDetails.itemsSold.map((itemDetail) => (
                      <tr key={itemDetail._id}>
                        <td>{itemDetail.itemName || itemDetail.item?.name || 'Unknown Item'}</td>
                        <td>₹{itemDetail.priceAtSale?.toFixed(2)}</td>
                        <td>{itemDetail.quantity}</td>
                        <td>₹{(itemDetail.priceAtSale * itemDetail.quantity)?.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No items added to bill.</p>
            )
          ) : (
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Part Name</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Total</th>
                    {!saleRecorded && <th>Actions</th>} {/* Conditionally render Actions header */}
                  </tr>
                </thead>
                <tbody>
                  {billItems.map((billItem, index) => (
                    <tr key={billItem.item._id}>
                      <td>{billItem.item.name}</td>
                      <td>₹{billItem.item.price.toFixed(2)}</td>
                      <td>
                        <input
                          type="number"
                          value={billItem.quantity}
                          onChange={(e) => handleQuantityChange(index, parseInt(e.target.value))}
                          onWheel={(e) => e.target.blur()} // Prevent scroll wheel interaction
                          min="1"
                          className="quantity-input"
                          disabled={saleRecorded} // Disable quantity input after sale recorded
                        />
                      </td>
                      <td>₹{(billItem.item.price * billItem.quantity).toFixed(2)}</td>
                      {!saleRecorded && (
                        <td>
                          <button onClick={() => handleRemoveItem(index)} className="btn btn-danger btn-sm">Remove</button>
                        </td>
                      )} {/* Conditionally render Remove button */}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="bill-summary" style={{ 
            background: 'var(--secondary-50)', 
            padding: '1.5rem', 
            borderRadius: 'var(--radius-lg)',
            marginTop: '1rem',
            border: '1px solid var(--secondary-200)'
          }}>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '500' }}>Subtotal:</span>
                <span style={{ fontWeight: '600' }}>₹{saleRecorded && lastSaleDetails ? lastSaleDetails.subTotal.toFixed(2) : subTotal.toFixed(2)}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                <label style={{ fontWeight: '500', margin: 0 }}>Discount (%):</label>
                <input
                  type="number"
                  className="form-control inline-input"
                  value={saleRecorded && lastSaleDetails ? lastSaleDetails.discount : (discount === 0 ? '' : discount)}
                  placeholder="0"
                  onChange={(e) => {
                    const value = e.target.value;
                    // Handle empty string or invalid input
                    if (value === '' || value === null) {
                      setDiscount(0);
                    } else {
                      const numValue = parseFloat(value);
                      // Limit discount to 100% maximum
                      const limitedValue = Math.min(100, Math.max(0, isNaN(numValue) ? 0 : numValue));
                      setDiscount(limitedValue);
                    }
                  }}
                  onWheel={(e) => e.target.blur()} // Prevent scroll wheel interaction
                  min="0"
                  max="100"
                  disabled={saleRecorded}
                  style={{ width: '100px', textAlign: 'center' }}
                />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '500' }}>Discount Amount:</span>
                <span style={{ fontWeight: '600', color: 'var(--accent-red)' }}>-₹{saleRecorded && lastSaleDetails ? lastSaleDetails.discountAmount.toFixed(2) : discountAmount.toFixed(2)}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '500' }}>GST Amount (18%):</span>
                <span style={{ fontWeight: '600' }}>₹{saleRecorded && lastSaleDetails ? lastSaleDetails.gstAmount.toFixed(2) : gstAmount.toFixed(2)}</span>
              </div>
              
              <hr style={{ margin: '1rem 0', borderColor: 'var(--secondary-200)' }} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, color: 'var(--primary-600)' }}>Final Total:</h4>
                <h4 style={{ margin: 0, color: 'var(--primary-600)', fontSize: '1.5rem' }}>₹{saleRecorded && lastSaleDetails ? lastSaleDetails.totalAmount.toFixed(2) : finalTotal.toFixed(2)}</h4>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bill-actions" style={{ 
        display: 'flex', 
        gap: '1rem', 
        justifyContent: 'center', 
        flexWrap: 'wrap',
        marginTop: '2rem',
        padding: '1.5rem',
        background: 'var(--secondary-50)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--secondary-200)'
      }}>
        {!saleRecorded ? (
          <button 
            onClick={handleRecordSale} 
            className="btn btn-success btn-lg"
            disabled={billItems.length === 0 || !customerName || !customerContact}
            style={{ minWidth: '200px' }}
          >
            💰 Record Sale
          </button>
        ) : (
          <>
            {/* Print functionality - Admin only access */}
            {isAdmin && (
              <>
                <button onClick={printBill} className="btn btn-primary btn-lg">
                  🖨️ Print Bill
                </button>
                <button onClick={printBillA4} className="btn btn-secondary btn-lg">
                  📄 Print A4
                </button>
                <button onClick={exportPdf} className="btn btn-outline btn-lg">
                  💾 Export PDF
                </button>
              </>
            )}
            <button 
              onClick={() => { 
                setSaleRecorded(false); 
                setLastRecordedSaleId(null); 
                setSuccessMessage(''); 
                setLastSaleDetails(null); 
              }} 
              className="btn btn-success btn-lg"
            >
              ➕ New Sale
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Billing;
