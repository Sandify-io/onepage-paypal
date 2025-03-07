"use client"

import React, { useEffect, useState } from "react";

const OnepagePayPalCheckout = () => {
  const [orderId, setOrderId] = useState(null); // Lưu order_id sau khi tạo đơn hàng
  const [isSubmitting, setSubmitting] = useState(false)
  const [error, setError] = useState(""); // Lưu order_id sau khi tạo đơn hàng
  const partnerClientId = "AYs-QzyPzP9sOtfock0KgO6debvstBRqc4J13PIoMEjgGMQgKRFwlUWpLUF2dOyi5KYfuMCMcnQTxBqF"
  const merchantClientId = "Z25Q4GHJXTWVN"
    const [cardError, setCardError] = useState({
    'Error: INVALID_CVV': false, 
    'Error: INVALID_NUMBER': false, 
    'Error: INVALID_EXPIRY': false
  })
  useEffect(() => {
    // Load PayPal SDK
    let components = ['buttons']
    let paypalScrip = `https://www.paypal.com/sdk/js?client-id=${partnerClientId}&currency=USD&merchant-id=${merchantClientId}`
    components.push('card-fields')
    paypalScrip += `&components=${components.join(',')}`
    const script = document.createElement("script");
    script.src = paypalScrip;
    script.async = true;
    script.onload = () => renderPayPalACDC();
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
  const onApprove = async (data) => {
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
  const renderPayPalACDC = () => {
    const cardField = window.paypal.CardFields({
      createOrder: createOrder,
      onApprove: onApprove,
      style: {
        'input': {
            'padding': '15px 20px',
            'color': '#363636',
            'font-size': '1rem'
        },
      },
      inputEvents: {
          onChange: (data) => {
            console.log("onChange", data)
              // Do something when an input changes
          },
          onFocus: (data) => {
            console.log("onFocus", data)
              // Do something when a field gets focus
          },
          onBlur: (data) => {
            console.log("onBlur", data)
              // Do something when a field loses focus
          },
          onInputSubmitRequest: (data) => {
            console.log("onInputSubmitRequest", data)
              if (data.isFormValid) {
                  // Submit the card form for the payer
              } else {
                  // Inform payer that some fields are not valid
              }
          }
      }
    })

    // Render each field after checking for eligibility
    if (cardField.isEligible()) {
      const nameField = cardField.NameField();
      nameField.render("#card-name-field-container");

      const numberField = cardField.NumberField();
      numberField.render("#card-number-field-container");

      const cvvField = cardField.CVVField();
      cvvField.render("#card-cvv-field-container");

      const expiryField = cardField.ExpiryField();
      expiryField.render("#card-expiry-field-container");

      // Add click listener to submit button and call the submit function on the CardField component
      const multiCard = document.getElementById("multi-card-field-button")
      if (typeof multiCard === 'undefined' || multiCard === null ) {
        return
      }
      multiCard.addEventListener("click", () => {
        setSubmitting(true)
        setCardError({
          'Error: INVALID_CVV': false, 
          'Error: INVALID_NUMBER': false, 
          'Error: INVALID_EXPIRY': false
        })
        cardField.submit().catch((error) => {
          setCardError((cardError) => {
            cardError[error] = true
            return cardError
          })
          setSubmitting(false)
          // resultMessage(
          //   `Sorry, your transaction could not be processed...<br><br>${error}`,
          // );
        });
      });
    } else {
      // Hides card fields if the merchant isn't eligible
      document.querySelector("#card-form").style = "display: none";
    }
  };

  return (
    <div className="p-4">
      <p className="text-lg font-semibold">With Onepage API, PayPal ACDC</p>
      <pre className="bg-gray-100 p-2 rounded-md text-sm mb-3">
          Using Partner Client ID & Client Merchant ID
      </pre>
      <div className="card-form" id="card-form">
        <div className="mb-2 font-medium">Card information</div>
        <div className="hidden" id="card-name-field-container"></div>
        <div>
          <div className="control">
            <div id="card-number-field-container"></div>
            <p className="text-red-500 text-sm">{ cardError['Error: INVALID_NUMBER'] && 'Card number invalid'}</p>
          </div>
        </div>
        <div className="flex space-x-2 mt-2">
          <div className="flex-1">
            <div className="control">
              <div id="card-expiry-field-container"></div>
              <p className="text-red-500 text-sm">{ cardError['Error: INVALID_EXPIRY'] && 'Card expiration date invalid'}</p>
            </div>
          </div>
          <div className="flex-1">
            <div className="control">
              <div id="card-cvv-field-container"></div>
              <p className="text-red-500 text-sm">{ cardError['Error: INVALID_CVV'] && 'Card CVV invalid'}</p>
            </div>
          </div>
        </div>
        <button
          id="multi-card-field-button"
          className={`mt-4 w-full py-2 px-4 rounded-md text-white font-bold ${isSubmitting ? 'bg-blue-500 opacity-75 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          type="button"
          disabled={isSubmitting} // Prevents invalid submissions
        >
          <div className="flex items-center justify-center">
            {isSubmitting ?
              <strong>Processing...</strong> :
              <strong>Pay now</strong>
            }
          </div>
        </button> 
      </div>
    </div>

  );
};

export default OnepagePayPalCheckout;
