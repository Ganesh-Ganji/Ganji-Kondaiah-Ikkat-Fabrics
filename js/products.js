// The catalogue lives in data/products.json so product edits need no code changes.
window.ProductCatalogue = {
  async load() {
    const response = await fetch('data/products.json');
    if (!response.ok) throw new Error(`Could not load products.json (${response.status})`);
    const products = await response.json();
    if (!Array.isArray(products)) throw new Error('products.json must contain a list of products.');
    return products;
  }
};
