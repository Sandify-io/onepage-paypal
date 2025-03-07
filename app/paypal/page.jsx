"use client"

import React, { useEffect, useState } from "react";

const PayPalCheckout = () => {
  const [orderId, setOrderId] = useState(null);
  const [error, setError] = useState("");
  const [accessToken, setAccessToken] = useState(null);
  const clientId = "ASZaT72VoMoCjzE6TA8CmwDpyrDoUXGlPjXJZFGL70sbNpHvjJcAgAD96Wwa_3Iw4KAPFRVJtJ9cYwOs";
  const clientSecret = "ELCMyxPO25guCmusQP6_2c6q4SfIN-b1i9h9QbEI5q540YUQiixVIhk03FXOHx5_Fy0Xpj8V-sb19rT4";

  useEffect(() => {
    getAccessToken();
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
    script.async = true;
    script.onload = () => renderPayPalButton();
    document.body.appendChild(script);
  }, []);

  const getAccessToken = async () => {
    try {
      const response = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        },
        body: "grant_type=client_credentials",
      });
      
      const data = await response.json();
      if (data.access_token) {
        setAccessToken(data.access_token);
        console.log("✅ Access Token Retrieved:", data.access_token);
      } else {
        console.error("❌ Error retrieving access token", data);
      }
    } catch (error) {
      console.error("❌ Error fetching PayPal access token:", error);
    }
  };

  const createOrder = async () => {
    if (!accessToken) return;
    try {
      const response = await fetch("https://api-m.sandbox.paypal.com/v2/checkout/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [
            {
              amount: {
                currency_code: "USD",
                value: "100.00",
              },
            },
          ],
        }),
      });

      const orderData = await response.json();
      if (orderData.id) {
        setOrderId(orderData.id);
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

  const captureOrder = async (data) => {
    if (!data.orderID || !accessToken) {
      console.error("❌ No Order ID or Access Token found for capture.");
      return;
    }

    try {
      const response = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${data.orderID}/capture`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const orderData = await response.json();
      if (response.status !== 200 && response.status !== 201) {
        setError(orderData);
        console.error("❌ Error capturing PayPal order:", orderData);
      }

      console.log("✅ Capture result", orderData, JSON.stringify(orderData, null, 2));
      const transaction = orderData.purchase_units[0].payments.captures[0];
      alert(`✅ Transaction ${transaction.status}: ${transaction.id}`);
    } catch (error) {
      setError(error);
      console.error("❌ Error capturing PayPal order:", error);
    }
  };

  const renderPayPalButton = () => {
    let style = {
      color: "gold",
      height: 55,
      layout: "vertical",
      size: "medium",
      shape: "rect",
      tagline: false,
      fundingicons: false,
    };
    if (window.paypal) {
      window.paypal.Buttons({
        style: style,
        createOrder: async () => await createOrder(),
        onApprove: async (data) => await captureOrder(data),
      }).render("#paypal-button-container");
    }
  };

  return (
    <div className="p-4">
      <p className="text-lg font-semibold"> With PayPal API</p>
      <pre className="bg-gray-100 p-2 rounded-md text-sm mb-3">
          Using Client ID & Secret Key
      </pre>
      <div id="paypal-button-container"></div>
      {orderId && <p>🛒 Order ID: {orderId}</p>}
      {error && <p>❌ Error: {JSON.stringify(error)}</p>}
    </div>
  );
};

export default PayPalCheckout;