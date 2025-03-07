"use client"

import React, { useEffect, useState } from "react";

const OnepagePayPalCheckout = () => {
  const [orderId, setOrderId] = useState(null); // Lưu order_id sau khi tạo đơn hàng
  const [error, setError] = useState(""); // Lưu order_id sau khi tạo đơn hàng
  const partnerClientId = "AYs-QzyPzP9sOtfock0KgO6debvstBRqc4J13PIoMEjgGMQgKRFwlUWpLUF2dOyi5KYfuMCMcnQTxBqF"
  const merchantClientId = "Z25Q4GHJXTWVN"
  useEffect(() => {
    // Load PayPal SDK
    const script = document.createElement("script");
    
    script.src = `https://www.paypal.com/sdk/js?client-id=${partnerClientId}&currency=USD&merchant-id=${merchantClientId}`;
    script.async = true;
    script.onload = () => renderPayPalButton();
    document.body.appendChild(script);
  }, []);

  // Gọi trực tiếp API PayPal để tạo đơn hàng và lấy order_id
  const createOrder = async () => {
    try {
      const response = await fetch("https://onpaypal.sandbox.whatee.io/partner/v2/checkout/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "PayPal-Request-Id": "2bb267eb-b261-40e3-a718-13adea34e24e",
          "Merchant-Client-Id": merchantClientId,
          "Partner-Client-Id": partnerClientId,
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [
            {
              items: [
                {
                  name: "T-Shirt",
                  description: "Green XL",
                  quantity: "1",
                  unit_amount: {
                    currency_code: "USD",
                    value: "100.00",
                  },
                },
              ],
              amount: {
                currency_code: "USD",
                value: "100.00",
                breakdown: {
                  item_total: {
                    currency_code: "USD",
                    value: "100.00",
                  },
                },
              },
            },
          ],
          application_context: {
            return_url: "https://example.com/return",
            cancel_url: "https://example.com/cancel",
          },
        }),
      });

      const orderData = await response.json();
      if (orderData.id) {
        setOrderId(orderData.id); // Lưu order_id
        console.log("✅ Order Created:", orderData.id);
        return orderData.id;
      } else {
        console.error("❌ Error: Order ID not found", orderData);
        return null;
      }
    } catch (error) {
      console.error("❌ Error creating PayPal order:", error);
      return null;
    }
  };

  // Gọi API Capture Order để xác nhận thanh toán
  const captureOrder = async (data) => {
    if (!data.orderID) {
      console.error("❌ No Order ID found for capture.");
      return;
    }

    try {
      const response = await fetch(`https://onpaypal.sandbox.whatee.io/partner/v2/checkout/orders/${data.orderID}/capture`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Merchant-Client-Id": merchantClientId,
          "Partner-Client-Id": partnerClientId,
        },
      });

      const orderData = await response.json();
      if (response.status !== 200 && response.status !== 201) {
        setError(orderData)
        console.error("❌ Error capturing PayPal order:", orderData);
      }
      // Three cases to handle:
      //   (1) Recoverable INSTRUMENT_DECLINED -> call actions.restart()
      //   (2) Other non-recoverable errors -> Show a failure message
      //   (3) Successful transaction -> Show confirmation or thank you

      // This example reads a v2/checkout/orders capture response, propagated from the server
      // You could use a different API or structure for your 'orderData'
      var errorDetail = Array.isArray(orderData.details) && orderData.details[0];

      if (errorDetail && errorDetail.issue === 'INSTRUMENT_DECLINED') {
          console.warn("⚠️ Payment Declined. Restarting checkout...");

          return actions.restart(); // Recoverable state, per:
          // https://developer.paypal.com/docs/checkout/integration-features/funding-failure/
      }

      if (errorDetail) {
          var msg = 'Sorry, your transaction could not be processed.';
          if (errorDetail.description) msg += '\n\n' + errorDetail.description;
          if (orderData.debug_id) msg += ' (' + orderData.debug_id + ')';
          return alert(msg); // Show a failure message (try to avoid alerts in production environments)
      }

      // Successful capture! For demo purposes:
      console.log('✅ Capture result', orderData, JSON.stringify(orderData, null, 2));
      var transaction = orderData.purchase_units[0].payments.captures[0];
      alert('✅ Transaction '+ transaction.status + ': ' + transaction.id + '\n\nSee console for all available details');

      // Replace the above to show a success message within this page, e.g.
      // const element = document.getElementById('paypal-button-container');
      // element.innerHTML = '';
      // element.innerHTML = '<h3>Thank you for your payment!</h3>';
      // Or go to another URL:  actions.redirect('thank_you.html');
    } catch (error) {
      setError(error)
      console.error("❌ Error capturing PayPal order:", error);
    }
  };

  // Render nút PayPal
  const renderPayPalButton = () => {
    let style = {
      color: 'gold',
      height: 55,
      // label: 'checkout',
      // layout: 'horizontal', // just paypal button 
      layout: 'vertical', // paypal button & paypal credit button
      size: 'medium',
      shape: 'rect',
      tagline: false,
      fundingicons: 'false'
    }
    if (window.paypal) {
      window.paypal.Buttons({
        style: style,
        createOrder: async () => await createOrder(),
        onApprove: async (data) => await captureOrder(data),
      }).render("#onepage-paypal-button-container");
    }
  };

  return (
    <div className="p-4">
      <p className="text-lg font-semibold"> With Onepage API, Button && Credit PayPal</p>
      <pre className="bg-gray-100 p-2 rounded-md text-sm mb-3">
          Using Parnter Client ID & Client Merchant ID
      </pre>
      <div id="onepage-paypal-button-container"></div>
      {orderId && <p>🛒 Order ID: {orderId}</p>} {/* Hiển thị Order ID */}
      {error && <p>🛒 Error ID: {error}</p>} {/* Hiển thị Order ID */}
    </div>
  );
};

export default OnepagePayPalCheckout;
