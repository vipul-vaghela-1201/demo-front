import React, { useState, useEffect } from 'react';
import ProductsList from './components/ProductList';
import Cart from './components/Cart';
import Shipment from './components/Shipment';
import axios from 'axios';
import jsPDF from 'jspdf';

const App = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:8080/api/products')
      .then(response => setProducts(response.data))
      .catch(error => console.error('Error fetching products:', error));
  }, []);

  const [cart, setCart] = useState([]);
  const [orderId, setOrderId] = useState('');
  const [shipmentStatus, setShipmentStatus] = useState('Order Placed');
  const [sessionId, setSessionId] = useState('');
  const [totalPrice, setTotalPrice] = useState(0);
  const [findCartId, setFindCartId] = useState();
  const [showAddressFields, setShowAddressFields] = useState(false);
  const [shipmentAddress, setShipmentAddress] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [addressError, setAddressError] = useState('');
  const [paymentStatus, setPaymentStatus] = useState({
    successful: false,
    orderId: '',
  });

  useEffect(() => {
    const existingSessionId = sessionStorage.getItem('sessionId');
    const existingCart = JSON.parse(localStorage.getItem('cart')) || [];
    setCart(existingCart);

    if (existingCart.length > 0) {
      setPaymentStatus({
        successful: false,
        orderId: '',
      });

      setShipmentStatus('Order Placed');
      setShowAddressFields(true);
    }

    if (existingSessionId) {
      axios.get(`http://localhost:8080/api/sessions/${existingSessionId}`)
        .then(response => {
          console.log('Session exists in the database:', response.data);
          setSessionId(existingSessionId);
        })
        .catch(error => {
          console.error('Session not found in the database. Creating a new session:', error);

          const newSessionId = generateSessionId();
          setSessionId(newSessionId);
console.log("here it created new session ID");
          sessionStorage.setItem('sessionId', newSessionId);
          axios.post('http://localhost:8080/api/sessions', {
            sessionId: newSessionId,
          })
          .then(response => console.log('New session created and stored in the database:', response.data))
          .catch(error => console.error('Error cre    ating session:', error));
        });
    } else {
      const newSessionId = generateSessionId();
      setSessionId(newSessionId);

      sessionStorage.setItem('sessionId', newSessionId);

      axios.post('http://localhost:8080/api/sessions', {
        sessionId: newSessionId,
      })
      .then(response => console.log('Session created:', response.data))
      .catch(error => console.error('Error creating session:', error));
    }
  }, []);

  const generateSessionId = () => {
    return Math.random().toString(36).substring(7);
  };

  const handleAddToCart = (product) => {
    const existingProductIndex = cart.findIndex((item) => item.id === product.id);

    if (existingProductIndex !== -1) {
      const updatedCart = [...cart];
      updatedCart[existingProductIndex].quantity += 1;
      setCart(updatedCart);
      localStorage.setItem('cart', JSON.stringify(updatedCart));
    } else {
      const newCart = [...cart, { ...product, quantity: 1 }];
      setCart(newCart);
      localStorage.setItem('cart', JSON.stringify(newCart));
    }

    setPaymentStatus({
      successful: false,
      orderId: '',
    });

    setShipmentStatus('Order Placed');
    setShowAddressFields(true);
  };

  const handleOrder = (newOrderId) => {
    setOrderId(newOrderId);
  };

  const handleUpdateCart = (updatedCart) => {
    setCart(updatedCart);
    const newTotalPrice = updatedCart.reduce((total, product) => total + product.price * product.quantity, 0);
    setTotalPrice(newTotalPrice);

    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const handleCheckout = () => {
    if (!shipmentAddress || !billingAddress) {
      setAddressError('Both shipment and billing addresses are required.');
      return;
    }
    setAddressError('');
    
    const cartData = cart.map(product => ({
      cartId: sessionId,
      pname: product.name,
      quantity: product.quantity,
      price: product.quantity * product.price,
    }));

    axios.post(`http://localhost:8080/api/carts`, cartData)
      .then(response => {
        console.log('Cart entries created successfully:', response.data);

        const orderData = {
          orderId: sessionId,
          totalAmount: cartData.price,
        };
console.log(orderData);
        axios.post(`http://localhost:8080/api/orders`, orderData)
          .then(orderResponse => {
            console.log('Order created successfully:', orderResponse.data);
          setCart([]);
          setTotalPrice(0);

          setPaymentStatus({
            successful: true,
            orderId: sessionId,
          });

          setShipmentAddress('');
          setBillingAddress('');
          setShowAddressFields(false);

          const genSessionId = generateSessionId();
          setSessionId(genSessionId);
    
          sessionStorage.setItem('sessionId', genSessionId);
    
          axios.post('http://localhost:8080/api/sessions', {
            sessionId: genSessionId,
          })
          .then(response => console.log('Session created:', response.data))

          const shipmentData = [
            {
              shipmentId: sessionId,
              shipmentAddress: shipmentAddress,
              billAddress: billingAddress,
            }
          ]
      
          axios.post(`http://localhost:8080/api/shipments`, shipmentData)
            .then(response => {
              console.log('Shipment created successfully:', response.data)
              .catch(error => console.error('Error creating shipment:', error));
          })
          .catch(error => console.error('Error creating session:', error));
          })
          .catch(orderError => console.error('Error creating order:', orderError));
      })
      .catch(error => console.error('Error creating cart entries:', error));
      localStorage.removeItem('cart');
  };

  useEffect(() => {
    const fetchCartEntries = async () => {
      try {
        if (paymentStatus.orderId) {
          const response = await axios.get(`http://localhost:8080/api/carts/${paymentStatus.orderId}`);
          setFindCartId(response.data);
        }
      } catch (error) {
        console.error('Error fetching cart entries by order id:', error);
      }
    };

    fetchCartEntries();
  }, [paymentStatus.orderId]);

  const handleDownloadInvoice = () => {
    const pdf = new jsPDF();

    pdf.setProperties({
      title: 'Invoice',
      subject: 'Invoice for Products',
      author: 'Your Company',
    });
  
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    const headerY = 20;
    pdf.text('Invoice', 20, headerY);

    pdf.setFontSize(12);
    const headers = ['Product Name', 'quantity', 'Price'];
    const columnWidths = [80, 40, 40];
    let currentX = 20;
    let startY = 40;

    headers.forEach((header, index) => {
      pdf.text(header, currentX, startY);
      currentX += columnWidths[index];
    });
    if (findCartId) {
      findCartId.forEach((product) => {
        startY += 10;
        pdf.text(product.pname, 20, startY);
        pdf.text(product.quantity.toString(), 100, startY);
        pdf.text(product.price.toString(), 140, startY);
      });
    }
  
    pdf.save(`invoice_${paymentStatus.orderId}.pdf`);
  };

  return (
    <div style={{ display: 'flex' }}>
      <div style={{ width: '60%', padding: '20px' }}>
        <ProductsList
          products={products}
          onAddToCart={handleAddToCart}
        />
      </div>
      <div style={{ width: '40%', padding: '20px' }}>
        <Cart
          orderId={orderId}
          cart={cart}
          onOrder={handleOrder}
          onCheckout={handleCheckout}
          onDownloadInvoice={handleDownloadInvoice}
          onUpdateCart={handleUpdateCart}
          totalPrice={totalPrice}
          paymentStatus={paymentStatus}
          setPaymentStatus={setPaymentStatus}
          setShipmentStatus={setShipmentStatus }
          setCart={setCart}
          setTotalPrice={setTotalPrice}
          setBillingAddress={setBillingAddress}
          setShipmentAddress={setShipmentAddress}
          setShowAddressFields={setShowAddressFields}
        />
        {showAddressFields && (
          <div>
            <input
              type="text"
              placeholder="Shipment Address"
              value={shipmentAddress}
              onChange={(e) => setShipmentAddress(e.target.value)}
            />
            <input
              type="text"
              placeholder="Billing Address"
              value={billingAddress}
              onChange={(e) => setBillingAddress(e.target.value)}
            />
            {addressError && <p style={{ color: 'red' }}>{addressError}</p>}
          </div>
        )}
        {paymentStatus.successful && (
          <Shipment status={shipmentStatus} />
        )}
      </div>
    </div>
  );
};

export default App;