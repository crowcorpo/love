import React, { useState } from "react";
import { AuthProvider } from './authcontext.jsx';

import "./navbar.css";
import Navbar from "./navbar.jsx";

import "./sliderprograme.css";
import Slider from "./sliderprograme.jsx";

import "./uploadprogram.css";
import Test2 from "./uploadprogram.jsx";

import "./shoppage2.css";
import ShopPage2 from "./shoppage2.jsx";

import "./footer.css";
import Footer from "./footer.jsx";

function App() {

    const [ selectedProduct, setselectedProduct ] = useState(null);

    return (
        <AuthProvider>

            <Navbar hideLinks={ !!selectedProduct }/>

            { selectedProduct
                ? <ShopPage2
                    productId={ selectedProduct }
                    onBack={ () => {
                        setselectedProduct(null);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  />
                : <>
                    <div id="hero">
                        <Slider/>
                    </div>
                    <Test2 onProductClick={ (id) => {
                        setselectedProduct(id);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}/>
                  </>
            }

            <Footer id="footer"/>

        </AuthProvider>
    );
}

export default App;