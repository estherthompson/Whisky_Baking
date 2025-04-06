import React from 'react';
import '../styles/Home.css';

const Home = () => {
  return (
    <div className="home">
      <section className="hero">
        <h1>Welcome to Whisky Baking</h1>
        <p>Baking is Whisk-Y business!</p>
      </section>
      <section className="featured-recipes">
        <h2>Featured Recipes</h2>
        <div className="recipe-grid">
          {/* Recipe cards will go here */}
        </div>
      </section>
    </div>
  );
};

export default Home; 