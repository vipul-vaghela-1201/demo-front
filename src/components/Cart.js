import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Cart = ({ orderId, cart, onOrder, onCheckout, onDownloadInvoice, onUpdateCart, productImages, paymentStatus, setPaymentStatus, setShipmentStatus, setCart, setTotalPrice, setBillingAddress, setShipmentAddress, setShowAddressFields }) => {
  const [newOrderId, setNewOrderId] = useState(orderId);
  const [searchError, setSearchError] = useState('');

  const totalPrice = cart.reduce((total, product) => total + product.price * product.quantity, 0);

  useEffect(() => {
    if (cart.length > 0) {
      setPaymentStatus({
        successful: false,
        orderId: '',
      });
    }
  }, [cart, setPaymentStatus]);

  const handleIncreaseQuantity = (productId) => {
    const updatedCart = cart.map((product) =>
      product.id === productId ? { ...product, quantity: product.quantity + 1 } : product
    );
    onUpdateCart(updatedCart);
  };

  const handleDecreaseQuantity = (productId) => {
    const updatedCart = cart.map((product) =>
      product.id === productId && product.quantity > 1
        ? { ...product, quantity: product.quantity - 1 }
        : product
    );
    onUpdateCart(updatedCart);
  };

  const handleSearchOrder = () => {
    axios.get(`http://localhost:8080/api/orders/${newOrderId}`)
      .then(response => {
        console.log('Order status response:', response.data);

        const createdAt = new Date(response.data.createdAt).getTime();
        const currentTime = new Date().getTime();
        const timeDifference = currentTime - createdAt;

        if (timeDifference >= 4 * 60 * 60 * 1000) {
          setShipmentStatus('Delivered');
        } else if (timeDifference >= 2 * 60 * 60 * 1000) {
          setShipmentStatus('In Transit');
        } else {
          setShipmentStatus('Order Placed');
        }

        setSearchError('');
        setPaymentStatus({
          successful: true,
          orderId: newOrderId,
        });
        setCart([]);
        setTotalPrice(0);
        setShipmentAddress('');
        setBillingAddress('');
        setShowAddressFields(false);
      })
      .catch(error => {
        console.error('Error checking order status:', error);
        setSearchError('Order not found or payment not successful.');
        setPaymentStatus({
          successful: false,
          orderId: '',
        });
      });
  };
  return (
    <div>
      <div>
        <input
          type="text"
          placeholder='Enter your order id to track shipment'
          value={newOrderId}
          onChange={(e) => setNewOrderId(e.target.value)}
        />
        <button onClick={handleSearchOrder}>Search</button>
        {searchError && <p style={{ color: 'red' }}>{searchError}</p>}
      </div>
      <div>
        {paymentStatus.successful === false && <h2>Cart</h2>}
        {cart.map((product) => (
          <div key={product.id} style={{ display: 'flex', alignItems: 'center' }}>
            <img
              src={productImages[product.id - 1]}
              alt={product.name}
              style={{ width: '50px', marginRight: '10px' }}
            />
            <div>
              <p>{product.name}</p>
              <p>
                Quantity: {product.quantity}{' '}
                <button onClick={() => handleIncreaseQuantity(product.id)}>+</button>
                <button onClick={() => handleDecreaseQuantity(product.id)}>-</button>
              </p>
            </div>
          </div>
        ))}
        {cart.length > 0 && <button onClick={onCheckout}>Proceed to Checkout</button>}
        {(cart.length === 0 && paymentStatus.successful === false) && <p>Cart is Empty. Please add an Item to cart</p>}
      </div>
      {paymentStatus.successful === false && cart.length > 0 && (
      <p>Total Price: ${totalPrice}</p>
      )}
      <div>
      {paymentStatus.successful && (
        <>
          <p>Payment is successful. Order ID is {paymentStatus.orderId}</p>
          <button onClick={onDownloadInvoice}>Download Invoice</button>
        </>
        )}
      </div>
    </div>
  );
};

export default Cart;
