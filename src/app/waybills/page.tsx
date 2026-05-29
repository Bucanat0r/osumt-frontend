'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Truck, Printer, DollarSign, Calculator, AlertTriangle } from 'lucide-react';

export default function WaybillRegistration() {
  // Form State fields
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [declaredValue, setDeclaredValue] = useState(0);
  const [weight, setWeight] = useState(0);
  const [isFragile, setIsFragile] = useState(false);
  const [isHomeDelivery, setIsHomeDelivery] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('Unpaid');

  // Pricing Engine Evaluation Engine State
  const [officialPrice, setOfficialPrice] = useState(0);
  const [finalPrice, setFinalPrice] = useState(0);
  const [isDiscounted, setIsDiscounted] = useState(false);
  const [loadingQuote, setLoadingQuote] = useState(false);
  
  // Receipt Overlay Modal State
  const [createdWaybill, setCreatedWaybill] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  // Trigger quote recalculation automatically on entry changes
  useEffect(() => {
    if (weight > 0) {
      const fetchQuote = async () => {
        setLoadingQuote(true);
        try {
          const response = await axios.post('http://localhost:3000/waybills/quote', {
            origin: 'Lagos Central',
            destination: 'Abuja Main',
            weight: Number(weight),
            isFragile,
            isHomeDelivery,
          });
          setOfficialPrice(response.data.officialCalculatedPrice);
          // Default final price to match official rate automatically if not modified yet
          if (!isDiscounted) {
            setFinalPrice(response.data.officialCalculatedPrice);
          }
        } catch (err) {
          console.error('Failed to parse calculations', err);
        } finally {
          setLoadingQuote(false);
        }
      };
      fetchQuote();
    } else {
      setOfficialPrice(0);
      setFinalPrice(0);
    }
  }, [weight, isFragile, isHomeDelivery]);

  const handleFinalPriceChange = (value: number) => {
    setFinalPrice(value);
    setIsDiscounted(value < officialPrice);
  };

  const handleSubmitWaybill = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        sender_name: senderName,
        sender_phone: senderPhone,
        receiver_name: receiverName,
        receiver_phone: receiverPhone,
        receiver_address: receiverAddress,
        item_description: itemDescription,
        declared_value: Number(declaredValue),
        chargeable_weight: Number(weight),
        is_fragile: isFragile,
        is_home_delivery: isHomeDelivery,
        final_charged_price: Number(finalPrice),
        payment: paymentStatus,
      };

      const response = await axios.post('http://localhost:3000/waybills', payload);
      setCreatedWaybill(response.data);
      setShowReceipt(true);
    } catch (err) {
      alert('Error registering shipment record');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        
        {/* Title Context Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-blue-900">Waybill Registration Desk</h1>
            <p className="text-sm text-slate-500">Create shipments and instantly quote prices using the system engine.</p>
          </div>
          <Truck className="h-8 w-8 text-blue-900" />
        </div>

        <form onSubmit={handleSubmitWaybill} className="grid grid-cols-1 gap-6 md:grid-cols-3">
          
          {/* Column 1 & 2: Data Input Modules */}
          <div className="space-y-6 md:col-span-2">
            
            {/* Sender / Receiver Context Fields */}
            <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b pb-2">Customer Context Details</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Sender Full Name</label>
                  <input type="text" required value={senderName} onChange={(e) => setSenderName(e.target.value)} className="w-full mt-1 rounded-lg border border-slate-200 p-2 text-sm focus:outline-none focus:border-blue-600" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Sender Phone No</label>
                  <input type="text" required value={senderPhone} onChange={(e) => setSenderPhone(e.target.value)} className="w-full mt-1 rounded-lg border border-slate-200 p-2 text-sm focus:outline-none focus:border-blue-600" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Receiver Full Name</label>
                  <input type="text" required value={receiverName} onChange={(e) => setReceiverName(e.target.value)} className="w-full mt-1 rounded-lg border border-slate-200 p-2 text-sm focus:outline-none focus:border-blue-600" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Receiver Phone No</label>
                  <input type="text" required value={receiverPhone} onChange={(e) => setReceiverPhone(e.target.value)} className="w-full mt-1 rounded-lg border border-slate-200 p-2 text-sm focus:outline-none focus:border-blue-600" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Delivery Home Address (Optional)</label>
                <textarea rows={2} value={receiverAddress} onChange={(e) => setReceiverAddress(e.target.value)} className="w-full mt-1 rounded-lg border border-slate-200 p-2 text-sm focus:outline-none focus:border-blue-600" />
              </div>
            </div>

            {/* Parcel Information */}
            <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b pb-2">Parcel Information</h2>
              <div>
                <label className="text-xs font-semibold text-slate-600">Item Contents Description</label>
                <input type="text" required value={itemDescription} onChange={(e) => setItemDescription(e.target.value)} placeholder="e.g. Electronics, Spare Parts" className="w-full mt-1 rounded-lg border border-slate-200 p-2 text-sm focus:outline-none focus:border-blue-600" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Declared Value (₦)</label>
                  <input type="number" required value={declaredValue} onChange={(e) => setDeclaredValue(Number(e.target.value))} className="w-full mt-1 rounded-lg border border-slate-200 p-2 text-sm focus:outline-none focus:border-blue-600" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Chargeable Weight (KG)</label>
                  <input type="number" required value={weight} onChange={(e) => setWeight(Number(e.target.value))} className="w-full mt-1 rounded-lg border border-slate-200 p-2 text-sm focus:outline-none focus:border-blue-600" />
                </div>
              </div>

              {/* Functional Modification Checkbox Flags */}
              <div className="flex gap-6 pt-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={isFragile} onChange={(e) => setIsFragile(e.target.checked)} className="h-4 w-4 text-blue-900 focus:ring-blue-600" />
                  Fragile Handling Fee (+₦1,500)
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={isHomeDelivery} onChange={(e) => setIsHomeDelivery(e.target.checked)} className="h-4 w-4 text-blue-900 focus:ring-blue-600" />
                  Door-to-Door Delivery Add-on (+₦2,500)
                </label>
              </div>
            </div>
          </div>

          {/* Column 3: Pricing Engine Evaluation Sidebar Module */}
          <div className="space-y-6">
            <div className="rounded-xl bg-white p-6 shadow-md border border-slate-100 space-y-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b pb-2 flex items-center gap-1">
                <Calculator className="h-4 w-4 text-blue-900" /> Live Quotation Summary
              </h2>

              <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Calculated Standard Rate:</span>
                  <span className="font-bold text-slate-900">₦{officialPrice.toLocaleString()}</span>
                </div>
                
                {/* Manual Price Reductions Section */}
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Final Charged Amount (₦)</label>
                  <input 
                    type="number" 
                    value={finalPrice} 
                    onChange={(e) => handleFinalPriceChange(Number(e.target.value))} 
                    className="w-full rounded-lg border border-slate-200 p-2 text-sm font-bold text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                {/* Audit Warning Flag Triggers */}
                {isDiscounted && (
                  <div className="flex items-start gap-1.5 rounded bg-amber-50 p-2.5 text-xs font-semibold text-amber-700 border border-amber-200">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>Price manipulation below system rate will trigger an audit flag for management approval.</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Payment Execution Method</label>
                <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:outline-none">
                  <option value="Unpaid">Unpaid / Cash on Collection</option>
                  <option value="Paid">Paid (Cash/POS)</option>
                  <option value="Credit">Credit Control Sub-ledger</option>
                </select>
              </div>

              <button type="submit" className="w-full rounded-lg bg-blue-900 py-3 font-bold text-white transition-colors hover:bg-blue-950 flex items-center justify-center gap-2">
                <DollarSign className="h-4 w-4" /> Save & Issue Waybill
              </button>
            </div>
          </div>
        </form>

        {/* Printable Official Receipt Overlay Modal View */}
        {showReceipt && createdWaybill && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div id="printable-receipt" className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 font-mono text-sm text-slate-800">
              <div className="text-center space-y-1">
                <h2 className="text-xl font-extrabold text-blue-900">OSUMT GO RECEIPT</h2>
                <p className="text-xs text-slate-500">Official Logistics Waybill Manifest</p>
                <p className="text-base font-bold text-red-600 tracking-wider pt-2">{createdWaybill.waybill_no}</p>
              </div>
              <hr className="border-dashed" />
              <div className="space-y-1">
                <p><strong>Sender:</strong> {createdWaybill.sender_name} ({createdWaybill.sender_phone})</p>
                <p><strong>Receiver:</strong> {createdWaybill.receiver_name} ({createdWaybill.receiver_phone})</p>
                <p><strong>Cargo:</strong> {createdWaybill.item_description}</p>
                <p><strong>Weight:</strong> {createdWaybill.chargeable_weight} KG</p>
              </div>
              <hr className="border-dashed" />
              <div className="space-y-1 text-right">
                <p className="text-xs">System Standard Rate: ₦{Number(createdWaybill.official_calculated_price).toLocaleString()}</p>
                {Number(createdWaybill.discount_applied) > 0 && (
                  <p className="text-xs text-red-600">Manual Discount: -₦{Number(createdWaybill.discount_applied).toLocaleString()}</p>
                )}
                <p className="text-lg font-bold text-blue-900">Paid Amount: ₦{Number(createdWaybill.final_charged_price).toLocaleString()}</p>
                <p className="text-xs uppercase font-bold tracking-wider">Status: {createdWaybill.payment}</p>
              </div>
              <div className="pt-4 flex gap-3 no-print">
                <button onClick={() => window.print()} className="flex-1 bg-slate-900 text-white font-bold py-2 rounded flex items-center justify-center gap-2 hover:bg-black">
                  <Printer className="h-4 w-4" /> Print Document
                </button>
                <button onClick={() => setShowReceipt(false)} className="flex-1 bg-slate-200 text-slate-700 font-bold py-2 rounded hover:bg-slate-300">
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
