import React, { useState } from 'react';
import axios from 'axios';

const ProductsList = ({ products, onAddToCart, productImages }) => {
  const [searchText, setSearchText] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = () => {
    axios.get(`http://localhost:8080/api/products/filterByName?name=${searchText}`)
      .then(response => setFilteredProducts(response.data))
      .catch(error => console.error('Error filtering products:', error));
      setSearched(true);
  };

  return (
    <div>
      <div>
        <input
          type="text"
          placeholder='search product'
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <button onClick={handleSearch}>Search</button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {(searched === true && searchText !== '' ? filteredProducts : products).map((product, index) => (
          <div key={product.id} style={{ margin: '10px', textAlign: 'center' }}>
            <img src={productImages[index]} alt={product.name} style={{ width: '100px' }} />
            <p>{product.name}</p>
            <p>${product.price}</p>
            <button onClick={() => onAddToCart(product)}>Add to Cart</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductsList;
